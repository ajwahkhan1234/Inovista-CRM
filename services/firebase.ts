
import { initializeApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

let db: Firestore | null = null;

// --- CRITICAL: PASTE YOUR FIREBASE KEYS HERE ---
// Once you fill this in, the app will work globally on every device (Phone, Laptop, etc.)
// You do NOT need to configure anything else in the app settings.
const HARDCODED_CONFIG = {
  apiKey: "",            // PASTE HERE (e.g. "AIzaSy...")
  authDomain: "",        // PASTE HERE
  projectId: "",         // PASTE HERE
  storageBucket: "",     // PASTE HERE
  messagingSenderId: "", // PASTE HERE
  appId: ""              // PASTE HERE
};

export const initFirebase = (manualConfig?: any) => {
  try {
    // 1. Priority: Hardcoded Config (Global Deployment)
    if (HARDCODED_CONFIG.apiKey !== "") {
      console.log("Initializing Firebase: Global Cloud Mode");
      const app = initializeApp(HARDCODED_CONFIG);
      db = getFirestore(app);
      return true;
    }

    // 2. Fallback: Manual Config (Settings Page - Dev usage only)
    if (manualConfig && manualConfig.apiKey) {
      console.log("Initializing Firebase: Manual Settings Mode");
      const app = initializeApp(manualConfig);
      db = getFirestore(app);
      return true;
    }

    // 3. Fallback: LocalStorage Config (Legacy - Dev usage only)
    const saved = localStorage.getItem('fh_firebase_config');
    if (saved) {
      console.log("Initializing Firebase: Saved Local Config");
      const parsed = JSON.parse(saved);
      const app = initializeApp(parsed);
      db = getFirestore(app);
      return true;
    }

    return false;
  } catch (error) {
    console.error("Firebase init failed:", error);
    return false;
  }
};

export const getDB = () => db;

// Helper to check if we are using the global hardcoded keys
export const isUsingHardcodedKeys = () => HARDCODED_CONFIG.apiKey !== "";

export const loadSavedConfig = () => {
    if (HARDCODED_CONFIG.apiKey !== "") return HARDCODED_CONFIG;
    
    const saved = localStorage.getItem('fh_firebase_config');
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            return null;
        }
    }
    return null;
}
