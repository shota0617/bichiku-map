import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyBX0NzbeGOyi-O6d8SN2foW_a5nK-_AmLs",
    authDomain: "bichiku-map-77076.firebaseapp.com",
    projectId: "bichiku-map-77076",
    storageBucket: "bichiku-map-77076.firebasestorage.app",
    messagingSenderId: "537173581815",
    appId: "1:537173581815:web:8c00042ddc5048781998f2"
  };

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
