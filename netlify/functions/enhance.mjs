import core from '../../lib/enhance-core.js';

function jsonResponse(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function errorResponse(error) {
  return jsonResponse(error.status, { error: error.message });
}

export default async (req) => {
  try {
    if (req.method !== 'POST') {
      return errorResponse(core.ERRORS.methodNotAllowed);
    }

    if (!core.isOriginAllowed(req.headers.get('origin'), process.env)) {
      return errorResponse(core.ERRORS.originBlocked);
    }

    const declaredLength = Number(req.headers.get('content-length'));
    if (Number.isFinite(declaredLength) && declaredLength > core.MAX_BODY_BYTES) {
      return errorResponse(core.ERRORS.bodyTooLarge);
    }

    const parsed = core.parseBody(await req.text());
    if (!parsed.ok) {
      return errorResponse(parsed.error);
    }

    const validated = core.validateRequest(parsed.body);
    if (!validated.ok) {
      return errorResponse(validated.error);
    }

    const config = core.resolveConfig(process.env);
    if (!config.apiKey) {
      console.error('GROQ_API_KEY is not set; refusing to enhance.');
      return errorResponse(core.ERRORS.misconfigured);
    }

    const result = await core.requestEnhancement({
      raw: validated.raw,
      options: validated.options,
      config,
    });

    if (!result.ok) {
      return errorResponse(result.error);
    }

    return jsonResponse(200, { output: result.output });
  } catch (error) {
    console.error('Unexpected error in /api/enhance:', error);
    return errorResponse(core.ERRORS.unexpected);
  }
};

// `rateLimit` requires `path`, which is why this route is declared here rather than
// through a netlify.toml redirect. Netlify enforces the limit and returns 429 itself.
export const config = {
  path: '/api/enhance',
  rateLimit: {
    windowLimit: 10,
    windowSize: 60,
    aggregateBy: ['ip', 'domain'],
  },
};
