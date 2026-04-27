import { db } from "../firebase.js";

import {
  collection,
  getDocs,
  query,
  where,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const historialPOS = document.getElementById("historialPOS");
const fechaInicio = document.getElementById("fechaInicio");
const fechaFin = document.getElementById("fechaFin");
const btnFiltrar = document.getElementById("btnFiltrarFechas");
const btnLimpiar = document.getElementById("btnLimpiarFiltro");

let ventasGlobal = [];

function formatearFecha(fecha) {
  if (!fecha) return "Sin fecha";
  if (fecha.toDate) return fecha.toDate().toLocaleString("es-PE");

  const fechaConvertida = new Date(fecha);
  return isNaN(fechaConvertida.getTime())
    ? "Sin fecha"
    : fechaConvertida.toLocaleString("es-PE");
}

async function cargarHistorial() {
  try {
    const ventasRef = collection(db, "ventas");

    const consulta = query(
      ventasRef,
      where("origen", "==", "POS"),
      orderBy("fecha", "desc")
    );

    const ventasSnap = await getDocs(consulta);

    ventasGlobal = [];

    ventasSnap.forEach((docu) => {
      ventasGlobal.push({
        id: docu.id,
        ...docu.data()
      });
    });

    renderVentas(ventasGlobal);

  } catch (error) {
    console.error("Error cargando historial POS:", error);
    historialPOS.innerHTML = "<p>Error al cargar historial.</p>";
  }
}

function renderVentas(lista) {
  historialPOS.innerHTML = "";

  if (lista.length === 0) {
    historialPOS.innerHTML = "<p>No hay ventas en ese rango.</p>";
    return;
  }

  lista.forEach((venta) => {
    const div = document.createElement("div");
    div.classList.add("historial-pos-item");

    const productos = venta.productos || [];

    const resumenProductos = productos
      .map(p => `${p.nombre} x${p.cantidad}`)
      .join(", ");

    const metodo = venta.metodoPago || "No definido";

    const estado = venta.estado === "devuelta"
      ? `<span class="estado-devuelta">Devuelta</span>`
      : `<span class="estado-ok">Completada</span>`;

    div.innerHTML = `
      <div>
        <strong>${resumenProductos || "Venta sin detalle"}</strong>
        <small>${formatearFecha(venta.fecha)}</small>
        <p class="metodo-pago">Pago: ${metodo}</p>
        ${estado}
      </div>

      <div>
        <span>Total</span>
        <strong>S/${Number(venta.total || 0).toFixed(2)}</strong>
      </div>

      <a href="ticket.html?id=${venta.id}" class="btn-ticket">Ver ticket</a>
    `;

    historialPOS.appendChild(div);
  });
}

function filtrarPorFecha() {
  const inicio = fechaInicio.value ? new Date(fechaInicio.value) : null;
  const fin = fechaFin.value ? new Date(fechaFin.value) : null;

  if (fin) {
    fin.setHours(23, 59, 59, 999);
  }

  const filtradas = ventasGlobal.filter((venta) => {
    if (!venta.fecha) return false;

    const fechaVenta = venta.fecha.toDate
      ? venta.fecha.toDate()
      : new Date(venta.fecha);

    if (inicio && fechaVenta < inicio) return false;
    if (fin && fechaVenta > fin) return false;

    return true;
  });

  renderVentas(filtradas);
}

function limpiarFiltro() {
  fechaInicio.value = "";
  fechaFin.value = "";
  renderVentas(ventasGlobal);
}

btnFiltrar.addEventListener("click", filtrarPorFecha);
btnLimpiar.addEventListener("click", limpiarFiltro);

cargarHistorial();  