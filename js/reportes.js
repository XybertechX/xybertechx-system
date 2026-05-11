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
const modalVenta = document.getElementById("modalVenta");
const cerrarDetalleVenta = document.getElementById("cerrarDetalleVenta");
const detalleVentaTitulo = document.getElementById("detalleVentaTitulo");
const detalleVentaSubtitulo = document.getElementById("detalleVentaSubtitulo");
const detalleVentaResumen = document.getElementById("detalleVentaResumen");
const detalleVentaProductos = document.getElementById("detalleVentaProductos");
const detalleVentaNotas = document.getElementById("detalleVentaNotas");

const metodosBase = ["Efectivo", "Yape", "Plin", "Transferencia", "Tarjeta"];
let ventasDetalle = [];

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

function agregarItem(lista, titulo, detalle, valor, badge, onClick) {
  const li = document.createElement("li");
  if (onClick) {
    li.className = "clickable-sale";
    li.tabIndex = 0;
    li.setAttribute("role", "button");
    li.setAttribute("aria-label", `Ver detalle de ${titulo}`);
    li.onclick = onClick;
    li.onkeydown = (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onClick();
      }
    };
  }

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

function crearDatoDetalle(label, valor) {
  const div = document.createElement("div");
  const span = document.createElement("span");
  span.textContent = label;
  const strong = document.createElement("strong");
  strong.textContent = valor;
  div.append(span, strong);
  return div;
}

function abrirDetalleVenta(id) {
  const item = ventasDetalle.find((registro) => registro.venta.id === id);
  if (!item) return;

  const { venta, fechaDate, totalVenta, utilidadVenta, origen } = item;
  const productos = venta.productos || [];
  const fechaCompleta = fechaDate && fechaDate.getTime() > 0
    ? `${fechaDate.toLocaleDateString("es-PE")} ${fechaDate.toLocaleTimeString("es-PE")}`
    : "Sin fecha";

  detalleVentaTitulo.textContent = `${origen} | S/${dinero(totalVenta)}`;
  detalleVentaSubtitulo.textContent = venta.cliente || venta.usuario || "Movimiento operativo";

  detalleVentaResumen.innerHTML = "";
  detalleVentaResumen.append(
    crearDatoDetalle("Fecha", fechaCompleta),
    crearDatoDetalle("Canal", origen),
    crearDatoDetalle("Metodo", venta.metodoPago || "Sin metodo"),
    crearDatoDetalle("Estado", venta.estado || "completada"),
    crearDatoDetalle("Total", `S/${dinero(totalVenta)}`),
    crearDatoDetalle("Utilidad", `S/${dinero(utilidadVenta)}`),
    crearDatoDetalle("Cliente", venta.cliente || "Sin cliente"),
    crearDatoDetalle("Documento", venta.id)
  );

  detalleVentaProductos.innerHTML = "";
  if (productos.length === 0) {
    agregarItem(detalleVentaProductos, "Sin productos", "La venta no guarda detalle de items.", "0 und.", "");
  } else {
    productos.forEach((producto) => {
      const cantidad = Number(producto.cantidad || 0);
      const subtotalGuardado = producto.subtotal ?? producto.total;
      const precio = Number(producto.precio ?? (cantidad > 0 && subtotalGuardado ? Number(subtotalGuardado) / cantidad : 0));
      const subtotal = Number(subtotalGuardado ?? (precio * cantidad));
      agregarItem(
        detalleVentaProductos,
        producto.nombre || "Producto",
        `${producto.categoria || "Sin categoria"} | x${cantidad}`,
        `S/${dinero(subtotal)}`,
        `Unit. S/${dinero(precio)}`
      );
    });
  }

  detalleVentaNotas.textContent = venta.nota || venta.observacion || venta.comentario || "Sin notas registradas.";
  modalVenta.classList.remove("hidden");
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
  let totalOperativo = 0;
  let utilidadOperativa = 0;
  let inversion = 0;
  let cantidadPos = 0;
  let cantidadOperativa = 0;
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

    totalOperativo += totalVenta;
    utilidadOperativa += utilidadVenta;
    cantidadOperativa++;

    if (!ventasPorDia[fecha]) ventasPorDia[fecha] = 0;
    ventasPorDia[fecha] += totalVenta;

    const metodo = venta.metodoPago || "No definido";
    if (!metodos[metodo]) metodos[metodo] = { total: 0, cantidad: 0 };
    metodos[metodo].total += totalVenta;
    metodos[metodo].cantidad++;

    (venta.productos || []).forEach((p) => {
      const cantidad = Number(p.cantidad || 0);
      const nombre = p.nombre || "Producto";
      productosVendidos[nombre] = (productosVendidos[nombre] || 0) + cantidad;
    });

    if (esPos) {
      totalPos += totalVenta;
      utilidadPos += utilidadVenta;
      cantidadPos++;

      (venta.productos || []).forEach((p) => {
        const cantidad = Number(p.cantidad || 0);
        inversion += Number(p.costo || 0) * cantidad;
      });
    } else {
      totalServiciosCeo += totalVenta;
    }

    historial.push({ venta, fecha, fechaDate, totalVenta, utilidadVenta, origen });
  });

  totalVentas.textContent = dinero(totalOperativo);
  cantidadVentas.textContent = `${cantidadOperativa} operaciones | POS ${cantidadPos}`;
  ticketPromedio.textContent = cantidadOperativa > 0 ? dinero(totalOperativo / cantidadOperativa) : "0.00";
  totalUtilidad.textContent = dinero(utilidadOperativa);
  totalInversion.textContent = dinero(inversion);
  totalCeo.textContent = dinero(totalServiciosCeo);
  totalDevoluciones.textContent = dinero(devoluciones);
  margenPromedio.textContent = totalOperativo > 0 ? `${((utilidadOperativa / totalOperativo) * 100).toFixed(1)}%` : "0%";
  canalPrincipal.textContent = totalPos >= totalServiciosCeo ? "POS" : "CEO";

  reporteMetodosPago.innerHTML = "";
  Object.entries(metodos).forEach(([nombre, datos]) => renderMetodo(nombre, datos.total, datos.cantidad));

  const top = Object.entries(productosVendidos)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  productosTopReporte.innerHTML = "";
  if (top.length === 0) {
    agregarItem(productosTopReporte, "Sin ventas registradas", "Aun no hay productos o repuestos vendidos", "0 und.", "");
    productoTop.textContent = "-";
  } else {
    productoTop.textContent = `${top[0][0]} (${top[0][1]} und.)`;
    top.forEach(([nombre, cantidad], index) => {
      agregarItem(productosTopReporte, nombre, `Puesto ${index + 1}`, `${cantidad} und.`, "Top");
    });
  }

  ventasDetalle = historial;
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
        origen,
        () => abrirDetalleVenta(venta.id)
      );
    });

  if (historial.length === 0) {
    agregarItem(historialVentas, "Sin movimientos", "Aun no hay ventas registradas", "S/0.00", "");
  }

  crearGraficoVentas(ventasPorDia);
}

cerrarDetalleVenta.addEventListener("click", () => modalVenta.classList.add("hidden"));
modalVenta.addEventListener("click", (event) => {
  if (event.target === modalVenta) {
    modalVenta.classList.add("hidden");
  }
});

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
        label: "Cobros operativos por dia (S/)",
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
