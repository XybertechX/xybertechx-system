import { db } from "../firebase.js";

import {
  collection,
  getDocs,
  orderBy,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const historialPOS = document.getElementById("historialPOS");
const fechaInicio = document.getElementById("fechaInicio");
const fechaFin = document.getElementById("fechaFin");
const btnFiltrar = document.getElementById("btnFiltrarFechas");
const btnLimpiar = document.getElementById("btnLimpiarFiltro");

let ventasGlobal = [];

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
    historialPOS.innerHTML = "";
    const p = document.createElement("p");
    p.textContent = "Error al cargar historial.";
    historialPOS.appendChild(p);
  }
}

function renderVentas(lista) {
  historialPOS.innerHTML = "";

  if (lista.length === 0) {
    const p = document.createElement("p");
    p.textContent = "No hay ventas en ese rango.";
    historialPOS.appendChild(p);
    return;
  }

  lista.forEach((venta) => {
    const div = document.createElement("div");
    div.classList.add("historial-pos-item");

    const productos = venta.productos || [];
    const resumenProductos = productos
      .map(p => `${p.nombre || "Producto"} x${p.cantidad || 0}`)
      .join(", ");

    const metodo = venta.metodoPago || "No definido";

    const detalle = document.createElement("div");
    const resumen = document.createElement("strong");
    resumen.textContent = resumenProductos || "Venta sin detalle";
    const fecha = document.createElement("small");
    fecha.textContent = formatearFecha(venta.fecha);
    const pago = document.createElement("p");
    pago.className = "metodo-pago";
    pago.textContent = `Pago: ${metodo}`;
    const estado = document.createElement("span");
    estado.className = venta.estado === "devuelta" ? "estado-devuelta" : "estado-ok";
    estado.textContent = venta.estado === "devuelta" ? "Devuelta" : "Completada";
    detalle.append(resumen, fecha, pago, estado);

    const total = document.createElement("div");
    const totalLabel = document.createElement("span");
    totalLabel.textContent = "Total";
    const totalValor = document.createElement("strong");
    totalValor.textContent = `S/${Number(venta.total || 0).toFixed(2)}`;
    total.append(totalLabel, totalValor);

    const ticket = document.createElement("a");
    ticket.href = `ticket.html?id=${encodeURIComponent(venta.id)}`;
    ticket.className = "btn-ticket";
    ticket.textContent = "Ver ticket";

    div.append(detalle, total, ticket);
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
    const fechaVenta = fechaComoDate(venta.fecha);
    if (!fechaVenta) return false;

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
