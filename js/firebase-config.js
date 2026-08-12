// ============================================================================
// Firebase configuration
// ----------------------------------------------------------------------------
// Replace the placeholder values below with the config object from your own
// Firebase project (Firebase Console → Project settings → General →
// "Your apps" → SDK setup and configuration → Config).
//
// This file only holds public client identifiers — Firebase web API keys are
// safe to ship in client-side code because access is governed by Firebase
// Auth + security rules, not by keeping this value secret. See README.md for
// full setup steps.
// ============================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAf3u8Vnhy9f7JAaoRUs4eGaEXHdp71IP4",
  authDomain: "prompt-enhancer-72e61.firebaseapp.com",
  projectId: "prompt-enhancer-72e61",
  storageBucket: "prompt-enhancer-72e61.firebasestorage.app",
  messagingSenderId: "139802891115",
  appId: "1:139802891115:web:50c7f87344957cb0da722e",
  measurementId: "G-NGL27ELVHM",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
