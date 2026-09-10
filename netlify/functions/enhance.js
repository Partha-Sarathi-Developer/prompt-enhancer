exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { raw, options = {} } = JSON.parse(event.body || '{}');
    const apiKey = process.env.GROQ_API_KEY;
    const endpoint = process.env.GROQ_ENDPOINT || 'https://api.groq.com/openai/v1/chat/completions';
    const model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

    if (!raw || typeof raw !== 'string' || !raw.trim()) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Prompt text is required.' }) };
    }

    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Server is missing GROQ_API_KEY. Set it in the Netlify site environment variables.' }) };
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
              options.outputFormat === 'plain'
                ? 'Write the enhanced prompt as plain text with no Markdown symbols (no #, *, _, or backticks); label each section with a plain word followed by a colon.'
                : 'Write the enhanced prompt using Markdown headings and bullet lists.',
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
      return { statusCode: response.status, body: JSON.stringify({ error: message }) };
    }

    const content = data?.choices?.[0]?.message?.content?.trim();
    if (!content) {
      return { statusCode: 502, body: JSON.stringify({ error: 'AI returned an empty response.' }) };
    }

    return { statusCode: 200, body: JSON.stringify({ output: content }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message || 'Unexpected server error' }) };
  }
};
