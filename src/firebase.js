// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore }    from "firebase/firestore";
import { getStorage }      from "firebase/storage";
import { getAuth }         from "firebase/auth";
import { getFunctions }    from "firebase/functions";

// Pull config from your environment
const firebaseConfig = {
  apiKey:             process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain:         process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId:          process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket:      process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId:  process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId:              process.env.REACT_APP_FIREBASE_APP_ID,
};
console.log("API Key is:", process.env.REACT_APP_FIREBASE_API_KEY);

// Initialize Firebase
const app     = initializeApp(firebaseConfig);
const db      = getFirestore(app);
const storage = getStorage(app);
const auth    = getAuth(app);
const functions = getFunctions(app, "us-central1");

export { db, storage, auth, functions };
