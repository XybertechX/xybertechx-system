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

function fechaComoDate(fecha) {
  if (!fecha) return null;
  if (fecha.toDate) return fecha.toDate();

  const fechaConvertida = new Date(fecha);
  return isNaN(fechaConvertida.getTime()) ? null : fechaConvertida;
}

function formatearFecha(fecha) {
  const fechaConvertida = fechaComoDate(fecha);
  return fechaConvertida ? fechaConvertida.toLocaleString("es-PE") : "Sin fecha";
}

function agregarProductoTicket(p) {
  const div = document.createElement("div");
  div.classList.add("ticket-producto");

  const detalle = document.createElement("div");
  const nombre = document.createElement("strong");
  nombre.textContent = p.nombre || "Producto";
  const categoria = document.createElement("small");
  categoria.textContent = p.categoria || "Producto";
  detalle.append(nombre, categoria);

  const cantidad = document.createElement("span");
  cantidad.textContent = Number(p.cantidad || 0);

  const precio = document.createElement("span");
  precio.textContent = `S/${Number(p.precio || 0).toFixed(2)}`;

  const subtotal = document.createElement("span");
  subtotal.textContent = `S/${Number(p.subtotal || p.precio * p.cantidad || 0).toFixed(2)}`;

  div.append(detalle, cantidad, precio, subtotal);
  ticketProductos.appendChild(div);
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
  productos.forEach(agregarProductoTicket);
}

cargarTicket();
