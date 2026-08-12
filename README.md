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
- 📋 **One-Click Auto-Copy & Toast Feedback**: Automatically copies the enhanced prompt to your clipboard and opens the AI platform in a new tab with pre-filled query strings where supported.
- 🎨 **Signal-Chain Studio Aesthetic**: Tactile studio mixing-gear UI with animated VU meters, brass highlights, signal LEDs, dark/light theme switching, and responsive design.
- 📚 **Template Library**: Quick-apply presets for Code, Writing, Marketing, Business, Technical Docs, Social Media, and Image FX (Midjourney).
- 💾 **Local Saved Prompts**: Save, load, and manage your favorite prompt history in browser storage.
- 🔐 **Firebase Authentication**: Email/password and Google Sign-in integration with route protection.

---

## 🛠️ Tech Stack

- **Frontend**: HTML5, Vanilla CSS3 (Custom Properties, Flexbox & CSS Grid, Animations), Vanilla JavaScript (ES Modules).
- **Backend / Auth**: Firebase Authentication (Email/Password & Google OAuth).
- **AI Integration**: OpenAI-compatible REST API integration (Groq / LLaMA 3.3 70B) with client-side fallback engine.
- **Styling**: Google Fonts (`Oswald`, `Work Sans`, `JetBrains Mono`).

---

## 📁 Project Structure

```text
prompt-enhancer/
├── index.html            # Main studio application & authentication landing page
├── app.html              # Standalone app view
├── css/
│   └── style.css         # Core design system & Signal Chain studio styling
├── js/
│   ├── auth.js           # Authentication logic (Firebase auth & validation)
│   ├── enhancer.js       # Core enhancer engine, AI launcher, and page routing
│   └── firebase-config.js # Firebase project configuration
└── README.md             # Project documentation
```

---

## 🚀 Getting Started

### 1. Local Setup

Because the project utilizes native ES Modules (`type="module"`), serve it via HTTP rather than opening local files directly.

```bash
# Option 1: Node.js static server
npx serve .

# Option 2: Python HTTP Server
python -m http.server 8080
```

Open `http://localhost:3000` (or `http://localhost:8080`) in your browser.

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
4. The app will:
   - Copy the enhanced prompt to your system clipboard (`navigator.clipboard.writeText`).
   - Display a toast notification: `Prompt copied! Launching [AI Tool]...`.
   - Open the selected AI service in a new tab, passing pre-filled query parameters where supported.

---

## 👤 Author

**Partha Sarathi**
- GitHub: [@Partha-Sarathi-Developer](https://github.com/Partha-Sarathi-Developer)

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
