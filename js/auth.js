// ============================================================================
// Prompt Enhancer — Auth page logic (index.html)
// Handles: tab switching, client-side validation, Firebase email/password
// and Google sign-in, forgot-password flow, and route guarding.
// ============================================================================

import { auth, googleProvider } from "./firebase-config.js";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* -- Route guard: bounce signed-in users straight to the tool -------------- */
const gate = document.getElementById("gate");
const authContent = document.getElementById("authContent");

onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.replace("app.html");
    return;
  }
  gate.hidden = true;
  authContent.hidden = false;
});

/* -- Tabs -------------------------------------------------------------------- */
const tabSignIn = document.getElementById("tabSignIn");
const tabSignUp = document.getElementById("tabSignUp");
const signInPanel = document.getElementById("signInPanel");
const signUpPanel = document.getElementById("signUpPanel");
const signInForm = document.getElementById("signInForm");
const signUpForm = document.getElementById("signUpForm");

function activateTab(mode) {
  const isSignIn = mode === "signin";
  tabSignIn.setAttribute("aria-selected", String(isSignIn));
  tabSignUp.setAttribute("aria-selected", String(!isSignIn));
  signInPanel.hidden = !isSignIn;
  signUpPanel.hidden = isSignIn;
  signInForm.classList.toggle("is-active", isSignIn);
  signUpForm.classList.toggle("is-active", !isSignIn);
}

tabSignIn.addEventListener("click", () => activateTab("signin"));
tabSignUp.addEventListener("click", () => activateTab("signup"));

/* -- Password show/hide toggles ---------------------------------------------- */
document.querySelectorAll(".field__toggle-visibility").forEach((btn) => {
  btn.addEventListener("click", () => {
    const input = document.getElementById(btn.dataset.toggleFor);
    const isHidden = input.type === "password";
    input.type = isHidden ? "text" : "password";
    btn.textContent = isHidden ? "Hide" : "Show";
  });
});

/* -- Field error helpers ------------------------------------------------------ */
function setFieldError(inputEl, errorEl, message) {
  errorEl.textContent = message || "";
  inputEl.classList.toggle("has-error", Boolean(message));
}

function setBanner(bannerEl, message, kind = "error") {
  bannerEl.textContent = message || "";
  bannerEl.classList.remove("form-banner--error", "form-banner--success");
  bannerEl.classList.add(kind === "success" ? "form-banner--success" : "form-banner--error");
  bannerEl.classList.toggle("is-visible", Boolean(message));
}

/* -- Password strength -------------------------------------------------------- */
function scorePassword(pw) {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

const STRENGTH_LABELS = ["Minimum 8 characters", "Weak", "Fair", "Good", "Strong"];

const strengthMeter = document.getElementById("strengthMeter");
const strengthLabel = document.getElementById("signUpStrengthLabel");
const signUpPasswordInput = document.getElementById("signUpPassword");

signUpPasswordInput.addEventListener("input", () => {
  const level = scorePassword(signUpPasswordInput.value);
  strengthMeter.dataset.level = String(level);
  strengthLabel.textContent = STRENGTH_LABELS[level];
});

/* -- Friendly Firebase error messages ----------------------------------------- */
function friendlyAuthError(error) {
  const code = error && error.code ? error.code : "";
  console.error("Firebase auth error:", code, error && error.message);
  const map = {
    "auth/invalid-email": "That email address doesn't look right.",
    "auth/user-disabled": "This account has been disabled. Contact support for help.",
    "auth/user-not-found": "We couldn't find an account with that email.",
    "auth/wrong-password": "That password doesn't match this account.",
    "auth/invalid-credential": "Email or password is incorrect.",
    "auth/invalid-login-credentials": "Email or password is incorrect.",
    "auth/email-already-in-use": "An account with that email already exists. Try signing in instead.",
    "auth/weak-password": "Please choose a stronger password (at least 8 characters).",
    "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
    "auth/network-request-failed": "Network error — check your connection and try again.",
    "auth/popup-closed-by-user": "The Google sign-in window was closed before finishing.",
    "auth/cancelled-popup-request": "Only one Google sign-in window can be open at a time.",
    "auth/popup-blocked": "Your browser blocked the sign-in popup. Please allow popups and try again.",
    "auth/operation-not-allowed": "This sign-in method isn't enabled for this project yet.",
    "auth/missing-password": "Please enter a password.",
  };
  return map[code] || "Something went wrong. Please try again.";
}

/* -- Loading state helper on submit buttons ----------------------------------- */
function setSubmitting(button, isSubmitting) {
  button.disabled = isSubmitting;
  const vu = button.querySelector(".vu-meter");
  if (vu) vu.classList.toggle("is-active", isSubmitting);
}

/* ============================== SIGN IN ==================================== */
const signInEmail = document.getElementById("signInEmail");
const signInPassword = document.getElementById("signInPassword");
const signInEmailError = document.getElementById("signInEmailError");
const signInPasswordError = document.getElementById("signInPasswordError");
const signInBanner = document.getElementById("signInBanner");
const signInSubmit = document.getElementById("signInSubmit");

function validateSignIn() {
  let valid = true;
  setFieldError(signInEmail, signInEmailError, "");
  setFieldError(signInPassword, signInPasswordError, "");

  if (!signInEmail.value.trim()) {
    setFieldError(signInEmail, signInEmailError, "Email is required.");
    valid = false;
  } else if (!EMAIL_RE.test(signInEmail.value.trim())) {
    setFieldError(signInEmail, signInEmailError, "Enter a valid email address.");
    valid = false;
  }

  if (!signInPassword.value) {
    setFieldError(signInPassword, signInPasswordError, "Password is required.");
    valid = false;
  }

  return valid;
}

signInForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  setBanner(signInBanner, "");
  if (!validateSignIn()) return;

  setSubmitting(signInSubmit, true);
  try {
    await signInWithEmailAndPassword(auth, signInEmail.value.trim(), signInPassword.value);
    window.location.replace("app.html");
  } catch (error) {
    const code = error.code;
    if (code === "auth/user-not-found") {
      setFieldError(signInEmail, signInEmailError, friendlyAuthError(error));
    } else if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
      setFieldError(signInPassword, signInPasswordError, friendlyAuthError(error));
    } else {
      setBanner(signInBanner, friendlyAuthError(error));
    }
  } finally {
    setSubmitting(signInSubmit, false);
  }
});

/* ---- Forgot password (inline panel within sign-in form) -------------------- */
const forgotPasswordBtn = document.getElementById("forgotPasswordBtn");
const resetPanel = document.getElementById("resetPanel");
const resetEmail = document.getElementById("resetEmail");
const resetEmailError = document.getElementById("resetEmailError");
const resetBanner = document.getElementById("resetBanner");
const sendResetBtn = document.getElementById("sendResetBtn");
const cancelResetBtn = document.getElementById("cancelResetBtn");

forgotPasswordBtn.addEventListener("click", () => {
  resetPanel.classList.add("is-visible");
  resetEmail.value = signInEmail.value.trim();
  setBanner(resetBanner, "");
  setFieldError(resetEmail, resetEmailError, "");
  resetEmail.focus();
});

cancelResetBtn.addEventListener("click", () => {
  resetPanel.classList.remove("is-visible");
  setBanner(resetBanner, "");
  setFieldError(resetEmail, resetEmailError, "");
});

sendResetBtn.addEventListener("click", async () => {
  setBanner(resetBanner, "");
  setFieldError(resetEmail, resetEmailError, "");

  const value = resetEmail.value.trim();
  if (!value) {
    setFieldError(resetEmail, resetEmailError, "Email is required.");
    return;
  }
  if (!EMAIL_RE.test(value)) {
    setFieldError(resetEmail, resetEmailError, "Enter a valid email address.");
    return;
  }

  setSubmitting(sendResetBtn, true);
  try {
    await sendPasswordResetEmail(auth, value);
    setBanner(resetBanner, "Reset email sent — check your inbox.", "success");
  } catch (error) {
    setBanner(resetBanner, friendlyAuthError(error));
  } finally {
    setSubmitting(sendResetBtn, false);
  }
});

/* ============================== SIGN UP ===================================== */
const signUpEmail = document.getElementById("signUpEmail");
const signUpConfirm = document.getElementById("signUpConfirm");
const signUpEmailError = document.getElementById("signUpEmailError");
const signUpPasswordError = document.getElementById("signUpPasswordError");
const signUpConfirmError = document.getElementById("signUpConfirmError");
const signUpBanner = document.getElementById("signUpBanner");
const signUpSubmit = document.getElementById("signUpSubmit");

function validateSignUp() {
  let valid = true;
  setFieldError(signUpEmail, signUpEmailError, "");
  setFieldError(signUpPasswordInput, signUpPasswordError, "");
  setFieldError(signUpConfirm, signUpConfirmError, "");

  if (!signUpEmail.value.trim()) {
    setFieldError(signUpEmail, signUpEmailError, "Email is required.");
    valid = false;
  } else if (!EMAIL_RE.test(signUpEmail.value.trim())) {
    setFieldError(signUpEmail, signUpEmailError, "Enter a valid email address.");
    valid = false;
  }

  if (!signUpPasswordInput.value) {
    setFieldError(signUpPasswordInput, signUpPasswordError, "Password is required.");
    valid = false;
  } else if (signUpPasswordInput.value.length < 8) {
    setFieldError(signUpPasswordInput, signUpPasswordError, "Password must be at least 8 characters.");
    valid = false;
  }

  if (!signUpConfirm.value) {
    setFieldError(signUpConfirm, signUpConfirmError, "Please confirm your password.");
    valid = false;
  } else if (signUpConfirm.value !== signUpPasswordInput.value) {
    setFieldError(signUpConfirm, signUpConfirmError, "Passwords do not match.");
    valid = false;
  }

  return valid;
}

signUpForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  setBanner(signUpBanner, "");
  if (!validateSignUp()) return;

  setSubmitting(signUpSubmit, true);
  try {
    await createUserWithEmailAndPassword(auth, signUpEmail.value.trim(), signUpPasswordInput.value);
    window.location.replace("app.html");
  } catch (error) {
    if (error.code === "auth/email-already-in-use") {
      setFieldError(signUpEmail, signUpEmailError, friendlyAuthError(error));
    } else if (error.code === "auth/weak-password") {
      setFieldError(signUpPasswordInput, signUpPasswordError, friendlyAuthError(error));
    } else {
      setBanner(signUpBanner, friendlyAuthError(error));
    }
  } finally {
    setSubmitting(signUpSubmit, false);
  }
});

/* -- Google sign-in (shared by both tabs) ------------------------------------- */
async function handleGoogleSignIn(bannerEl) {
  setBanner(bannerEl, "");
  try {
    await signInWithPopup(auth, googleProvider);
    window.location.replace("app.html");
  } catch (error) {
    if (error.code !== "auth/cancelled-popup-request") {
      setBanner(bannerEl, friendlyAuthError(error));
    }
  }
}

document.getElementById("googleSignInBtn").addEventListener("click", () => handleGoogleSignIn(signInBanner));
document.getElementById("googleSignUpBtn").addEventListener("click", () => handleGoogleSignIn(signUpBanner));
