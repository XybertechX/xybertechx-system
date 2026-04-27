import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyClnb_ATPTTWglNPDB7ifHgO8wgGEnPMp0",
  authDomain: "xybertechx-system.firebaseapp.com",
  projectId: "xybertechx-system",
  storageBucket: "xybertechx-system.firebasestorage.app",
  messagingSenderId: "208205329621",
  appId: "1:208205329621:web:ecd69b2cfb62e123c6de5c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };