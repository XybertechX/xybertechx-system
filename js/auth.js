import { auth, db } from "./firebase.js";
import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

function loginPath() {
  return window.location.pathname.includes("/pos/") ? "../login.html" : "login.html";
}

function redirectByRole(rol) {
  const isPos = window.location.pathname.includes("/pos/");

  if (rol === "admin") return;
  if (rol === "vendedor" && isPos) return;

  window.location.href = rol === "vendedor" ? "pos/index.html" : loginPath();
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = loginPath();
    return;
  }

  try {
    const userSnap = await getDoc(doc(db, "usuarios", user.uid));

    if (!userSnap.exists()) {
      window.location.href = loginPath();
      return;
    }

    redirectByRole(userSnap.data().rol);
  } catch (error) {
    console.error("Error validando rol:", error);
    window.location.href = loginPath();
  }
});
