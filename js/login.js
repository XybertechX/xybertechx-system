import { auth, db } from "./firebase.js";

import {
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

window.login = async () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    alert("Completa correo y contraseña.");
    return;
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    const userRef = doc(db, "usuarios", uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      alert("Usuario sin rol asignado. Contacta al administrador.");
      return;
    }

    const userData = userSnap.data();

    if (userData.rol === "admin") {
      window.location.href = "index.html";
    } else if (userData.rol === "vendedor") {
      window.location.href = "pos/index.html";
    } else {
      alert("Rol no válido.");
    }

  } catch (error) {
    alert("Error: " + error.message);
  }
};