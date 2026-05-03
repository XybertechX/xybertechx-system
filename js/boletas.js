let items = [];

const listaItems = document.getElementById("listaItems");
const subtotalSpan = document.getElementById("subtotal");
const totalFinalSpan = document.getElementById("totalFinal");

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

  const logo = new Image();
  logo.src = "img/logo 2.0.png";

  logo.onload = () => {
    const margen = 15;
    let y = 18;

    const pintarFooter = () => {
      doc.setFillColor(6, 12, 28);
      doc.rect(0, 284, 210, 13, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text("XyberTechX Technology", margen, 292);
      doc.setFont("helvetica", "normal");
      doc.text("Gracias por confiar en nosotros.", 155, 292);
    };

    const nuevaPaginaSiHaceFalta = (altoNecesario) => {
      if (y + altoNecesario <= 274) return;
      pintarFooter();
      doc.addPage();
      y = 18;
    };

    doc.setFillColor(6, 12, 28);
    doc.rect(0, 0, 210, 52, "F");
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 50, 210, 2, "F");
    doc.addImage(logo, "PNG", margen, 11, 26, 26);

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    doc.text("XYBERTECHX TECHNOLOGY", 46, 19);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Servicios tecnicos | Ventas | Mantenimiento | Armado de PC", 46, 29);
    doc.text("Cel: 973 518 710 | xybertechxtechnology@gmail.com", 46, 37);

    doc.setFillColor(14, 165, 233);
    doc.roundedRect(142, 13, 53, 22, 3, 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("DOCUMENTO", 149, 21);
    doc.setFontSize(12);
    doc.text("BOLETA SIMPLE", 149, 29);

    y = 66;
    doc.setTextColor(6, 12, 28);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text("Cotizacion / Boleta simple", margen, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`Fecha: ${fecha}`, 150, y);

    y += 10;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margen, y, 180, 38, 4, 4, "FD");
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("CLIENTE", 21, y + 9);
    doc.text("SERVICIO", 112, y + 9);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(`Nombre: ${textoCorto(cliente, 36)}`, 21, y + 18);
    doc.text(`Telefono: ${telefono}`, 21, y + 27);
    doc.text(`Tipo: ${textoCorto(tipoCotizacion, 32)}`, 112, y + 18);
    doc.text(`Asesor: ${textoCorto(asesor, 32)}`, 112, y + 27);
    doc.text(`Validez: ${validez} dias`, 112, y + 34);

    y += 54;
    doc.setFillColor(37, 99, 235);
    doc.roundedRect(margen, y - 7, 180, 10, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text("Detalle", 20, y);
    doc.text("Cant.", 118, y);
    doc.text("Unitario", 142, y);
    doc.text("Importe", 174, y);

    y += 9;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);

    items.forEach((item, index) => {
      nuevaPaginaSiHaceFalta(12);

      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margen, y - 5, 180, 9, "F");
      }

      doc.text(textoCorto(item.descripcion, 58), 20, y);
      doc.text(String(item.cantidad), 122, y);
      doc.text(`S/${dinero(item.precio)}`, 142, y);
      doc.text(`S/${dinero(item.total)}`, 174, y);
      y += 9;
    });

    y += 7;
    nuevaPaginaSiHaceFalta(44);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(112, y, 83, 40, 4, 4, "FD");
    doc.setTextColor(71, 85, 105);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Subtotal: S/${dinero(subtotal)}`, 121, y + 10);
    doc.text(`Descuento: S/${dinero(descuento)}`, 121, y + 19);
    doc.setFillColor(37, 99, 235);
    doc.roundedRect(119, y + 24, 69, 11, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text(`TOTAL: S/${dinero(totalFinal)}`, 126, y + 31.5);

    y += 52;
    nuevaPaginaSiHaceFalta(48);
    doc.setFillColor(239, 246, 255);
    doc.setDrawColor(191, 219, 254);
    doc.roundedRect(margen, y, 180, 36, 4, 4, "FD");
    doc.setTextColor(30, 64, 175);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Datos de pago", 21, y + 9);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`BBVA soles: ${datosPago.bbva}`, 21, y + 18);
    doc.text(`CCI: ${datosPago.cci}`, 21, y + 27);
    doc.text(datosPago.billeteras, 112, y + 18);
    doc.text("Enviar comprobante para confirmar el servicio o entrega.", 112, y + 27);

    y += 48;
    nuevaPaginaSiHaceFalta(notas ? 70 : 46);
    doc.setFillColor(249, 250, 251);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margen, y, 180, 40, 4, 4, "FD");
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Condiciones", 21, y + 9);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(`Cotizacion valida por ${validez} dias desde su emision.`, 21, y + 18);
    doc.text("Los precios pueden variar segun disponibilidad de productos o repuestos.", 21, y + 25);
    doc.text("La atencion se realiza previa coordinacion con el cliente.", 21, y + 32);
    doc.text("Garantia segun condiciones del servicio, producto o proveedor.", 21, y + 39);

    if (notas) {
      y += 52;
      nuevaPaginaSiHaceFalta(32);
      doc.setFont("helvetica", "bold");
      doc.text("Notas", 21, y);
      doc.setFont("helvetica", "normal");
      doc.text(doc.splitTextToSize(notas, 170), 21, y + 8);
    }

    pintarFooter();

    doc.save(`Cotizacion-${limpiarNombreArchivo(cliente)}.pdf`);
  };

  logo.onerror = () => {
    alert("No se pudo cargar el logo. Revisa la ruta: img/logo 2.0.png");
  };
};

renderItems();
