// Shared by server.js (local Express) and netlify/functions/enhance.mjs.
// Kept as CommonJS so both require() and an ESM default import can load it.

const MAX_RAW_CHARS = 4000;
const MAX_BODY_BYTES = 16384;
const MAX_OUTPUT_TOKENS = 1200;

const DEFAULT_MODEL = 'openai/gpt-oss-120b';
const DEFAULT_GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

const STYLE_INSTRUCTIONS = {
  concise: 'Keep the enhanced prompt tight: include only the sections that add real value and prefer short lines.',
  balanced: 'Aim for a balanced level of detail: cover each section without padding.',
  detailed: 'Expand each section with specific, actionable guidance and explicit success criteria.',
};

const ERRORS = {
  invalidRequest: { status: 400, message: 'Invalid request.' },
  rawRequired: { status: 400, message: 'Prompt text is required.' },
  rawTooLong: { status: 400, message: `Prompt is too long. Keep it under ${MAX_RAW_CHARS} characters.` },
  bodyTooLarge: { status: 413, message: 'Request too large.' },
  originBlocked: { status: 403, message: 'Request blocked.' },
  methodNotAllowed: { status: 405, message: 'Method not allowed.' },
  misconfigured: { status: 500, message: 'Server misconfigured.' },
  upstreamFailed: { status: 502, message: 'AI service is unavailable. Try again shortly.' },
  unexpected: { status: 500, message: 'Unexpected server error.' },
};

function resolveConfig(env) {
  return {
    apiKey: env.GROQ_API_KEY,
    endpoint: env.GROQ_ENDPOINT || DEFAULT_GROQ_ENDPOINT,
    model: env.GROQ_MODEL || DEFAULT_MODEL,
  };
}

// A missing Origin is allowed: direct navigation and non-browser clients send none,
// and this check only meaningfully stops another site's JavaScript. It is trivially
// forged, so it is a courtesy layer, not the abuse control.
function isOriginAllowed(origin, env) {
  if (!origin) return true;
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;

  const allowed = ['URL', 'DEPLOY_PRIME_URL', 'DEPLOY_URL']
    .map((key) => env[key])
    .concat((env.ALLOWED_ORIGINS || '').split(','))
    .map((value) => (value || '').trim().replace(/\/$/, ''))
    .filter(Boolean);

  return allowed.includes(origin.replace(/\/$/, ''));
}

function parseBody(text) {
  if (typeof text === 'string' && Buffer.byteLength(text, 'utf8') > MAX_BODY_BYTES) {
    return { ok: false, error: ERRORS.bodyTooLarge };
  }

  try {
    return { ok: true, body: JSON.parse(text || '{}') };
  } catch {
    return { ok: false, error: ERRORS.invalidRequest };
  }
}

// Accepts only `raw` and `options`; every other field in the body is ignored so a
// caller cannot smuggle in an expensive model or upstream parameters.
function validateRequest(body) {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: ERRORS.invalidRequest };
  }

  const { raw, options } = body;

  if (typeof raw !== 'string' || !raw.trim()) {
    return { ok: false, error: ERRORS.rawRequired };
  }

  if (raw.length > MAX_RAW_CHARS) {
    return { ok: false, error: ERRORS.rawTooLong };
  }

  return {
    ok: true,
    raw,
    options: options && typeof options === 'object' ? options : {},
  };
}

function buildGroqPayload(raw, options, model) {
  const style = STYLE_INSTRUCTIONS[options.style] || STYLE_INSTRUCTIONS.balanced;

  return {
    model,
    temperature: 0.3,
    max_tokens: MAX_OUTPUT_TOKENS,
    messages: [
      {
        role: 'system',
        content: [
          'You are a prompt engineering assistant.',
          'Rewrite the user raw request into a polished, well-structured prompt.',
          'Preserve the intent and improve clarity.',
          'Write the enhanced prompt as plain text with no Markdown symbols (no #, *, _, or backticks); label each section with a plain word followed by a colon.',
          style,
          'Return only the final enhanced prompt text.',
        ].join(' '),
      },
      {
        role: 'user',
        content: [
          `Raw request: ${raw}`,
          `Options: role=${Boolean(options.role)}, task=${Boolean(options.task)}, format=${Boolean(options.format)}, constraints=${Boolean(options.constraints)}, examples=${Boolean(options.examples)}, reasoning=${Boolean(options.reasoning)}`,
        ].join('\n\n'),
      },
    ],
  };
}

// Calls Groq and returns either the finished text or one of ERRORS. Upstream failure
// detail is logged rather than returned, since the client renders the message verbatim.
async function requestEnhancement({ raw, options, config }) {
  const response = await fetch(config.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(buildGroqPayload(raw, options, config.model)),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error('Groq request failed:', response.status, data?.error?.message || '(no message)');
    return { ok: false, error: ERRORS.upstreamFailed };
  }

  const output = data?.choices?.[0]?.message?.content?.trim();

  if (!output) {
    console.error('Groq returned an empty completion.');
    return { ok: false, error: ERRORS.upstreamFailed };
  }

  return { ok: true, output };
}

module.exports = {
  MAX_RAW_CHARS,
  MAX_BODY_BYTES,
  MAX_OUTPUT_TOKENS,
  DEFAULT_MODEL,
  ERRORS,
  resolveConfig,
  isOriginAllowed,
  parseBody,
  validateRequest,
  buildGroqPayload,
  requestEnhancement,
};
