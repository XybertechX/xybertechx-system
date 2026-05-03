import { auth, db } from "./firebase.js";

import {
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const btnLogin = document.getElementById("btnLogin");
const loginStatus = document.getElementById("loginStatus");
const togglePassword = document.getElementById("togglePassword");

function setStatus(texto, tipo = "") {
  loginStatus.textContent = texto;
  loginStatus.className = `login-status ${tipo}`;
}

function setLoading(loading) {
  btnLogin.disabled = loading;
  btnLogin.textContent = loading ? "Ingresando..." : "Ingresar al sistema";
}

togglePassword.addEventListener("click", () => {
  const visible = passwordInput.type === "text";
  passwordInput.type = visible ? "password" : "text";
  togglePassword.textContent = visible ? "Ver" : "Ocultar";
});

passwordInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    window.login();
  }
});

emailInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    passwordInput.focus();
  }
});

window.login = async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    setStatus("Completa correo y contraseña.", "error");
    return;
  }

  try {
    setLoading(true);
    setStatus("Validando acceso...");

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    const userRef = doc(db, "usuarios", uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      setStatus("Usuario sin rol asignado. Contacta al administrador.", "error");
      return;
    }

    const userData = userSnap.data();

    if (userData.rol === "admin") {
      window.location.href = "index.html";
    } else if (userData.rol === "vendedor") {
      window.location.href = "pos/index.html";
    } else {
      setStatus("Rol no valido.", "error");
    }
  } catch (error) {
    setStatus(error.message || "No se pudo iniciar sesion.", "error");
  } finally {
    setLoading(false);
  }
};
