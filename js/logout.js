import { auth } from "./firebase.js";
import {
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

function loginPath() {
  return window.location.pathname.includes("/pos/") ? "../login.html" : "login.html";
}

window.logout = async () => {
  await signOut(auth);
  alert("Sesion cerrada");
  window.location.href = loginPath();
};
