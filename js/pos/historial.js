import { db } from "../firebase.js";

import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const historialPOS = document.getElementById("historialPOS");
const fechaInicio = document.getElementById("fechaInicio");
const fechaFin = document.getElementById("fechaFin");
const metodoFiltro = document.getElementById("metodoFiltro");
const btnFiltrar = document.getElementById("btnFiltrarFechas");
const btnLimpiar = document.getElementById("btnLimpiarFiltro");
const historialTotal = document.getElementById("historialTotal");
const historialTickets = document.getElementById("historialTickets");
const historialDevueltas = document.getElementById("historialDevueltas");

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

function setMensaje(texto) {
  historialPOS.innerHTML = "";
  const p = document.createElement("p");
  p.className = "carrito-vacio";
  p.textContent = texto;
  historialPOS.appendChild(p);
}

function rangoFechas() {
  const inicio = fechaInicio.value ? new Date(fechaInicio.value) : null;
  const fin = fechaFin.value ? new Date(fechaFin.value) : null;

  if (fin) fin.setHours(23, 59, 59, 999);
  return { inicio, fin };
}

async function cargarHistorial({ usarFechas = false } = {}) {
  try {
    setMensaje("Cargando ventas...");
    const ventasRef = collection(db, "ventas");
    const filtros = [where("origen", "==", "POS")];
    const { inicio, fin } = rangoFechas();

    if (usarFechas && inicio) filtros.push(where("fecha", ">=", inicio));
    if (usarFechas && fin) filtros.push(where("fecha", "<=", fin));

    const consulta = query(
      ventasRef,
      ...filtros,
      orderBy("fecha", "desc"),
      limit(usarFechas ? 150 : 50)
    );

    const ventasSnap = await getDocs(consulta);

    ventasGlobal = [];
    ventasSnap.forEach((docu) => {
      ventasGlobal.push({
        id: docu.id,
        ...docu.data()
      });
    });

    renderVentas();
  } catch (error) {
    console.error("Error cargando historial POS:", error);
    setMensaje("Error al cargar historial. Revisa indices de Firebase si acabas de agregar filtros.");
  }
}

function ventasVisibles() {
  const metodo = metodoFiltro.value;
  if (!metodo) return ventasGlobal;
  return ventasGlobal.filter((venta) => venta.metodoPago === metodo);
}

function renderResumen(lista) {
  const completadas = lista.filter((venta) => venta.estado !== "devuelta");
  const devueltas = lista.length - completadas.length;
  const total = completadas.reduce((sum, venta) => sum + Number(venta.total || 0), 0);

  historialTotal.textContent = `S/${total.toFixed(2)}`;
  historialTickets.textContent = completadas.length;
  historialDevueltas.textContent = devueltas;
}

function renderVentas() {
  const lista = ventasVisibles();
  historialPOS.innerHTML = "";
  renderResumen(lista);

  if (lista.length === 0) {
    setMensaje("No hay ventas en ese filtro.");
    renderResumen([]);
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

function limpiarFiltro() {
  fechaInicio.value = "";
  fechaFin.value = "";
  metodoFiltro.value = "";
  cargarHistorial();
}

btnFiltrar.addEventListener("click", () => cargarHistorial({ usarFechas: true }));
btnLimpiar.addEventListener("click", limpiarFiltro);
metodoFiltro.addEventListener("change", renderVentas);

cargarHistorial();
