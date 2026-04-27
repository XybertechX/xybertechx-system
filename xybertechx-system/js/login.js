import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Config (misma de siempre)
const firebaseConfig = {
  apiKey: "AIzaSyClnb_ATPTTWglNPDB7ifHgO8wgGEnPMp0",
  authDomain: "xybertechx-system.firebaseapp.com",
  projectId: "xybertechx-system",
  storageBucket: "xybertechx-system.firebasestorage.app",
  messagingSenderId: "208205329621",
  appId: "1:208205329621:web:ecd69b2cfb62e123c6de5c"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

window.login = async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);

    alert("Bienvenido 🚀");
    window.location.href = "index.html";

  } catch (error) {
    alert("Error: " + error.message);
  }
};