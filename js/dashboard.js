import { db } from "./firebase.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const ventasHoySpan = document.getElementById("ventasHoy");
const gananciaHoySpan = document.getElementById("gananciaHoy");
const ticketHoySpan = document.getElementById("ticketHoy");
const ticketsHoy = document.getElementById("ticketsHoy");
const stockBajoSpan = document.getElementById("stockBajo");
const stockAgotadoSpan = document.getElementById("stockAgotado");
const ventasCeoHoy = document.getElementById("ventasCeoHoy");
const ultimasVentas = document.getElementById("ultimasVentas");
const inventarioCritico = document.getElementById("inventarioCritico");
const metodosPagoResumen = document.getElementById("metodosPagoResumen");
const productosTop = document.getElementById("productosTop");

const ventasAyerSpan = document.getElementById("ventasAyer");
const diferenciaVentasSpan = document.getElementById("diferenciaVentas");
const variacionVentasSpan = document.getElementById("variacionVentas");
const devolucionesHoySpan = document.getElementById("devolucionesHoy");
const mensajeVentas = document.getElementById("mensajeVentas");
const ventasNetasLabel = document.getElementById("ventasNetasLabel");

const metaDiaria = 100;
const metodosBase = ["Efectivo", "Yape", "Plin", "Transferencia", "Tarjeta"];

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

function dinero(valor) {
  return Number(valor || 0).toFixed(2);
}

function limpiarLista(lista) {
  lista.innerHTML = "";
}

function agregarItemSimple(lista, titulo, detalle, valor, badge) {
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

function agregarVacio(lista, texto) {
  const li = document.createElement("li");
  li.className = "empty-list";
  li.textContent = texto;
  lista.appendChild(li);
}

function renderMetodoPago(nombre, total, cantidad) {
  const card = document.createElement("div");
  card.className = "payment-card";

  const label = document.createElement("span");
  label.textContent = nombre;
  const value = document.createElement("strong");
  value.textContent = `S/${dinero(total)}`;
  const count = document.createElement("small");
  count.textContent = `${cantidad} operaciones`;

  card.append(label, value, count);
  metodosPagoResumen.appendChild(card);
}

function origenVenta(venta) {
  return venta.origen || "Admin";
}

async function cargarDashboard() {
  const ventasSnap = await getDocs(collection(db, "ventas"));
  const inventarioSnap = await getDocs(collection(db, "inventario"));

  let ventasHoy = 0;
  let ventasAyer = 0;
  let gananciaHoy = 0;
  let cantidadVentas = 0;
  let totalCeoHoy = 0;
  let devolucionesHoy = 0;
  let operacionesDevueltas = 0;

  const metodos = {};
  const productosVendidos = {};
  const ventasRecientes = [];
  const inventario = [];

  metodosBase.forEach((metodo) => {
    metodos[metodo] = { total: 0, cantidad: 0 };
  });

  const fechaHoy = new Date();
  const fechaAyer = new Date();
  fechaAyer.setDate(fechaHoy.getDate() - 1);

  ventasSnap.forEach((docu) => {
    const venta = { id: docu.id, ...docu.data() };
    const fechaVenta = fechaComoDate(venta.fecha);
    if (!fechaVenta) return;

    const origen = origenVenta(venta);
    const esPos = origen === "POS";
    const total = Number(venta.total || 0);
    const utilidad = Number(venta.utilidad ?? venta.ganancia ?? 0);
    const devuelta = venta.estado === "devuelta";

    if (esPos && mismaFecha(fechaVenta, fechaAyer) && !devuelta) {
      ventasAyer += total;
    }

    if (!mismaFecha(fechaVenta, fechaHoy)) return;

    if (esPos && devuelta) {
      devolucionesHoy += total;
      operacionesDevueltas++;
      return;
    }

    if (esPos) {
      ventasHoy += total;
      gananciaHoy += utilidad;
      cantidadVentas++;

      const metodo = venta.metodoPago || "No definido";
      if (!metodos[metodo]) {
        metodos[metodo] = { total: 0, cantidad: 0 };
      }
      metodos[metodo].total += total;
      metodos[metodo].cantidad++;

      (venta.productos || []).forEach((producto) => {
        const nombre = producto.nombre || "Producto";
        if (!productosVendidos[nombre]) {
          productosVendidos[nombre] = 0;
        }

        productosVendidos[nombre] += Number(producto.cantidad || 0);
      });

      ventasRecientes.push({ venta, fechaVenta });
      return;
    }

    totalCeoHoy += total;
  });

  inventarioSnap.forEach((docu) => {
    const producto = { id: docu.id, ...docu.data() };
    inventario.push(producto);
  });

  const stockBajo = inventario.filter((producto) => {
    const stock = Number(producto.stock || 0);
    return stock > 0 && stock <= 5;
  });
  const stockAgotado = inventario.filter((producto) => Number(producto.stock || 0) <= 0);
  const criticos = [...stockAgotado, ...stockBajo]
    .sort((a, b) => Number(a.stock || 0) - Number(b.stock || 0))
    .slice(0, 6);

  ventasHoySpan.textContent = dinero(ventasHoy);
  gananciaHoySpan.textContent = dinero(gananciaHoy);
  ticketHoySpan.textContent = cantidadVentas > 0 ? dinero(ventasHoy / cantidadVentas) : "0.00";
  ticketsHoy.textContent = cantidadVentas;
  stockBajoSpan.textContent = stockBajo.length;
  stockAgotadoSpan.textContent = stockAgotado.length;
  ventasCeoHoy.textContent = dinero(totalCeoHoy);
  ventasAyerSpan.textContent = dinero(ventasAyer);
  diferenciaVentasSpan.textContent = dinero(ventasHoy - ventasAyer);
  devolucionesHoySpan.textContent = dinero(devolucionesHoy);
  ventasNetasLabel.textContent = `${cantidadVentas} completadas / ${operacionesDevueltas} devueltas`;

  const variacion = ventasAyer > 0 ? ((ventasHoy - ventasAyer) / ventasAyer) * 100 : 0;
  variacionVentasSpan.textContent = ventasAyer > 0 ? `${variacion.toFixed(1)}% vs ayer` : "Sin base ayer";

  if (ventasHoy <= 0) {
    mensajeVentas.textContent = "Aun no hay ventas POS registradas hoy.";
  } else if (ventasHoy < metaDiaria) {
    mensajeVentas.textContent = `POS activo. Faltan S/${dinero(metaDiaria - ventasHoy)} para la meta diaria.`;
  } else {
    mensajeVentas.textContent = "Meta diaria cubierta desde el POS.";
  }

  limpiarLista(metodosPagoResumen);
  Object.entries(metodos).forEach(([nombre, datos]) => {
    renderMetodoPago(nombre, datos.total, datos.cantidad);
  });

  limpiarLista(inventarioCritico);
  if (criticos.length === 0) {
    agregarVacio(inventarioCritico, "Inventario saludable para POS y web.");
  } else {
    criticos.forEach((producto) => {
      const stock = Number(producto.stock || 0);
      agregarItemSimple(
        inventarioCritico,
        producto.nombre || "Producto sin nombre",
        producto.categoria || "Sin categoria",
        `${stock} und.`,
        stock <= 0 ? "Agotado" : "Bajo"
      );
    });
  }

  limpiarLista(ultimasVentas);
  ventasRecientes
    .sort((a, b) => b.fechaVenta - a.fechaVenta)
    .slice(0, 6)
    .forEach(({ venta, fechaVenta }) => {
      const productos = (venta.productos || [])
        .map((producto) => `${producto.nombre || "Producto"} x${producto.cantidad || 0}`)
        .join(", ");
      agregarItemSimple(
        ultimasVentas,
        productos || "Venta POS",
        `${fechaVenta.toLocaleTimeString()} - ${venta.metodoPago || "Sin metodo"}`,
        `S/${dinero(venta.total)}`,
        "POS"
      );
    });

  if (ventasRecientes.length === 0) {
    agregarVacio(ultimasVentas, "Todavia no hay movimiento POS hoy.");
  }

  limpiarLista(productosTop);
  const top = Object.entries(productosVendidos)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (top.length === 0) {
    agregarVacio(productosTop, "Sin productos vendidos por POS hoy.");
  } else {
    top.forEach(([nombre, cantidad], index) => {
      agregarItemSimple(productosTop, nombre, `Puesto ${index + 1}`, `${cantidad} und.`, "Top");
    });
  }
}

cargarDashboard();
