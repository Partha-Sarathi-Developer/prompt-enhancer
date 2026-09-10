require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname)));

app.post('/api/enhance', async (req, res) => {
  try {
    const { raw, options = {} } = req.body || {};
    const apiKey = process.env.GROQ_API_KEY;
    const endpoint = process.env.GROQ_ENDPOINT || 'https://api.groq.com/openai/v1/chat/completions';
    const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

    if (!raw || typeof raw !== 'string' || !raw.trim()) {
      return res.status(400).json({ error: 'Prompt text is required.' });
    }

    if (!apiKey) {
      return res.status(500).json({ error: 'Server is missing GROQ_API_KEY. Keep the key in the .env file only.' });
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        messages: [
          {
            role: 'system',
            content: [
              'You are a prompt engineering assistant.',
              'Rewrite the user raw request into a polished, well-structured prompt.',
              'Preserve the intent and improve clarity.',
              'Write the enhanced prompt as plain text with no Markdown symbols (no #, *, _, or backticks); label each section with a plain word followed by a colon.',
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
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = data?.error?.message || 'AI request failed';
      return res.status(response.status).json({ error: message });
    }

    const content = data?.choices?.[0]?.message?.content?.trim();
    if (!content) {
      return res.status(502).json({ error: 'AI returned an empty response.' });
    }

    return res.json({ output: content });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Unexpected server error' });
  }
});

app.get('/health', (_req, res) => {
  res.json({ ok: true });
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
