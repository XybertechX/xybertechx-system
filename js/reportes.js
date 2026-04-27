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

    total += venta.total || 0;
    utilidad += venta.utilidad || 0;
    cantidad++;

    const fecha = venta.fecha
      ? new Date(venta.fecha).toLocaleDateString()
      : "Sin fecha";

    if (!ventasPorDia[fecha]) {
      ventasPorDia[fecha] = 0;
    }

    ventasPorDia[fecha] += venta.total || 0;

    const productos = venta.productos || [];

    productos.forEach((p) => {
      inversion += (p.costo || 0) * (p.cantidad || 0);

      if (!productosVendidos[p.nombre]) {
        productosVendidos[p.nombre] = 0;
      }

      productosVendidos[p.nombre] += p.cantidad || 0;
    });

    const nombres = productos.length > 0
      ? productos.map(p => `${p.nombre} x${p.cantidad}`).join(", ")
      : "Venta antigua sin detalle";

    const li = document.createElement("li");
    li.innerHTML = `
      <div>
        <strong>${nombres}</strong>
        <small>${fecha}</small>
      </div>
      <div>
        <small>Total</small>
        <strong>S/${(venta.total || 0).toFixed(2)}</strong>
      </div>
      <div>
        <small>Utilidad</small>
        <strong>S/${(venta.utilidad || 0).toFixed(2)}</strong>
      </div>
    `;

    historialVentas.appendChild(li);
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
        label: "Ventas por día (S/)",
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