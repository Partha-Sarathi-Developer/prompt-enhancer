const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const DEFAULT_OPTIONS = {
  role: true,
  task: true,
  format: true,
  constraints: true,
  examples: false,
  reasoning: false,
};

const DEFAULT_API_KEY = "";
const DEFAULT_ENDPOINT = "/api/enhance";
const DEFAULT_MODEL = "llama-3.3-70b-versatile";
const SAVED_PROMPTS_KEY = "promptEnhancer.savedPrompts";
const MAX_SAVED_PROMPTS = 8;
const THEME_KEY = "promptEnhancer.theme";
const API_KEY_STORAGE_KEY = "promptEnhancer.apiKey";
const API_ENDPOINT_STORAGE_KEY = "promptEnhancer.apiEndpoint";
const API_MODEL_STORAGE_KEY = "promptEnhancer.apiModel";

const ui = {
  rawInput: document.getElementById("rawInput"),
  inputCharCount: document.getElementById("inputCharCount"),
  outputReadout: document.getElementById("outputReadout"),
  outputCharCount: document.getElementById("outputCharCount"),
  enhanceBtn: document.getElementById("enhanceBtn"),
  enhanceVu: document.getElementById("enhanceVu"),
  clearBtn: document.getElementById("clearBtn"),
  copyBtn: document.getElementById("copyBtn"),
  downloadBtn: document.getElementById("downloadBtn"),
  savePromptBtn: document.getElementById("savePromptBtn"),
  saveCurrentPromptBtn: document.getElementById("saveCurrentPromptBtn"),
  clearSavedBtn: document.getElementById("clearSavedBtn"),
  savedList: document.getElementById("savedList"),
  savedCount: document.getElementById("savedCount"),
  styleSelect: document.getElementById("styleSelect"),
  apiKeyInput: document.getElementById("apiKeyInput"),
  apiEndpointInput: document.getElementById("apiEndpointInput"),
  apiModelInput: document.getElementById("apiModelInput"),
  templatePills: Array.from(document.querySelectorAll("[data-template]")),
  navToggle: document.getElementById("navToggle"),
  navMenu: document.getElementById("navMenu"),
  navLinks: Array.from(document.querySelectorAll(".top-nav__link")),
  topbar: document.querySelector(".topbar"),
  themeToggle: document.getElementById("themeToggle"),
  pageViews: Array.from(document.querySelectorAll(".page-view")),
  aiToolBtns: Array.from(document.querySelectorAll(".ai-tool-btn")),
  aiToast: document.getElementById("aiToast"),
  aiToastMsg: document.getElementById("aiToastMsg"),
};

const railStages = {
  input: document.querySelector('[data-stage="input"]'),
  shape: document.querySelector('[data-stage="shape"]'),
  output: document.querySelector('[data-stage="output"]'),
};

const ROLE_RULES = [
  {
    keywords: ["code", "function", "bug", "script", "program", "api", "debug", "algorithm", "refactor", "class", "compile", "regex"],
    role: "a senior software engineer with a strong bias for correctness and edge-case handling",
  },
  {
    keywords: ["email", "subject line", "newsletter", "ad copy", "tagline", "marketing", "social media post"],
    role: "an experienced copywriter and marketing communicator",
  },
  {
    keywords: ["story", "poem", "novel", "character", "plot", "screenplay", "creative writing"],
    role: "a skilled creative writer",
  },
  {
    keywords: ["data", "sql", "dataset", "statistics", "chart", "dashboard", "analysis", "spreadsheet"],
    role: "a meticulous data analyst",
  },
  {
    keywords: ["legal", "contract", "clause", "terms of service", "policy document"],
    role: "a legal writing assistant with a clear disclaimer that this is not legal advice",
  },
  {
    keywords: ["recipe", "cook", "ingredient", "meal plan", "bake"],
    role: "an experienced culinary instructor",
  },
  {
    keywords: ["lesson", "teach", "explain", "student", "curriculum", "study guide"],
    role: "a patient, clear subject-matter teacher",
  },
  {
    keywords: ["workout", "fitness", "exercise", "training plan", "gym"],
    role: "a certified fitness coach",
  },
  {
    keywords: ["business plan", "startup", "pitch deck", "go-to-market", "strategy"],
    role: "a pragmatic business strategy consultant",
  },
];

function detectRole(rawLower) {
  for (const rule of ROLE_RULES) {
    if (rule.keywords.some((keyword) => rawLower.includes(keyword))) {
      return rule.role;
    }
  }

  return "a knowledgeable, detail-oriented expert in the requested domain";
}

function buildEnhancedPrompt(raw, options) {
  const trimmed = raw.trim().replace(/\s+/g, " ");
  const rawLower = trimmed.toLowerCase();
  const sections = [];

  if (options.role) {
    sections.push(`## Role\nYou are ${detectRole(rawLower)}.`);
  }

  if (options.task) {
    sections.push(`## Objective\nProduce a response that directly fulfills this request: ${trimmed}.\n\nStay on the stated goal, keep the scope tight, and avoid unnecessary expansion.`);
  } else {
    sections.push(`## Request\n${trimmed}`);
  }

  sections.push("## Context\nTreat the request as the main source of truth. When a detail is missing, only make a sensible assumption if it is safe to do so; otherwise ask a focused clarification question.");

  if (options.format) {
    sections.push("## Output Format\n- Use clear Markdown structure.\n- Start with the most useful result first.\n- Use headings, numbered steps, bullet points, or tables where readability improves.\n- Avoid filler, repetition, and unnecessary preamble.");
  }

  if (options.constraints) {
    sections.push("## Constraints\n- Be accurate and do not invent sources, facts, or behavior.\n- Stay within the request scope.\n- Preserve the user’s intent and tone unless a different style is explicitly requested.\n- If the task is ambiguous, ask for clarification before proceeding.");
  }

  if (options.examples) {
    sections.push("## Examples\nInclude 1-2 concrete examples only when they materially clarify the expected structure or style.");
  }

  if (options.reasoning) {
    sections.push("## Reasoning\nThink step-by-step internally, then present only the reasoning that adds practical value to the final answer.");
  }

  sections.push("## Success Criteria\nThe final answer should be specific, polished, actionable, and easy to follow without extra noise.");
  return sections.join("\n\n");
}

const AI_PLATFORMS = {
  chatgpt: {
    name: "ChatGPT",
    getUrl: (prompt) => (prompt ? `https://chatgpt.com/?q=${encodeURIComponent(prompt)}` : "https://chatgpt.com/"),
  },
  claude: {
    name: "Claude",
    getUrl: () => "https://claude.ai/new",
  },
  gemini: {
    name: "Google Gemini",
    getUrl: () => "https://gemini.google.com/app",
  },
  perplexity: {
    name: "Perplexity",
    getUrl: (prompt) => (prompt ? `https://www.perplexity.ai/search?q=${encodeURIComponent(prompt)}` : "https://www.perplexity.ai/"),
  },
  deepseek: {
    name: "DeepSeek",
    getUrl: () => "https://chat.deepseek.com/",
  },
  midjourney: {
    name: "Midjourney",
    getUrl: () => "https://www.midjourney.com/",
  },
  copilot: {
    name: "Copilot",
    getUrl: () => "https://copilot.microsoft.com/",
  },
};

let toastTimer = null;
function showAiToast(message) {
  if (!ui.aiToast || !ui.aiToastMsg) return;
  if (toastTimer) clearTimeout(toastTimer);

  ui.aiToastMsg.textContent = message;
  ui.aiToast.classList.remove("is-hiding");
  ui.aiToast.hidden = false;

  toastTimer = setTimeout(() => {
    ui.aiToast.classList.add("is-hiding");
    setTimeout(() => {
      ui.aiToast.hidden = true;
      ui.aiToast.classList.remove("is-hiding");
    }, 250);
  }, 2500);
}

function syncAiButtons() {
  const hasOutput = Boolean(ui.outputReadout.textContent.trim());
  ui.aiToolBtns.forEach((btn) => {
    btn.disabled = !hasOutput;
  });
}

async function handleAiRedirect(platformKey) {
  const platform = AI_PLATFORMS[platformKey];
  if (!platform) return;

  const promptText = ui.outputReadout.textContent.trim();
  if (!promptText) {
    showAiToast("Generate a prompt first before redirecting!");
    return;
  }

  try {
    await navigator.clipboard.writeText(promptText);
  } catch (err) {
    console.error("Clipboard copy failed:", err);
  }

  const targetUrl = platform.getUrl(promptText);
  window.open(targetUrl, "_blank", "noopener,noreferrer");
  showAiToast(`Prompt copied! Launching ${platform.name}...`);
}

function updateCharCounts() {
  ui.inputCharCount.textContent = `${ui.rawInput.value.length} chars`;
  ui.outputCharCount.textContent = `${ui.outputReadout.textContent.length} chars`;
  syncAiButtons();
}

function setRailState(state) {
  Object.entries(state).forEach(([key, value]) => {
    const stage = railStages[key];
    if (!stage) return;
    stage.classList.toggle("is-active", value === "active");
    stage.classList.toggle("is-done", value === "done");
  });
}

function resetRail() {
  setRailState({ input: "active", shape: "idle", output: "idle" });
}

function resolveOptions() {
  return {
    ...DEFAULT_OPTIONS,
    style: ui.styleSelect?.value ?? "balanced",
  };
}

function readStoredApiConfig() {
  try {
    return {
      apiKey: localStorage.getItem(API_KEY_STORAGE_KEY) ?? DEFAULT_API_KEY,
      endpoint: localStorage.getItem(API_ENDPOINT_STORAGE_KEY) ?? DEFAULT_ENDPOINT,
      model: localStorage.getItem(API_MODEL_STORAGE_KEY) ?? DEFAULT_MODEL,
    };
  } catch {
    return {
      apiKey: DEFAULT_API_KEY,
      endpoint: DEFAULT_ENDPOINT,
      model: DEFAULT_MODEL,
    };
  }
}

function syncApiConfigInputs() {
  const config = readStoredApiConfig();
  if (ui.apiKeyInput) ui.apiKeyInput.value = config.apiKey || "";
  if (ui.apiEndpointInput) ui.apiEndpointInput.value = config.endpoint || DEFAULT_ENDPOINT;
  if (ui.apiModelInput) ui.apiModelInput.value = config.model || DEFAULT_MODEL;
}

function saveApiConfig() {
  const apiKey = (ui.apiKeyInput?.value || "").trim();
  const endpoint = (ui.apiEndpointInput?.value || DEFAULT_ENDPOINT).trim();
  const model = (ui.apiModelInput?.value || DEFAULT_MODEL).trim();

  try {
    localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
    localStorage.setItem(API_ENDPOINT_STORAGE_KEY, endpoint);
    localStorage.setItem(API_MODEL_STORAGE_KEY, model);
  } catch {
    // Ignore localStorage write failures in restricted/private browser modes.
  }
}

function getServerConfig() {
  const config = readStoredApiConfig();
  return {
    endpoint: config.endpoint || DEFAULT_ENDPOINT,
    model: config.model || DEFAULT_MODEL,
  };
}

const TEMPLATE_LIBRARY = {
  code: "Write a clean, production-ready code solution with clear structure, edge cases, and a short explanation.",
  writing: "Create a polished piece of writing with a strong opening, clear tone, and concise supporting details.",
  marketing: "Draft a persuasive marketing message with a clear value proposition, audience focus, and strong call to action.",
  business: "Produce a practical business-oriented response with a clear objective, useful structure, and actionable recommendations.",
  technical: "Create a technically detailed response with clear implementation steps, architecture context, examples, and concise documentation structure.",
  social: "Create a concise and engaging social media post with a strong hook, audience relevance, and a clear call to action.",
  imagefx: "Create a high-impact image generation prompt with a clear subject, cinematic composition, dramatic lighting, stylish color palette, and striking special effects.",
};

function applyTemplate(templateKey) {
  if (!TEMPLATE_LIBRARY[templateKey]) return;

  const templatePrefix = TEMPLATE_LIBRARY[templateKey];
  const currentValue = ui.rawInput.value.trim();
  ui.rawInput.value = currentValue ? `${currentValue}\n\n${templatePrefix}` : templatePrefix;
  updateCharCounts();
  ui.rawInput.focus();
}

async function callAiEnhancer(raw, options) {
  const config = getServerConfig();
  const response = await fetch(config.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      raw,
      options,
      model: config.model,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `AI request failed: ${response.status}`);
  }

  const data = await response.json();
  const content = data?.output?.trim();

  if (!content) {
    throw new Error("AI returned an empty response.");
  }

  return content;
}

async function runEnhance() {
  const raw = ui.rawInput.value;

  if (!raw.trim()) {
    ui.rawInput.classList.add("has-error");
    ui.rawInput.focus();
    return;
  }

  ui.enhanceBtn.disabled = true;
  ui.enhanceVu.classList.add("is-active");
  setRailState({ input: "done", shape: "active", output: "idle" });

  const delay = prefersReducedMotion ? 0 : 350;
  await new Promise((resolve) => setTimeout(resolve, delay));

  try {
    const output = await callAiEnhancer(raw, resolveOptions());
    ui.outputReadout.textContent = output;
    updateCharCounts();
  } catch (error) {
    console.error(error);
    const reason = error?.message || "Unable to reach the AI service.";
    const fallbackOutput = [
      `> API note: ${reason}`,
      "",
      buildEnhancedPrompt(raw, resolveOptions()),
    ].join("\n");
    ui.outputReadout.textContent = fallbackOutput;
    updateCharCounts();
  } finally {
    setRailState({ input: "done", shape: "done", output: "done" });
    ui.enhanceVu.classList.remove("is-active");
    ui.enhanceBtn.disabled = false;
  }
}

function loadSavedPrompts() {
  try {
    const raw = localStorage.getItem(SAVED_PROMPTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSavedPrompts(list) {
  localStorage.setItem(SAVED_PROMPTS_KEY, JSON.stringify(list));
}

function formatTimestamp(ts) {
  const date = new Date(ts);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function truncateText(text, maxLength) {
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

function renderSavedPrompts(list) {
  ui.savedList.innerHTML = "";
  ui.savedCount.textContent = `${list.length} saved`;

  if (!list.length) {
    const item = document.createElement("li");
    item.className = "saved-empty";
    item.textContent = "No saved prompts yet. Save one from the output panel.";
    ui.savedList.appendChild(item);
    return;
  }

  list.forEach((entry) => {
    const item = document.createElement("li");
    item.className = "saved-item";

    const preview = document.createElement("div");
    preview.className = "saved-item__preview";
    preview.textContent = truncateText(entry.raw, 120);

    const meta = document.createElement("div");
    meta.className = "saved-item__meta";
    meta.innerHTML = `<span>${formatTimestamp(entry.ts)}</span><span>${entry.output.length} chars</span>`;

    const actions = document.createElement("div");
    actions.className = "saved-item__actions";

    const loadBtn = document.createElement("button");
    loadBtn.className = "saved-item__button";
    loadBtn.type = "button";
    loadBtn.textContent = "Load";
    loadBtn.addEventListener("click", () => {
      ui.rawInput.value = entry.raw;
      ui.outputReadout.textContent = entry.output;
      updateCharCounts();
      setRailState({ input: "done", shape: "done", output: "done" });
    });

    const removeBtn = document.createElement("button");
    removeBtn.className = "saved-item__button";
    removeBtn.type = "button";
    removeBtn.textContent = "Delete";
    removeBtn.addEventListener("click", () => {
      const nextSaved = loadSavedPrompts().filter((saved) => saved.id !== entry.id);
      saveSavedPrompts(nextSaved);
      renderSavedPrompts(nextSaved);
    });

    actions.append(loadBtn, removeBtn);
    item.append(preview, meta, actions);
    ui.savedList.appendChild(item);
  });
}

function addSavedPrompt(raw, output) {
  const list = loadSavedPrompts();
  const id = crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  const nextSaved = [{ id, raw, output, ts: Date.now() }, ...list].slice(0, MAX_SAVED_PROMPTS);
  saveSavedPrompts(nextSaved);
  renderSavedPrompts(nextSaved);
}

function applyTheme(theme) {
  const isLight = theme === "light";
  document.body.classList.toggle("light-theme", isLight);
  ui.themeToggle?.setAttribute("aria-pressed", String(isLight));
  const icon = ui.themeToggle?.querySelector(".theme-toggle__icon");
  if (icon) {
    icon.textContent = isLight ? "☀" : "☾";
  }
}

function setActiveNav(linkId) {
  ui.navLinks.forEach((link) => {
    link.classList.toggle("is-active", link.dataset.navTarget === linkId);
  });
}

function showPage(pageId) {
  ui.pageViews.forEach((view) => {
    view.classList.toggle("is-active", view.dataset.page === pageId);
  });
  setActiveNav(pageId);
  const nextHash = pageId === "enhancer" ? "#enhancer" : `#${pageId}`;
  if (window.location.hash !== nextHash) {
    window.history.replaceState(null, "", nextHash);
  }
}

function closeMobileNav() {
  if (!ui.topbar) return;
  ui.topbar.classList.remove("is-open");
  ui.navToggle?.setAttribute("aria-expanded", "false");
}

function toggleMobileNav() {
  if (!ui.topbar) return;
  const isOpen = ui.topbar.classList.toggle("is-open");
  ui.navToggle?.setAttribute("aria-expanded", String(isOpen));
}

function wireNavigation() {
  ui.navToggle?.addEventListener("click", toggleMobileNav);
  ui.themeToggle?.addEventListener("click", () => {
    const nextTheme = document.body.classList.contains("light-theme") ? "dark" : "light";
    applyTheme(nextTheme);
    localStorage.setItem(THEME_KEY, nextTheme);
  });

  ui.navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.dataset.navTarget;
      event.preventDefault();
      showPage(targetId);
      closeMobileNav();
    });
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 860) {
      closeMobileNav();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMobileNav();
    }
  });
}

function saveCurrentPrompt() {
  const raw = ui.rawInput.value.trim();
  const output = ui.outputReadout.textContent.trim();

  if (!raw || !output) {
    return;
  }

  addSavedPrompt(raw, output);
}

function wireEvents() {
  ui.rawInput.addEventListener("input", () => {
    ui.rawInput.classList.remove("has-error");
    updateCharCounts();
  });

  ui.styleSelect?.addEventListener("change", () => {
    if (!ui.styleSelect.value) return;
  });

  [ui.apiKeyInput, ui.apiEndpointInput, ui.apiModelInput].forEach((input) => {
    input?.addEventListener("input", saveApiConfig);
    input?.addEventListener("change", saveApiConfig);
  });

  ui.templatePills.forEach((pill) => {
    pill.addEventListener("click", () => {
      applyTemplate(pill.dataset.template);
      if (pill.dataset.switchPage) {
        showPage(pill.dataset.switchPage);
      }
    });
  });

  ui.enhanceBtn.addEventListener("click", runEnhance);

  ui.clearBtn.addEventListener("click", () => {
    ui.rawInput.value = "";
    ui.rawInput.classList.remove("has-error");
    ui.rawInput.focus();
    updateCharCounts();
    resetRail();
  });

  ui.copyBtn.addEventListener("click", async () => {
    const text = ui.outputReadout.textContent;
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      const originalText = ui.copyBtn.textContent;
      ui.copyBtn.textContent = "Copied!";
      window.setTimeout(() => {
        ui.copyBtn.textContent = originalText;
      }, 1500);
    } catch (error) {
      console.error("Clipboard copy failed:", error);
    }
  });

  ui.downloadBtn.addEventListener("click", () => {
    const text = ui.outputReadout.textContent.trim();
    if (!text) return;

    const file = new Blob([text], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(file);
    link.download = "enhanced-prompt.txt";
    link.click();
    URL.revokeObjectURL(link.href);
  });

  ui.savePromptBtn.addEventListener("click", saveCurrentPrompt);
  ui.saveCurrentPromptBtn.addEventListener("click", saveCurrentPrompt);
  ui.clearSavedBtn.addEventListener("click", () => {
    saveSavedPrompts([]);
    renderSavedPrompts([]);
  });

  ui.aiToolBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      handleAiRedirect(btn.dataset.ai);
    });
  });
}

function initialize() {
  wireEvents();
  wireNavigation();
  syncApiConfigInputs();
  updateCharCounts();
  renderSavedPrompts(loadSavedPrompts());
  const savedTheme = localStorage.getItem(THEME_KEY);
  applyTheme(savedTheme === "light" ? "light" : "dark");
  const initialPage = window.location.hash.replace("#", "") || "enhancer";
  showPage(["enhancer", "templates", "saved-prompts", "features"].includes(initialPage) ? initialPage : "enhancer");
  resetRail();
}

initialize();
