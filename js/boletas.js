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
    const margen = 14;
    const ancho = 182;
    let y = 16;

    const azul = [37, 99, 235];
    const azulOscuro = [5, 10, 24];
    const texto = [15, 23, 42];
    const suave = [248, 250, 252];
    const borde = [226, 232, 240];

    const setColor = (color) => doc.setTextColor(color[0], color[1], color[2]);
    const setFill = (color) => doc.setFillColor(color[0], color[1], color[2]);
    const setDraw = (color) => doc.setDrawColor(color[0], color[1], color[2]);

    const footer = () => {
      setFill(azulOscuro);
      doc.rect(0, 286, 210, 11, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text("XyberTechX Technology", margen, 293);
      doc.setFont("helvetica", "normal");
      doc.text("Cel. 973 518 710 | xybertechxtechnology@gmail.com", 88, 293);
    };

    const saltarSiHaceFalta = (alto) => {
      if (y + alto <= 278) return;
      footer();
      doc.addPage();
      y = 16;
    };

    const etiqueta = (label, value, x, yy, max = 42) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(label.toUpperCase(), x, yy);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      setColor(texto);
      doc.text(textoCorto(value, max), x, yy + 7);
    };

    setFill(azulOscuro);
    doc.rect(0, 0, 210, 44, "F");
    setFill(azul);
    doc.rect(0, 42, 210, 2, "F");
    doc.addImage(logo, "PNG", margen, 9, 24, 24);

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("XYBERTECHX TECHNOLOGY", 44, 18);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text("Servicios tecnicos, ventas, mantenimiento y armado de PC", 44, 28);
    doc.text("Cel: 973 518 710 | xybertechxtechnology@gmail.com", 44, 36);

    setFill([14, 165, 233]);
    doc.roundedRect(150, 10, 46, 23, 3, 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text("DOCUMENTO", 158, 19);
    doc.setFontSize(10.5);
    doc.text("BOLETA SIMPLE", 158, 27);

    y = 56;
    setColor(texto);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Cotizacion / Boleta simple", margen, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`Fecha: ${fecha}`, 196, y, { align: "right" });

    y += 12;
    setFill(suave);
    setDraw(borde);
    doc.roundedRect(margen, y, ancho, 30, 4, 4, "FD");
    etiqueta("Cliente", cliente, 20, y + 10, 34);
    etiqueta("Telefono", telefono, 20, y + 22, 24);
    etiqueta("Tipo", tipoCotizacion, 86, y + 10, 32);
    etiqueta("Asesor", asesor, 86, y + 22, 32);
    etiqueta("Validez", `${validez} dias`, 158, y + 10, 18);

    y += 44;
    setFill(azul);
    doc.roundedRect(margen, y, ancho, 10, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text("Detalle", 20, y + 6.5);
    doc.text("Cant.", 119, y + 6.5);
    doc.text("Unitario", 145, y + 6.5, { align: "right" });
    doc.text("Importe", 190, y + 6.5, { align: "right" });
    y += 13;

    items.forEach((item, index) => {
      const lineas = doc.splitTextToSize(item.descripcion, 88);
      const alto = Math.max(10, lineas.length * 5 + 3);
      saltarSiHaceFalta(alto + 2);

      if (index % 2 === 0) {
        setFill([250, 252, 255]);
        doc.rect(margen, y - 5, ancho, alto, "F");
      }

      setColor(texto);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.text(lineas, 20, y);
      doc.text(String(item.cantidad), 123, y, { align: "center" });
      doc.text(`S/${dinero(item.precio)}`, 145, y, { align: "right" });
      doc.text(`S/${dinero(item.total)}`, 190, y, { align: "right" });
      y += alto;
    });

    y += 8;
    saltarSiHaceFalta(52);

    setFill([239, 246, 255]);
    setDraw([191, 219, 254]);
    doc.roundedRect(margen, y, 103, 43, 4, 4, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(30, 64, 175);
    doc.text("Datos de pago", 20, y + 9);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.3);
    setColor(texto);
    doc.text(`BBVA soles: ${datosPago.bbva}`, 20, y + 18);
    doc.text(`CCI: ${datosPago.cci}`, 20, y + 26);
    doc.text(datosPago.billeteras, 20, y + 34);
    doc.setTextColor(100, 116, 139);
    doc.text("Enviar comprobante para confirmar.", 20, y + 40);

    setFill(suave);
    setDraw(borde);
    doc.roundedRect(124, y, 72, 43, 4, 4, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.7);
    setColor(texto);
    doc.text("Subtotal", 132, y + 11);
    doc.text(`S/${dinero(subtotal)}`, 189, y + 11, { align: "right" });
    doc.text("Descuento", 132, y + 20);
    doc.text(`S/${dinero(descuento)}`, 189, y + 20, { align: "right" });
    setFill(azul);
    doc.roundedRect(130, y + 27, 60, 11, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(`TOTAL: S/${dinero(totalFinal)}`, 160, y + 34.5, { align: "center" });

    y += 57;
    saltarSiHaceFalta(notas ? 58 : 37);
    setDraw(borde);
    setFill([255, 255, 255]);
    doc.roundedRect(margen, y, ancho, 32, 4, 4, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    setColor(texto);
    doc.text("Condiciones", 20, y + 9);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`Valido por ${validez} dias desde su emision.`, 20, y + 17);
    doc.text("Precios sujetos a disponibilidad de productos, repuestos o proveedor.", 20, y + 23);
    doc.text("Garantia segun condiciones del servicio, producto o proveedor.", 20, y + 29);

    if (notas) {
      y += 42;
      saltarSiHaceFalta(30);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      setColor(texto);
      doc.text("Notas", 20, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(doc.splitTextToSize(notas, 170), 20, y + 8);
    }

    footer();

    doc.save(`Cotizacion-${limpiarNombreArchivo(cliente)}.pdf`);
  };

  logo.onerror = () => {
    alert("No se pudo cargar el logo. Revisa la ruta: img/logo 2.0.png");
  };
};

renderItems();
