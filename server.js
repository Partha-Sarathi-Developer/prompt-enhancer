require('dotenv').config();
const express = require('express');
const path = require('path');
const core = require('./lib/enhance-core');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '16kb' }));
app.use(express.static(path.join(__dirname)));

function sendError(res, error) {
  return res.status(error.status).json({ error: error.message });
}

app.post('/api/enhance', async (req, res) => {
  try {
    if (!core.isOriginAllowed(req.get('origin'), process.env)) {
      return sendError(res, core.ERRORS.originBlocked);
    }

    const validated = core.validateRequest(req.body);
    if (!validated.ok) {
      return sendError(res, validated.error);
    }

    const config = core.resolveConfig(process.env);
    if (!config.apiKey) {
      console.error('GROQ_API_KEY is not set; refusing to enhance.');
      return sendError(res, core.ERRORS.misconfigured);
    }

    const result = await core.requestEnhancement({
      raw: validated.raw,
      options: validated.options,
      config,
    });

    if (!result.ok) {
      return sendError(res, result.error);
    }

    return res.json({ output: result.output });
  } catch (error) {
    console.error('Unexpected error in /api/enhance:', error);
    return sendError(res, core.ERRORS.unexpected);
  }
});

app.all('/api/enhance', (_req, res) => sendError(res, core.ERRORS.methodNotAllowed));

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

// Express's JSON parser rejects oversized or malformed bodies before the route runs,
// so translate those into the same shapes the route would have returned.
app.use((error, _req, res, next) => {
  if (!error) return next();

  if (error.type === 'entity.too.large') {
    return sendError(res, core.ERRORS.bodyTooLarge);
  }

  if (error.type === 'entity.parse.failed') {
    return sendError(res, core.ERRORS.invalidRequest);
  }

  console.error('Unhandled server error:', error);
  return sendError(res, core.ERRORS.unexpected);
});

app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }

  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Prompt Enhancer backend running on http://localhost:${port}`);
});
