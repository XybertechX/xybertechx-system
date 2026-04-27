import { db } from "../firebase.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const ventaId = params.get("id");

const ticketId = document.getElementById("ticketId");
const ticketFecha = document.getElementById("ticketFecha");
const ticketProductos = document.getElementById("ticketProductos");
const ticketTotal = document.getElementById("ticketTotal");

function formatearFecha(fecha) {
  if (!fecha) return "Sin fecha";

  if (fecha.toDate) {
    return fecha.toDate().toLocaleString("es-PE");
  }

  const fechaConvertida = new Date(fecha);

  if (isNaN(fechaConvertida.getTime())) {
    return "Sin fecha";
  }

  return fechaConvertida.toLocaleString("es-PE");
}

async function cargarTicket() {
  if (!ventaId) {
    alert("Ticket no encontrado.");
    window.location.href = "index.html";
    return;
  }

  const ventaRef = doc(db, "ventas", ventaId);
  const ventaSnap = await getDoc(ventaRef);

  if (!ventaSnap.exists()) {
    alert("La venta no existe.");
    window.location.href = "index.html";
    return;
  }

  const venta = ventaSnap.data();

  ticketId.textContent = ventaId;
  ticketFecha.textContent = formatearFecha(venta.fecha);
  ticketTotal.textContent = Number(venta.total || 0).toFixed(2);

  ticketProductos.innerHTML = "";

  const productos = venta.productos || [];

  productos.forEach((p) => {
    const div = document.createElement("div");
    div.classList.add("ticket-producto");

    div.innerHTML = `
  <div>
    <strong>${p.nombre}</strong>
    <small>${p.categoria || "Producto"}</small>
  </div>
  <span>${p.cantidad}</span>
  <span>S/${Number(p.precio).toFixed(2)}</span>
  <span>S/${Number(p.subtotal || p.precio * p.cantidad).toFixed(2)}</span>
`;

    ticketProductos.appendChild(div);
  });
}

cargarTicket();