# Prompt Enhancer — Signal Chain Studio 🎛️

> Turn rough, single-line instructions into structured, production-ready prompts and launch them into your favorite AI tools with one click.

Prompt Enhancer is a web application designed with a mixing-console / signal-chain aesthetic (**Input → Shape → Output**). It shapes unrefined prompt ideas by framing roles, establishing clear tasks, enforcing output constraints, and generating step-by-step reasoning structure. Once enhanced, you can instantly copy and launch your prompt into **ChatGPT**, **Claude**, **Gemini**, **Perplexity**, **DeepSeek**, **Midjourney**, or **Copilot**.

---

## ✨ Features

- ⚡ **Smart AI Prompt Enhancer**: Converts vague instructions into detailed, high-context AI prompts using AI API integration with intelligent fallback logic.
- 🚀 **AI Tools Quick Launcher & Redirect**: Direct one-click launcher buttons for 7 top AI tools:
  - 🤖 **ChatGPT**
  - 🧠 **Claude**
  - 💎 **Google Gemini**
  - 🔍 **Perplexity**
  - ⚡ **DeepSeek**
  - 🎨 **Midjourney**
  - 🌐 **Microsoft Copilot**
- 📋 **One-Click Auto-Copy & Toast Feedback**: Copies the enhanced prompt to your clipboard and opens the AI platform in a new tab, pre-filling the prompt via query string on the five tools that support it. The toast reports what actually happened, so you always know whether you still need to paste.
- 📝 **Plain-Text Output**: Enhanced prompts are emitted as plain text with no Markdown symbols (`#`, `*`, `_`, backticks), so they paste cleanly into any destination — including tools that do not render Markdown.
- 🎨 **Signal-Chain Studio Aesthetic**: Tactile studio mixing-gear UI with animated VU meters, brass highlights, signal LEDs, dark/light theme switching, and responsive design.
- 📚 **Template Library**: Quick-apply presets for Code, Writing, Marketing, Business, Technical Docs, Social Media, and Image FX (Midjourney).
- 🎚️ **Prompt Style Control**: Choose Concise, Balanced, or Detailed to set how much the enhancer expands each section.
- 💾 **Local Saved Prompts**: Save, load, and manage your favorite prompt history in browser storage.

---

## 🛠️ Tech Stack

- **Frontend**: HTML5, Vanilla CSS3 (Custom Properties, Flexbox & CSS Grid, Animations), Vanilla JavaScript (ES Modules).
- **Backend**: Node.js + Express proxy (`server.js`) that keeps the AI API key server-side, with a Netlify Function (`netlify/functions/enhance.mjs`) serving the same `/api/enhance` route in production. Both share their validation and request building via `lib/enhance-core.js`.
- **AI Integration**: OpenAI-compatible REST API (Groq) with a client-side fallback engine that shapes the prompt locally whenever the API is unreachable.
- **Styling**: Google Fonts (`Oswald`, `Work Sans`, `JetBrains Mono`).

---

## 📁 Project Structure

```text
prompt-enhancer/
├── index.html              # The entire studio application
├── server.js               # Express server + /api/enhance proxy (local development)
├── netlify.toml            # Netlify build config
├── netlify/
│   └── functions/
│       └── enhance.mjs     # Serverless /api/enhance proxy (declares its own route)
├── lib/
│   └── enhance-core.js     # Validation, limits, and Groq request building (shared)
├── css/
│   └── style.css           # Core design system & Signal Chain studio styling
├── js/
│   └── enhancer.js         # Core enhancer engine, AI launcher, and page routing
├── .env.example            # Template for the required server-side variables
└── README.md               # Project documentation
```

---

## 🚀 Getting Started

### 1. Local Setup

The app calls its own `/api/enhance` endpoint so the AI key never reaches the browser, so run the bundled Express server rather than a plain static server.

```bash
npm install
cp .env.example .env   # then add your real GROQ_API_KEY
npm start
```

Open `http://localhost:3000` in your browser.

`.env` holds the server-side configuration and is git-ignored:

| Variable | Required | Purpose |
| --- | --- | --- |
| `GROQ_API_KEY` | Yes | Private API key; the server refuses to enhance without it. |
| `GROQ_ENDPOINT` | No | Defaults to the Groq OpenAI-compatible chat completions URL. |
| `GROQ_MODEL` | No | Model id, e.g. `openai/gpt-oss-120b`. |
| `PORT` | No | Defaults to `3000`. |

Because the project uses native ES Modules (`type="module"`), it must be served over HTTP — opening the HTML files directly from disk will not work. If the API key is missing or the request fails, the UI still produces a prompt using the local fallback engine and shows the reason above the output.

---

### 2. Request Limits

`/api/enhance` spends real API credits, so both implementations enforce the same limits from `lib/enhance-core.js`:

| Limit | Value | Enforced by |
| --- | --- | --- |
| Prompt length | 4,000 characters | `lib/enhance-core.js` (and `maxlength` on the textarea) |
| Request body | 16 KB | Express `json` limit / `Content-Length` check |
| Response length | 1,200 output tokens | `max_tokens` on the Groq request |
| Request rate | 10 per 60s per IP | Netlify platform rate limiting (deployed only) |

Requests carrying an unexpected `model` field are ignored rather than honoured, so a caller cannot select a more expensive model. Rate limiting is enforced by Netlify and therefore does **not** apply to the local Express server.

---

## ⚙️ How the AI Quick Launcher Works

1. Enter a rough prompt in the **Raw Input** text area.
2. Click **Enhance** to generate the shaped output prompt.
3. In the **Enhanced Output** panel, click any AI tool button (**ChatGPT**, **Claude**, **Gemini**, etc.).
4. The app copies the enhanced prompt to your system clipboard (`navigator.clipboard.writeText`), opens the selected service in a new tab, and shows a toast describing the outcome.

Only some services accept a prompt through the URL, so the behaviour differs per tool:

| Tool | Prompt pre-filled | Launch URL |
| --- | --- | --- |
| ChatGPT | Yes | `chatgpt.com/?q=…` |
| Claude | Yes | `claude.ai/new?q=…` |
| Perplexity | Yes | `perplexity.ai/search?q=…` |
| Midjourney | Yes | `midjourney.com/imagine?prompt=…` |
| Copilot | Yes | `copilot.microsoft.com/?q=…` |
| Google Gemini | No — paste from clipboard | `gemini.google.com/app` |
| DeepSeek | No — paste from clipboard | `chat.deepseek.com/` |

The toast reflects which path was taken: `Launching [Tool] with your prompt...` when the prompt travelled in the URL, `Prompt copied — paste it into [Tool].` when it did not, and `Opening [Tool] — copy the prompt manually.` if the clipboard write itself was blocked.

Prompts longer than roughly 1,800 characters of URL are not sent as a query string, since browsers and origin servers start dropping requests past about 2 KB. Those launches fall back to opening the tool's home page with the prompt on your clipboard.

---

## ☁️ Deployment (Netlify)

`netlify.toml` publishes the repository root. The function claims `/api/enhance` through its own `config.path` rather than a redirect, because Netlify's `rateLimit` rule only applies to a path the function declares itself.

1. Connect the repository to a Netlify site.
2. Under **Site configuration → Environment variables**, add `GROQ_API_KEY` (plus `GROQ_ENDPOINT` / `GROQ_MODEL` to override the defaults).
3. Deploy. `netlify/functions/enhance.mjs` serves the same contract as the local Express route.

By default only the deployed site's own origin and `localhost` may call the endpoint; set `ALLOWED_ORIGINS` (comma-separated) to permit others.

Never commit `.env` or expose the key to the client — both proxies exist specifically to keep it server-side.

---

## 👤 Author

**Partha Sarathi**
- GitHub: [@Partha-Sarathi-Developer](https://github.com/Partha-Sarathi-Developer)

---

## 📄 License

Published under the ISC license declared in `package.json`.
