import { db } from "./firebase.js";
import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let items = [];

const listaItems = document.getElementById("listaItems");
const subtotalSpan = document.getElementById("subtotal");
const totalFinalSpan = document.getElementById("totalFinal");
const historialBoletas = document.getElementById("historialBoletas");
const btnWhatsappBoleta = document.getElementById("btnWhatsappBoleta");

let ultimaBoleta = null;

const plantillas = {
  diagnostico: {
    descripcion: "Diagnostico tecnico presencial",
    cantidad: 1,
    precio: 40
  },
  mantenimiento: {
    descripcion: "Mantenimiento preventivo de equipo",
    cantidad: 1,
    precio: 80
  },
  formateo: {
    descripcion: "Formateo, instalacion de sistema y programas base",
    cantidad: 1,
    precio: 90
  }
};

const datosPago = {
  bbva: "0011-0579-0237635522",
  cci: "01157900023763552204",
  billeteras: "Yape / Plin: 973 518 710"
};

function dinero(valor) {
  return Number(valor || 0).toFixed(2);
}

function setCampo(id, valor) {
  document.getElementById(id).value = valor;
}

window.usarPlantilla = (tipo) => {
  const plantilla = plantillas[tipo];
  if (!plantilla) return;

  setCampo("descripcion", plantilla.descripcion);
  setCampo("cantidad", plantilla.cantidad);
  setCampo("precio", plantilla.precio);
};

window.agregarItem = () => {
  const descripcion = document.getElementById("descripcion").value.trim();
  const cantidad = Number(document.getElementById("cantidad").value);
  const precio = Number(document.getElementById("precio").value);

  if (!descripcion || cantidad <= 0 || precio <= 0) {
    alert("Completa descripcion, cantidad y precio.");
    return;
  }

  items.push({
    descripcion,
    cantidad,
    precio,
    total: cantidad * precio
  });

  setCampo("descripcion", "");
  setCampo("cantidad", "");
  setCampo("precio", "");

  renderItems();
};

function agregarResumenItem(item, index) {
  const li = document.createElement("li");

  const detalle = document.createElement("div");
  const descripcion = document.createElement("strong");
  descripcion.textContent = item.descripcion;
  const cantidad = document.createElement("small");
  cantidad.textContent = `Cantidad: ${item.cantidad}`;
  detalle.append(descripcion, cantidad);

  const precio = document.createElement("div");
  precio.className = "list-value";
  const precioValor = document.createElement("span");
  precioValor.textContent = `S/${dinero(item.precio)}`;
  const totalValor = document.createElement("small");
  totalValor.textContent = `Total S/${dinero(item.total)}`;
  precio.append(precioValor, totalValor);

  const btn = document.createElement("button");
  btn.textContent = "Quitar";
  btn.className = "btn-danger";
  btn.onclick = () => {
    items.splice(index, 1);
    renderItems();
  };

  li.append(detalle, precio, btn);
  listaItems.appendChild(li);
}

function renderItems() {
  listaItems.innerHTML = "";

  if (items.length === 0) {
    const li = document.createElement("li");
    li.className = "empty-list";
    li.textContent = "Agrega servicios, productos externos o materiales para generar la cotizacion.";
    listaItems.appendChild(li);
  } else {
    items.forEach(agregarResumenItem);
  }

  calcularTotales();
}

window.calcularTotales = () => {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const descuento = Number(document.getElementById("descuento").value) || 0;
  const totalFinal = Math.max(subtotal - descuento, 0);

  subtotalSpan.textContent = dinero(subtotal);
  totalFinalSpan.textContent = dinero(totalFinal);
};

function limpiarNombreArchivo(texto) {
  return String(texto || "Cliente")
    .trim()
    .replaceAll(" ", "-")
    .replace(/[^a-zA-Z0-9-_]/g, "");
}

function textoCorto(texto, maximo) {
  const limpio = String(texto || "").trim();
  return limpio.length > maximo ? `${limpio.slice(0, maximo - 3)}...` : limpio;
}

function numeroBoleta(numero) {
  return `BOL-${new Date().getFullYear()}-${String(numero).padStart(4, "0")}`;
}

function telefonoWhatsapp(telefono) {
  const digitos = String(telefono || "").replace(/\D/g, "");
  if (!digitos) return "";
  return digitos.startsWith("51") ? digitos : `51${digitos}`;
}

async function registrarBoleta(datos) {
  const contadorRef = doc(db, "configuracion", "correlativos");
  const boletaRef = doc(collection(db, "boletas"));

  return runTransaction(db, async (transaction) => {
    const contadorSnap = await transaction.get(contadorRef);
    const ultimo = contadorSnap.exists() ? Number(contadorSnap.data().boletas || 0) : 0;
    const siguiente = ultimo + 1;
    const numero = numeroBoleta(siguiente);

    transaction.set(contadorRef, { boletas: siguiente }, { merge: true });
    transaction.set(boletaRef, {
      ...datos,
      numero,
      correlativo: siguiente,
      estado: "emitida",
      fechaCreacion: serverTimestamp()
    });

    return { id: boletaRef.id, numero };
  });
}

function agregarHistorialBoleta(boleta) {
  const li = document.createElement("li");

  const detalle = document.createElement("div");
  const numero = document.createElement("strong");
  numero.textContent = boleta.numero || "Boleta";
  const cliente = document.createElement("small");
  cliente.textContent = `${boleta.cliente || "Cliente"} | ${boleta.tipoCotizacion || "Cotizacion"}`;
  detalle.append(numero, cliente);

  const valor = document.createElement("div");
  valor.className = "list-value";
  const total = document.createElement("span");
  total.textContent = `S/${dinero(boleta.totalFinal)}`;
  const estado = document.createElement("small");
  estado.className = "status-pill";
  estado.textContent = boleta.estado || "emitida";
  valor.append(total, estado);

  li.append(detalle, valor);
  historialBoletas.appendChild(li);
}

async function cargarHistorialBoletas() {
  if (!historialBoletas) return;
  historialBoletas.innerHTML = "";

  const consulta = query(collection(db, "boletas"), orderBy("fechaCreacion", "desc"), limit(8));
  const snap = await getDocs(consulta);

  if (snap.empty) {
    const li = document.createElement("li");
    li.className = "empty-list";
    li.textContent = "Aun no hay boletas generadas.";
    historialBoletas.appendChild(li);
    return;
  }

  snap.forEach((documento) => agregarHistorialBoleta({ id: documento.id, ...documento.data() }));
}

window.generarPDF = async () => {
  const cliente = document.getElementById("cliente").value.trim() || "Cliente";
  const telefono = document.getElementById("telefono").value.trim() || "-";
  const fecha = document.getElementById("fecha").value || new Date().toLocaleDateString();
  const tipoCotizacion = document.getElementById("tipoCotizacion").value;
  const validez = Number(document.getElementById("validez").value) || 2;
  const asesor = document.getElementById("asesor").value.trim() || "XyberTechX Technology";
  const notas = document.getElementById("notas").value.trim();

  if (items.length === 0) {
    alert("Agrega al menos un detalle.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const descuento = Number(document.getElementById("descuento").value) || 0;
  const totalFinal = Math.max(subtotal - descuento, 0);
  const registro = await registrarBoleta({
    cliente,
    telefono,
    fecha,
    tipoCotizacion,
    validez,
    asesor,
    notas,
    items,
    subtotal,
    descuento,
    totalFinal
  });
  ultimaBoleta = { ...registro, cliente, telefono, totalFinal, tipoCotizacion };

  const logo = new Image();
  logo.src = "img/logo 2.0.png";

  logo.onload = () => {
    const left = 14;
    const sideWidth = 0;
    const contentX = 18;
    const contentW = 174;
    let y = 62;

    const navy = [3, 7, 18];
    const navySoft = [15, 23, 42];
    const blue = [37, 99, 235];
    const cyan = [14, 165, 233];
    const purple = [126, 34, 206];
    const paper = [3, 7, 18];
    const panel = [18, 27, 58];
    const line = [79, 70, 229];
    const ink = [248, 250, 252];

    const fill = (color) => doc.setFillColor(color[0], color[1], color[2]);
    const draw = (color) => doc.setDrawColor(color[0], color[1], color[2]);
    const color = (value) => doc.setTextColor(value[0], value[1], value[2]);

    const pageBase = (withSidebar = false) => {
      fill(paper);
      doc.rect(0, 0, 210, 297, "F");
      fill([8, 13, 31]);
      doc.roundedRect(5, 6, 200, 282, 10, 10, "F");
      fill([30, 64, 175]);
      doc.roundedRect(132, 8, 67, 38, 8, 8, "F");
      fill([88, 28, 135]);
      doc.roundedRect(12, 246, 62, 30, 8, 8, "F");
      fill([10, 18, 40]);
      doc.roundedRect(12, 13, 186, 268, 8, 8, "F");
      if (!withSidebar) return;

      fill(purple);
      doc.rect(12, 52, 186, 2, "F");
    };

    const sidebar = () => {
      doc.addImage(logo, "PNG", 22, 21, 24, 24);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(17);
      doc.setTextColor(255, 255, 255);
      doc.text("XYBERTECHX", 52, 29);
      doc.setFontSize(9);
      doc.setTextColor(147, 197, 253);
      doc.text("Technology | Servicios tecnicos y ventas", 52, 38);

      fill([124, 58, 237]);
      doc.roundedRect(142, 20, 46, 22, 5, 5, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(125, 211, 252);
      doc.text("TOTAL PROPUESTO", 151, 28);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(13);
      doc.text(`S/${dinero(totalFinal)}`, 151, 37);
    };

    const footer = () => {
      fill(navy);
      doc.rect(12, 284, 186, 9, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(226, 232, 240);
      doc.text("973 518 710 | xybertechxtechnology@gmail.com", 18, 290);
      doc.text("Gracias por confiar en XyberTechX Technology.", 192, 290, { align: "right" });
    };

    const newPageIfNeeded = (height) => {
      if (y + height <= 275) return;
      footer();
      doc.addPage();
      pageBase();
      y = 24;
    };

    const label = (title, value, x, yy, max = 30) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(147, 197, 253);
      doc.text(title.toUpperCase(), x, yy);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      color(ink);
      doc.text(textoCorto(value, max), x, yy + 7);
    };

    pageBase(true);
    sidebar();

    color(ink);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(registro.numero, contentX, y);
    doc.setFontSize(10);
    doc.setTextColor(125, 211, 252);
    doc.text("Boleta simple | Cotizacion de servicio o producto externo", contentX, y + 8);

    fill(cyan);
    doc.roundedRect(152, 61, 40, 21, 4, 4, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text("FECHA", 161, 69);
    doc.setFontSize(9);
    doc.text(fecha, 161, 77);

    y = 84;
    fill([23, 37, 84]);
    draw([59, 130, 246]);
    doc.roundedRect(contentX, y, contentW, 22, 5, 5, "FD");
    label("Cliente", cliente, 26, y + 9, 34);
    label("Telefono", telefono, 92, y + 9, 24);
    label("Validez", `${validez} dias`, 154, y + 9, 18);

    y += 30;
    fill([16, 24, 54]);
    draw(line);
    doc.roundedRect(contentX, y, contentW, 28, 5, 5, "FD");
    label("Tipo de atencion", tipoCotizacion, 26, y + 9, 36);
    label("Responsable", asesor, 26, y + 21, 36);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(147, 197, 253);
    doc.text("ALCANCE", 112, y + 9);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    color(ink);
    doc.text(doc.splitTextToSize("Servicio sujeto a revision, disponibilidad y coordinacion con el cliente.", 66), 112, y + 16);

    y += 39;
    fill(navy);
    doc.roundedRect(contentX, y, contentW, 11, 3, 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text("Detalle", 26, y + 7);
    doc.text("Cant.", 126, y + 7, { align: "center" });
    doc.text("Unit.", 158, y + 7, { align: "right" });
    doc.text("Importe", 188, y + 7, { align: "right" });
    y += 15;

    items.forEach((item, index) => {
      const lineas = doc.splitTextToSize(item.descripcion, 94);
      const rowHeight = Math.max(11, lineas.length * 5 + 4);
      newPageIfNeeded(rowHeight + 3);
      fill(index % 2 === 0 ? [15, 23, 42] : [25, 36, 78]);
      doc.roundedRect(contentX, y - 5, contentW, rowHeight, 2, 2, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.3);
      color(ink);
      doc.text(lineas, 26, y);
      doc.text(String(item.cantidad), 126, y, { align: "center" });
      doc.text(`S/${dinero(item.precio)}`, 158, y, { align: "right" });
      doc.text(`S/${dinero(item.total)}`, 188, y, { align: "right" });
      y += rowHeight + 1;
    });

    y += 8;
    newPageIfNeeded(46);
    fill([30, 41, 89]);
    draw([96, 165, 250]);
    doc.roundedRect(contentX, y, 92, 36, 5, 5, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(125, 211, 252);
    doc.text("Pago e indicaciones", 26, y + 10);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.8);
    color(ink);
    doc.text(doc.splitTextToSize(`BBVA: ${datosPago.bbva} | CCI: ${datosPago.cci} | ${datosPago.billeteras}. Enviar comprobante para confirmar.`, 78), 26, y + 18);

    fill([17, 24, 50]);
    draw(line);
    doc.roundedRect(116, y, 76, 36, 5, 5, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.3);
    color(ink);
    doc.text("Subtotal", 124, y + 11);
    doc.text(`S/${dinero(subtotal)}`, 185, y + 11, { align: "right" });
    doc.text("Descuento", 124, y + 20);
    doc.text(`S/${dinero(descuento)}`, 185, y + 20, { align: "right" });
    fill([124, 58, 237]);
    doc.roundedRect(123, y + 24, 62, 10, 3, 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(`TOTAL S/${dinero(totalFinal)}`, 154, y + 31, { align: "center" });

    y += 45;
    newPageIfNeeded(notas ? 62 : 43);
    fill([16, 24, 54]);
    draw(line);
    doc.roundedRect(contentX, y, contentW, 38, 5, 5, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    color(ink);
    doc.text("Condiciones de atencion", 26, y + 10);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.7);
    doc.setTextColor(203, 213, 225);
    doc.text(`Documento valido por ${validez} dias desde su emision.`, 26, y + 18);
    doc.text("Precios sujetos a disponibilidad de productos, repuestos o proveedor.", 26, y + 25);
    doc.text("El servicio se agenda despues de confirmar pago o adelanto coordinado.", 26, y + 32);

    if (notas) {
      y += 50;
      newPageIfNeeded(32);
      fill([30, 41, 89]);
      draw(line);
      doc.roundedRect(contentX, y, contentW, 28, 5, 5, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      color(ink);
      doc.text("Notas adicionales", 26, y + 9);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.8);
      doc.setTextColor(203, 213, 225);
      doc.text(doc.splitTextToSize(notas, 156), 26, y + 17);
    }

    footer();

    doc.save(`${registro.numero}-${limpiarNombreArchivo(cliente)}.pdf`);
    cargarHistorialBoletas();
  };

  logo.onerror = () => {
    alert("No se pudo cargar el logo. Revisa la ruta: img/logo 2.0.png");
  };
};

btnWhatsappBoleta.addEventListener("click", () => {
  if (!ultimaBoleta) {
    alert("Primero genera una boleta para preparar el mensaje.");
    return;
  }

  const telefono = telefonoWhatsapp(ultimaBoleta.telefono);
  const texto = encodeURIComponent(
    `Hola ${ultimaBoleta.cliente}, te comparto la ${ultimaBoleta.numero} de XyberTechX por ${ultimaBoleta.tipoCotizacion}. Total: S/${dinero(ultimaBoleta.totalFinal)}. Puedes pagar por BBVA, Yape o Plin y enviar el comprobante para confirmar.`
  );
  const url = telefono ? `https://wa.me/${telefono}?text=${texto}` : `https://wa.me/?text=${texto}`;
  window.open(url, "_blank");
});

renderItems();
cargarHistorialBoletas();
