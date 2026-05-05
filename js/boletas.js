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
    const left = 13;
    const sideWidth = 48;
    const contentX = 69;
    const contentW = 127;
    let y = 20;

    const navy = [5, 10, 24];
    const navySoft = [15, 23, 42];
    const blue = [37, 99, 235];
    const cyan = [14, 165, 233];
    const paper = [235, 244, 255];
    const panel = [248, 251, 255];
    const line = [178, 206, 245];
    const ink = [15, 23, 42];

    const fill = (color) => doc.setFillColor(color[0], color[1], color[2]);
    const draw = (color) => doc.setDrawColor(color[0], color[1], color[2]);
    const color = (value) => doc.setTextColor(value[0], value[1], value[2]);

    const pageBase = (withSidebar = false) => {
      fill(paper);
      doc.rect(0, 0, 210, 297, "F");
      fill([246, 250, 255]);
      doc.roundedRect(63, 12, 139, 270, 8, 8, "F");
      if (!withSidebar) return;

      fill(navy);
      doc.roundedRect(left, 12, sideWidth, 270, 8, 8, "F");
      fill(blue);
      doc.rect(left + sideWidth - 2, 12, 2, 270, "F");
    };

    const sidebar = () => {
      doc.addImage(logo, "PNG", 24, 22, 26, 26);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text("XYBERTECHX", 37, 58, { align: "center" });
      doc.setFontSize(7);
      doc.setTextColor(147, 197, 253);
      doc.text("TECHNOLOGY", 37, 64, { align: "center" });

      fill(navySoft);
      doc.roundedRect(20, 77, 34, 33, 4, 4, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(125, 211, 252);
      doc.text("TOTAL", 25, 87);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.text(`S/${dinero(totalFinal)}`, 25, 99);

      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text("CONTACTO", 23, 126);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(226, 232, 240);
      doc.text("973 518 710", 23, 135);
      doc.text("xybertechxtechnology", 23, 143);
      doc.text("@gmail.com", 23, 151);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(148, 163, 184);
      doc.text("PAGO", 23, 171);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(226, 232, 240);
      doc.text("BBVA soles", 23, 180);
      doc.text(datosPago.bbva, 23, 187);
      doc.text("CCI", 23, 199);
      doc.text(datosPago.cci, 23, 206);
      doc.text("Yape / Plin", 23, 218);
      doc.text("973 518 710", 23, 225);

      fill([30, 64, 175]);
      doc.roundedRect(20, 246, 34, 18, 4, 4, "F");
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text("Confirmar", 37, 254, { align: "center" });
      doc.text("con comprobante", 37, 260, { align: "center" });
    };

    const footer = () => {
      fill(navy);
      doc.rect(63, 284, 139, 9, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(226, 232, 240);
      doc.text("Gracias por confiar en XyberTechX Technology.", 70, 290);
      doc.text("Documento generado para atencion coordinada.", 196, 290, { align: "right" });
    };

    const newPageIfNeeded = (height) => {
      if (y + height <= 275) return;
      footer();
      doc.addPage();
      pageBase();
      y = 22;
    };

    const label = (title, value, x, yy, max = 30) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
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
    doc.setFontSize(20);
    doc.text("Boleta simple", contentX, y);
    doc.setFontSize(10);
    doc.setTextColor(37, 99, 235);
    doc.text("Cotizacion de servicio o producto externo", contentX, y + 8);

    fill(cyan);
    doc.roundedRect(157, 20, 38, 22, 4, 4, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text("FECHA", 164, 29);
    doc.setFontSize(9);
    doc.text(fecha, 164, 37);

    y = 55;
    fill([219, 234, 254]);
    draw(line);
    doc.roundedRect(contentX, y, contentW, 24, 5, 5, "FD");
    label("Cliente", cliente, 76, y + 10, 28);
    label("Telefono", telefono, 126, y + 10, 18);
    label("Validez", `${validez} dias`, 168, y + 10, 12);

    y += 35;
    fill(panel);
    draw(line);
    doc.roundedRect(contentX, y, contentW, 31, 5, 5, "FD");
    label("Tipo de atencion", tipoCotizacion, 76, y + 10, 30);
    label("Responsable", asesor, 76, y + 23, 30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text("ALCANCE", 145, y + 10);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    color(ink);
    doc.text(doc.splitTextToSize("Servicio sujeto a revision, disponibilidad y coordinacion con el cliente.", 42), 145, y + 17);

    y += 45;
    fill(navy);
    doc.roundedRect(contentX, y, contentW, 11, 3, 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text("Detalle", 75, y + 7);
    doc.text("Cant.", 145, y + 7, { align: "center" });
    doc.text("Unit.", 166, y + 7, { align: "right" });
    doc.text("Importe", 191, y + 7, { align: "right" });
    y += 15;

    items.forEach((item, index) => {
      const lineas = doc.splitTextToSize(item.descripcion, 63);
      const rowHeight = Math.max(11, lineas.length * 5 + 4);
      newPageIfNeeded(rowHeight + 3);
      fill(index % 2 === 0 ? [255, 255, 255] : [236, 245, 255]);
      doc.roundedRect(contentX, y - 5, contentW, rowHeight, 2, 2, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.3);
      color(ink);
      doc.text(lineas, 75, y);
      doc.text(String(item.cantidad), 145, y, { align: "center" });
      doc.text(`S/${dinero(item.precio)}`, 166, y, { align: "right" });
      doc.text(`S/${dinero(item.total)}`, 191, y, { align: "right" });
      y += rowHeight + 1;
    });

    y += 8;
    newPageIfNeeded(53);
    fill([219, 234, 254]);
    draw(line);
    doc.roundedRect(contentX, y, 62, 43, 5, 5, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(30, 64, 175);
    doc.text("Indicaciones", 76, y + 10);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.8);
    color(ink);
    doc.text(doc.splitTextToSize("Enviar comprobante de pago para reservar atencion, entrega o compra de repuesto.", 50), 76, y + 19);

    fill([255, 255, 255]);
    draw(line);
    doc.roundedRect(137, y, 59, 43, 5, 5, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.3);
    color(ink);
    doc.text("Subtotal", 144, y + 11);
    doc.text(`S/${dinero(subtotal)}`, 190, y + 11, { align: "right" });
    doc.text("Descuento", 144, y + 20);
    doc.text(`S/${dinero(descuento)}`, 190, y + 20, { align: "right" });
    fill(blue);
    doc.roundedRect(143, y + 27, 47, 11, 3, 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(`TOTAL S/${dinero(totalFinal)}`, 166.5, y + 34.5, { align: "center" });

    y += 57;
    newPageIfNeeded(notas ? 62 : 43);
    fill(panel);
    draw(line);
    doc.roundedRect(contentX, y, contentW, 38, 5, 5, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    color(ink);
    doc.text("Condiciones de atencion", 76, y + 10);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.7);
    doc.setTextColor(71, 85, 105);
    doc.text(`Documento valido por ${validez} dias desde su emision.`, 76, y + 18);
    doc.text("Precios sujetos a disponibilidad de productos, repuestos o proveedor.", 76, y + 25);
    doc.text("El servicio se agenda despues de confirmar pago o adelanto coordinado.", 76, y + 32);

    if (notas) {
      y += 50;
      newPageIfNeeded(32);
      fill([236, 245, 255]);
      draw(line);
      doc.roundedRect(contentX, y, contentW, 28, 5, 5, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      color(ink);
      doc.text("Notas adicionales", 76, y + 9);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.8);
      doc.setTextColor(71, 85, 105);
      doc.text(doc.splitTextToSize(notas, 112), 76, y + 17);
    }

    footer();

    doc.save(`Cotizacion-${limpiarNombreArchivo(cliente)}.pdf`);
  };

  logo.onerror = () => {
    alert("No se pudo cargar el logo. Revisa la ruta: img/logo 2.0.png");
  };
};

renderItems();
