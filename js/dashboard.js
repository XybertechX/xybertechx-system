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

  const hoyTexto = fechaHoy.toLocaleDateString();
  const ayerTexto = fechaAyer.toLocaleDateString();

  ultimasVentas.innerHTML = "";

  ventasSnap.forEach((docu) => {
    const venta = docu.data();
    const fechaVenta = new Date(venta.fecha).toLocaleDateString();

    if (fechaVenta === hoyTexto) {
      ventasHoy += venta.total || 0;
      gananciaHoy += venta.utilidad || 0;
      cantidadVentas++;

      const nombres = venta.productos
        ? venta.productos.map(p => `${p.nombre} x${p.cantidad}`).join(", ")
        : "Venta antigua";

      const li = document.createElement("li");
      li.innerHTML = `
        <div>
          <strong>${nombres}</strong>
          <small>${fechaVenta}</small>
        </div>
        <div>S/${(venta.total || 0).toFixed(2)}</div>
      `;

      ultimasVentas.prepend(li);
    }

    if (fechaVenta === ayerTexto) {
      ventasAyer += venta.total || 0;
    }
  });

  let stockBajo = 0;

  inventarioSnap.forEach((docu) => {
    const p = docu.data();

    if ((p.stock || 0) <= 5) {
      stockBajo++;
    }
  });

  const diferencia = ventasHoy - ventasAyer;

  let variacion = 0;
  if (ventasAyer > 0) {
    variacion = (diferencia / ventasAyer) * 100;
  }

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
    ultimasVentas.innerHTML = `<li>No hay ventas registradas hoy.</li>`;
  }
}

cargarDashboard();