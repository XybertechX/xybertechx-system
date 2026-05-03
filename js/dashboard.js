import { db } from "./firebase.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const ventasHoySpan = document.getElementById("ventasHoy");
const gananciaHoySpan = document.getElementById("gananciaHoy");
const ticketHoySpan = document.getElementById("ticketHoy");
const stockBajoSpan = document.getElementById("stockBajo");
const ultimasVentas = document.getElementById("ultimasVentas");

const ventasAyerSpan = document.getElementById("ventasAyer");
const diferenciaVentasSpan = document.getElementById("diferenciaVentas");
const variacionVentasSpan = document.getElementById("variacionVentas");
const alertaVentas = document.getElementById("alertaVentas");
const mensajeVentas = document.getElementById("mensajeVentas");

const metaDiaria = 100;

function fechaComoDate(fecha) {
  if (!fecha) return null;
  if (fecha.toDate) return fecha.toDate();

  const convertida = new Date(fecha);
  return isNaN(convertida.getTime()) ? null : convertida;
}

function mismaFecha(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function agregarVentaReciente(venta, fechaVenta) {
  const li = document.createElement("li");
  const nombres = venta.productos?.length
    ? venta.productos.map(p => `${p.nombre || "Producto"} x${p.cantidad || 0}`).join(", ")
    : "Venta antigua";

  const detalle = document.createElement("div");
  const nombre = document.createElement("strong");
  nombre.textContent = nombres;
  const fecha = document.createElement("small");
  fecha.textContent = fechaVenta.toLocaleDateString();
  detalle.append(nombre, fecha);

  const total = document.createElement("div");
  total.textContent = `S/${Number(venta.total || 0).toFixed(2)}`;

  li.append(detalle, total);
  ultimasVentas.prepend(li);
}

async function cargarDashboard() {
  const ventasSnap = await getDocs(collection(db, "ventas"));
  const inventarioSnap = await getDocs(collection(db, "inventario"));

  let ventasHoy = 0;
  let ventasAyer = 0;
  let gananciaHoy = 0;
  let cantidadVentas = 0;

  const fechaHoy = new Date();
  const fechaAyer = new Date();
  fechaAyer.setDate(fechaHoy.getDate() - 1);

  ultimasVentas.innerHTML = "";

  ventasSnap.forEach((docu) => {
    const venta = docu.data();
    if (venta.estado === "devuelta") return;

    const fechaVenta = fechaComoDate(venta.fecha);
    if (!fechaVenta) return;

    if (mismaFecha(fechaVenta, fechaHoy)) {
      ventasHoy += Number(venta.total || 0);
      gananciaHoy += Number(venta.utilidad ?? venta.ganancia ?? 0);
      cantidadVentas++;
      agregarVentaReciente(venta, fechaVenta);
    }

    if (mismaFecha(fechaVenta, fechaAyer)) {
      ventasAyer += Number(venta.total || 0);
    }
  });

  let stockBajo = 0;

  inventarioSnap.forEach((docu) => {
    const p = docu.data();

    if (Number(p.stock || 0) <= 5) {
      stockBajo++;
    }
  });

  const diferencia = ventasHoy - ventasAyer;
  const variacion = ventasAyer > 0 ? (diferencia / ventasAyer) * 100 : 0;

  ventasHoySpan.textContent = ventasHoy.toFixed(2);
  gananciaHoySpan.textContent = gananciaHoy.toFixed(2);
  ticketHoySpan.textContent =
    cantidadVentas > 0 ? (ventasHoy / cantidadVentas).toFixed(2) : "0";

  stockBajoSpan.textContent = stockBajo;

  ventasAyerSpan.textContent = ventasAyer.toFixed(2);
  diferenciaVentasSpan.textContent = diferencia.toFixed(2);
  variacionVentasSpan.textContent = `${variacion.toFixed(1)}%`;

  alertaVentas.classList.remove("alert-danger", "alert-success");

  if (ventasHoy < metaDiaria) {
    alertaVentas.classList.add("alert-danger");
    mensajeVentas.textContent = `Ventas bajas hoy. Meta diaria: S/${metaDiaria}`;
  } else {
    alertaVentas.classList.add("alert-success");
    mensajeVentas.textContent = "Buen ritmo de ventas hoy.";
  }

  if (cantidadVentas === 0) {
    const li = document.createElement("li");
    li.textContent = "No hay ventas registradas hoy.";
    ultimasVentas.appendChild(li);
  }
}

cargarDashboard();
