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
- 💾 **Local Saved Prompts**: Save, load, and manage your favorite prompt history in browser storage.
- 🔐 **Firebase Authentication**: Email/password and Google Sign-in integration with route protection.

---

## 🛠️ Tech Stack

- **Frontend**: HTML5, Vanilla CSS3 (Custom Properties, Flexbox & CSS Grid, Animations), Vanilla JavaScript (ES Modules).
- **Backend**: Node.js + Express proxy (`server.js`) that keeps the AI API key server-side, with a Netlify Function (`netlify/functions/enhance.js`) serving the same `/api/enhance` route in production.
- **Auth**: Firebase Authentication (Email/Password & Google OAuth).
- **AI Integration**: OpenAI-compatible REST API (Groq) with a client-side fallback engine that shapes the prompt locally whenever the API is unreachable.
- **Styling**: Google Fonts (`Oswald`, `Work Sans`, `JetBrains Mono`).

---

## 📁 Project Structure

```text
prompt-enhancer/
├── index.html              # Main studio application & authentication landing page
├── app.html                # Standalone app view
├── server.js               # Express server + /api/enhance proxy (local development)
├── netlify.toml            # Netlify build config & /api/enhance redirect
├── netlify/
│   └── functions/
│       └── enhance.js      # Serverless equivalent of the /api/enhance proxy
├── css/
│   └── style.css           # Core design system & Signal Chain studio styling
├── js/
│   ├── auth.js             # Authentication logic (Firebase auth & validation)
│   ├── enhancer.js         # Core enhancer engine, AI launcher, and page routing
│   └── firebase-config.js  # Firebase project configuration
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

### 2. Firebase Configuration (Optional)

To enable live Firebase Email & Google Authentication:
1. Create a project in the [Firebase Console](https://console.firebase.google.com/).
2. Enable **Email/Password** and **Google** under **Authentication → Sign-in method**.
3. Update `js/firebase-config.js` with your project's configuration object:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

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

`netlify.toml` publishes the repository root and redirects `/api/enhance` to the bundled function, so the frontend needs no changes between local and deployed environments.

1. Connect the repository to a Netlify site.
2. Under **Site configuration → Environment variables**, add `GROQ_API_KEY` (plus `GROQ_ENDPOINT` / `GROQ_MODEL` to override the defaults).
3. Deploy. `netlify/functions/enhance.js` serves the same contract as the local Express route.

Never commit `.env` or expose the key to the client — both proxies exist specifically to keep it server-side.

---

## 👤 Author

**Partha Sarathi**
- GitHub: [@Partha-Sarathi-Developer](https://github.com/Partha-Sarathi-Developer)

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
