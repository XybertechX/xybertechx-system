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

function agregarHistorial(venta, fecha, totalVenta, utilidadVenta) {
  const productos = venta.productos || [];
  const nombres = productos.length > 0
    ? productos.map(p => `${p.nombre || "Producto"} x${p.cantidad || 0}`).join(", ")
    : "Venta antigua sin detalle";

  const li = document.createElement("li");

  const detalle = document.createElement("div");
  const nombre = document.createElement("strong");
  nombre.textContent = nombres;
  const fechaNode = document.createElement("small");
  fechaNode.textContent = fecha;
  detalle.append(nombre, fechaNode);

  const totalBox = document.createElement("div");
  const totalLabel = document.createElement("small");
  totalLabel.textContent = "Total";
  const totalValor = document.createElement("strong");
  totalValor.textContent = `S/${totalVenta.toFixed(2)}`;
  totalBox.append(totalLabel, totalValor);

  const utilidadBox = document.createElement("div");
  const utilidadLabel = document.createElement("small");
  utilidadLabel.textContent = "Utilidad";
  const utilidadValor = document.createElement("strong");
  utilidadValor.textContent = `S/${utilidadVenta.toFixed(2)}`;
  utilidadBox.append(utilidadLabel, utilidadValor);

  li.append(detalle, totalBox, utilidadBox);
  historialVentas.appendChild(li);
}

async function cargarReportes() {
  const ventasSnap = await getDocs(collection(db, "ventas"));

  let total = 0;
  let utilidad = 0;
  let inversion = 0;
  let cantidad = 0;
  let productosVendidos = {};
  let ventasPorDia = {};

  historialVentas.innerHTML = "";

  ventasSnap.forEach((docu) => {
    const venta = docu.data();
    if (venta.estado === "devuelta") return;

    const totalVenta = Number(venta.total || 0);
    const utilidadVenta = Number(venta.utilidad ?? venta.ganancia ?? 0);

    total += totalVenta;
    utilidad += utilidadVenta;
    cantidad++;

    const fecha = formatearFecha(venta.fecha);

    if (!ventasPorDia[fecha]) {
      ventasPorDia[fecha] = 0;
    }

    ventasPorDia[fecha] += totalVenta;

    const productos = venta.productos || [];

    productos.forEach((p) => {
      inversion += Number(p.costo || 0) * Number(p.cantidad || 0);

      const nombreProducto = p.nombre || "Producto";
      if (!productosVendidos[nombreProducto]) {
        productosVendidos[nombreProducto] = 0;
      }

      productosVendidos[nombreProducto] += Number(p.cantidad || 0);
    });

    agregarHistorial(venta, fecha, totalVenta, utilidadVenta);
  });

  totalVentas.textContent = total.toFixed(2);
  cantidadVentas.textContent = cantidad;
  ticketPromedio.textContent = cantidad > 0 ? (total / cantidad).toFixed(2) : "0.00";

  if (totalUtilidad) totalUtilidad.textContent = utilidad.toFixed(2);
  if (totalInversion) totalInversion.textContent = inversion.toFixed(2);

  let topProducto = "-";
  let topCantidad = 0;

  for (const producto in productosVendidos) {
    if (productosVendidos[producto] > topCantidad) {
      topProducto = producto;
      topCantidad = productosVendidos[producto];
    }
  }

  productoTop.textContent =
    topProducto === "-" ? "-" : `${topProducto} (${topCantidad} unidades)`;

  crearGraficoVentas(ventasPorDia);
}

function crearGraficoVentas(ventasPorDia) {
  const canvas = document.getElementById("graficoVentas");

  if (!canvas) return;

  const labels = Object.keys(ventasPorDia);
  const valores = Object.values(ventasPorDia);

  new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Ventas por dia (S/)",
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
