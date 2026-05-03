import { db } from "./firebase.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const totalVentas = document.getElementById("totalVentas");
const cantidadVentas = document.getElementById("cantidadVentas");
const ticketPromedio = document.getElementById("ticketPromedio");
const productoTop = document.getElementById("productoTop");
const historialVentas = document.getElementById("historialVentas");
const totalUtilidad = document.getElementById("totalUtilidad");
const totalInversion = document.getElementById("totalInversion");
const totalCeo = document.getElementById("totalCeo");
const totalDevoluciones = document.getElementById("totalDevoluciones");
const margenPromedio = document.getElementById("margenPromedio");
const canalPrincipal = document.getElementById("canalPrincipal");
const reporteMetodosPago = document.getElementById("reporteMetodosPago");
const productosTopReporte = document.getElementById("productosTopReporte");

const metodosBase = ["Efectivo", "Yape", "Plin", "Transferencia", "Tarjeta"];

function fechaComoDate(fecha) {
  if (!fecha) return null;
  if (fecha.toDate) return fecha.toDate();

  const fechaConvertida = new Date(fecha);
  return isNaN(fechaConvertida.getTime()) ? null : fechaConvertida;
}

function formatearFecha(fecha) {
  const fechaConvertida = fechaComoDate(fecha);
  return fechaConvertida ? fechaConvertida.toLocaleDateString("es-PE") : "Sin fecha";
}

function dinero(valor) {
  return Number(valor || 0).toFixed(2);
}

function origenVenta(venta) {
  return venta.origen || "Admin";
}

function agregarItem(lista, titulo, detalle, valor, badge) {
  const li = document.createElement("li");

  const texto = document.createElement("div");
  const strong = document.createElement("strong");
  strong.textContent = titulo;
  const small = document.createElement("small");
  small.textContent = detalle;
  texto.append(strong, small);

  const derecha = document.createElement("div");
  derecha.className = "list-value";
  const valorNode = document.createElement("span");
  valorNode.textContent = valor;
  derecha.appendChild(valorNode);

  if (badge) {
    const badgeNode = document.createElement("small");
    badgeNode.className = "status-pill";
    badgeNode.textContent = badge;
    derecha.appendChild(badgeNode);
  }

  li.append(texto, derecha);
  lista.appendChild(li);
}

function renderMetodo(nombre, total, cantidad) {
  const card = document.createElement("div");
  card.className = "payment-card";

  const label = document.createElement("span");
  label.textContent = nombre;
  const value = document.createElement("strong");
  value.textContent = `S/${dinero(total)}`;
  const count = document.createElement("small");
  count.textContent = `${cantidad} operaciones`;

  card.append(label, value, count);
  reporteMetodosPago.appendChild(card);
}

async function cargarReportes() {
  const ventasSnap = await getDocs(collection(db, "ventas"));

  let totalPos = 0;
  let utilidadPos = 0;
  let inversion = 0;
  let cantidadPos = 0;
  let totalServiciosCeo = 0;
  let devoluciones = 0;
  let productosVendidos = {};
  let ventasPorDia = {};
  let metodos = {};
  let historial = [];

  metodosBase.forEach((metodo) => {
    metodos[metodo] = { total: 0, cantidad: 0 };
  });

  ventasSnap.forEach((docu) => {
    const venta = { id: docu.id, ...docu.data() };
    const origen = origenVenta(venta);
    const esPos = origen === "POS";
    const devuelta = venta.estado === "devuelta";
    const totalVenta = Number(venta.total || 0);
    const utilidadVenta = Number(venta.utilidad ?? venta.ganancia ?? 0);
    const fecha = formatearFecha(venta.fecha);
    const fechaDate = fechaComoDate(venta.fecha) || new Date(0);

    if (esPos && devuelta) {
      devoluciones += totalVenta;
      return;
    }

    if (esPos) {
      totalPos += totalVenta;
      utilidadPos += utilidadVenta;
      cantidadPos++;

      if (!ventasPorDia[fecha]) ventasPorDia[fecha] = 0;
      ventasPorDia[fecha] += totalVenta;

      const metodo = venta.metodoPago || "No definido";
      if (!metodos[metodo]) metodos[metodo] = { total: 0, cantidad: 0 };
      metodos[metodo].total += totalVenta;
      metodos[metodo].cantidad++;

      (venta.productos || []).forEach((p) => {
        const cantidad = Number(p.cantidad || 0);
        const nombre = p.nombre || "Producto";
        inversion += Number(p.costo || 0) * cantidad;
        productosVendidos[nombre] = (productosVendidos[nombre] || 0) + cantidad;
      });
    } else {
      totalServiciosCeo += totalVenta;
    }

    historial.push({ venta, fecha, fechaDate, totalVenta, utilidadVenta, origen });
  });

  totalVentas.textContent = dinero(totalPos);
  cantidadVentas.textContent = `${cantidadPos} tickets`;
  ticketPromedio.textContent = cantidadPos > 0 ? dinero(totalPos / cantidadPos) : "0.00";
  totalUtilidad.textContent = dinero(utilidadPos);
  totalInversion.textContent = dinero(inversion);
  totalCeo.textContent = dinero(totalServiciosCeo);
  totalDevoluciones.textContent = dinero(devoluciones);
  margenPromedio.textContent = totalPos > 0 ? `${((utilidadPos / totalPos) * 100).toFixed(1)}%` : "0%";
  canalPrincipal.textContent = totalPos >= totalServiciosCeo ? "POS" : "CEO";

  reporteMetodosPago.innerHTML = "";
  Object.entries(metodos).forEach(([nombre, datos]) => renderMetodo(nombre, datos.total, datos.cantidad));

  const top = Object.entries(productosVendidos)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  productosTopReporte.innerHTML = "";
  if (top.length === 0) {
    agregarItem(productosTopReporte, "Sin ventas POS", "Aun no hay productos vendidos", "0 und.", "");
    productoTop.textContent = "-";
  } else {
    productoTop.textContent = `${top[0][0]} (${top[0][1]} und.)`;
    top.forEach(([nombre, cantidad], index) => {
      agregarItem(productosTopReporte, nombre, `Puesto ${index + 1}`, `${cantidad} und.`, "Top");
    });
  }

  historialVentas.innerHTML = "";
  historial
    .sort((a, b) => b.fechaDate - a.fechaDate)
    .slice(0, 12)
    .forEach(({ venta, fecha, totalVenta, utilidadVenta, origen }) => {
      const productos = (venta.productos || [])
        .map((p) => `${p.nombre || "Producto"} x${p.cantidad || 0}`)
        .join(", ");
      agregarItem(
        historialVentas,
        productos || "Venta sin detalle",
        `${fecha} - ${origen}`,
        `S/${dinero(totalVenta)} | U: S/${dinero(utilidadVenta)}`,
        origen
      );
    });

  if (historial.length === 0) {
    agregarItem(historialVentas, "Sin movimientos", "Aun no hay ventas registradas", "S/0.00", "");
  }

  crearGraficoVentas(ventasPorDia);
}

function crearGraficoVentas(ventasPorDia) {
  const canvas = document.getElementById("graficoVentas");
  if (!canvas || typeof Chart === "undefined") return;

  const labels = Object.keys(ventasPorDia);
  const valores = Object.values(ventasPorDia);

  new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Ventas POS por dia (S/)",
        data: valores,
        borderWidth: 3,
        tension: 0.35
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: {
            color: "#f8fafc"
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: "#94a3b8"
          }
        },
        y: {
          ticks: {
            color: "#94a3b8"
          }
        }
      }
    }
  });
}

cargarReportes();
