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
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 52, "F");

    doc.setFillColor(37, 99, 235);
    doc.rect(0, 49, 210, 3, "F");

    doc.addImage(logo, "PNG", 15, 10, 30, 30);

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("XYBERTECHX TECHNOLOGY", 52, 18);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Servicios tecnicos | Ventas | Mantenimiento | Armado de PC", 52, 29);
    doc.text("Cel: 973518710 | xybertechxtechnology@gmail.com", 52, 38);

    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text("COTIZACION / BOLETA SIMPLE", 15, 66);

    doc.setFillColor(245, 247, 250);
    doc.setDrawColor(220, 226, 235);
    doc.roundedRect(15, 76, 180, 38, 3, 3, "FD");

    doc.setFontSize(10);
    doc.text("DATOS DEL CLIENTE", 20, 84);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Cliente: ${cliente}`, 20, 93);
    doc.text(`Telefono: ${telefono}`, 20, 101);
    doc.text(`Fecha: ${fecha}`, 115, 93);
    doc.text(`Tipo: ${tipoCotizacion}`, 115, 101);
    doc.text(`Validez: ${validez} dias`, 20, 109);
    doc.text(`Asesor: ${asesor}`, 115, 109);

    let y = 130;

    doc.setFillColor(37, 99, 235);
    doc.roundedRect(15, y - 7, 180, 10, 2, 2, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Descripcion", 18, y);
    doc.text("Cant.", 118, y);
    doc.text("P. Unit.", 143, y);
    doc.text("Total", 176, y);

    y += 8;
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "normal");

    items.forEach((item, index) => {
      if (y > 250) {
        doc.addPage();
        y = 25;
      }

      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(15, y - 5, 180, 8, "F");
      }

      doc.text(item.descripcion.substring(0, 52), 18, y);
      doc.text(String(item.cantidad), 122, y);
      doc.text(`S/${dinero(item.precio)}`, 143, y);
      doc.text(`S/${dinero(item.total)}`, 174, y);
      y += 8;
    });

    y += 8;
    doc.setDrawColor(220, 226, 235);
    doc.line(115, y, 195, y);
    y += 8;

    doc.text(`Subtotal: S/${dinero(subtotal)}`, 125, y);
    y += 7;
    doc.text(`Descuento: S/${dinero(descuento)}`, 125, y);
    y += 10;

    doc.setFillColor(37, 99, 235);
    doc.roundedRect(115, y, 80, 16, 3, 3, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`TOTAL FINAL: S/${dinero(totalFinal)}`, 123, y + 10);

    y += 30;
    doc.setTextColor(15, 23, 42);
    doc.setFillColor(249, 250, 251);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(15, y, 180, 42, 3, 3, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("CONDICIONES", 20, y + 8);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(`Cotizacion valida por ${validez} dias desde su emision.`, 20, y + 17);
    doc.text("Los precios pueden variar segun disponibilidad de productos o repuestos.", 20, y + 24);
    doc.text("La atencion se realiza previa coordinacion con el cliente.", 20, y + 31);
    doc.text("Garantia segun condiciones del servicio, producto o proveedor.", 20, y + 38);

    if (notas) {
      y += 52;
      if (y > 245) {
        doc.addPage();
        y = 20;
      }

      doc.setFont("helvetica", "bold");
      doc.text("NOTAS", 20, y);
      doc.setFont("helvetica", "normal");
      doc.text(doc.splitTextToSize(notas, 170), 20, y + 8);
    }

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 285, 210, 12, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Gracias por confiar en XyberTechX Technology.", 15, 292);

    doc.save(`Cotizacion-${limpiarNombreArchivo(cliente)}.pdf`);
  };

  logo.onerror = () => {
    alert("No se pudo cargar el logo. Revisa la ruta: img/logo 2.0.png");
  };
};

renderItems();
