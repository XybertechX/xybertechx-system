let items = [];

const listaItems = document.getElementById("listaItems");
const subtotalSpan = document.getElementById("subtotal");
const totalFinalSpan = document.getElementById("totalFinal");

window.agregarItem = () => {
  const descripcion = document.getElementById("descripcion").value;
  const cantidad = Number(document.getElementById("cantidad").value);
  const precio = Number(document.getElementById("precio").value);

  if (!descripcion || cantidad <= 0 || precio <= 0) {
    alert("Completa descripción, cantidad y precio.");
    return;
  }

  items.push({
    descripcion,
    cantidad,
    precio,
    total: cantidad * precio
  });

  document.getElementById("descripcion").value = "";
  document.getElementById("cantidad").value = "";
  document.getElementById("precio").value = "";

  renderItems();
};

function renderItems() {
  listaItems.innerHTML = "";

  items.forEach((item, index) => {
    const li = document.createElement("li");
    li.className = "cart-item";

    li.innerHTML = `
      <div>
        <strong>${item.descripcion}</strong>
        <span class="badge">x${item.cantidad}</span>
      </div>

      <div>
        <small>Precio</small>
        <strong>S/${item.precio.toFixed(2)}</strong>
      </div>

      <div>
        <small>Total</small>
        <strong>S/${item.total.toFixed(2)}</strong>
      </div>
    `;

    const btn = document.createElement("button");
    btn.textContent = "Quitar";
    btn.className = "btn-danger";

    btn.onclick = () => {
      items.splice(index, 1);
      renderItems();
    };

    li.appendChild(btn);
    listaItems.appendChild(li);
  });

  calcularTotales();
}

window.calcularTotales = () => {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const descuento = Number(document.getElementById("descuento").value) || 0;
  const totalFinal = Math.max(subtotal - descuento, 0);

  subtotalSpan.textContent = subtotal.toFixed(2);
  totalFinalSpan.textContent = totalFinal.toFixed(2);
};

window.generarPDF = async () => {
  const cliente = document.getElementById("cliente").value || "Cliente";
  const telefono = document.getElementById("telefono").value || "-";
  const fecha = document.getElementById("fecha").value || new Date().toLocaleDateString();
  const tipoCotizacion = document.getElementById("tipoCotizacion").value;

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
    // ===== HEADER PREMIUM =====
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 55, "F");

    doc.setFillColor(79, 70, 229);
    doc.rect(0, 50, 210, 5, "F");

    doc.addImage(logo, "PNG", 15, 10, 32, 32);

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("XYBERTECHX TECHNOLOGY", 52, 18);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Tecnología que responde.", 52, 26);
    doc.text("Servicio técnico | Ventas | Mantenimiento | Armado de PC", 52, 33);
    doc.text("Cel: 973518710", 52, 40);
    doc.text("Correo: xybertechxtechnology@gmail.com", 52, 47);

    // ===== TÍTULO =====
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text("COTIZACIÓN / PRESUPUESTO TÉCNICO", 15, 68);

    // ===== CAJA CLIENTE =====
    doc.setFillColor(245, 247, 250);
    doc.setDrawColor(220, 226, 235);
    doc.roundedRect(15, 76, 180, 34, 3, 3, "FD");

    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("DATOS DEL CLIENTE", 20, 84);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Cliente: ${cliente}`, 20, 92);
    doc.text(`Teléfono: ${telefono}`, 20, 99);
    doc.text(`Fecha: ${fecha}`, 115, 92);
    doc.text(`Tipo: ${tipoCotizacion}`, 115, 99);

    // ===== TABLA =====
    let y = 125;

    doc.setFillColor(79, 70, 229);
    doc.roundedRect(15, y - 7, 180, 10, 2, 2, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Descripción", 18, y);
    doc.text("Cant.", 118, y);
    doc.text("P. Unit.", 143, y);
    doc.text("Total", 176, y);

    y += 8;

    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

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
      doc.text(`S/${item.precio.toFixed(2)}`, 143, y);
      doc.text(`S/${item.total.toFixed(2)}`, 174, y);

      y += 8;
    });

    // ===== RESUMEN TOTAL =====
    y += 8;

    doc.setDrawColor(220, 226, 235);
    doc.line(115, y, 195, y);
    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Subtotal: S/${subtotal.toFixed(2)}`, 125, y);
    y += 7;
    doc.text(`Descuento: S/${descuento.toFixed(2)}`, 125, y);
    y += 10;

    doc.setFillColor(79, 70, 229);
    doc.roundedRect(115, y, 80, 16, 3, 3, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`TOTAL FINAL: S/${totalFinal.toFixed(2)}`, 123, y + 10);

    doc.setTextColor(15, 23, 42);

    // ===== DATOS DE PAGO EN CUADRO =====
    y += 28;

    if (y > 230) {
      doc.addPage();
      y = 20;
    }

    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(134, 239, 172);
    doc.roundedRect(15, y, 180, 32, 3, 3, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("CUENTAS BANCARIAS", 20, y + 8);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Banco: BBVA", 20, y + 17);
    doc.text("Cuenta Soles: 0011-0579-0237635522", 20, y + 24);

    doc.text("CCI: 01157900023763552204", 105, y + 17);
    doc.text("Titular: Alexis Jair Ninahuaman Tello", 105, y + 24);

    // ===== CONDICIONES =====
    y += 45;

    if (y > 235) {
      doc.addPage();
      y = 20;
    }

    doc.setFillColor(249, 250, 251);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(15, y, 180, 50, 3, 3, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("CONDICIONES DEL SERVICIO", 20, y + 8);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text("• Cotización válida por 48 horas desde su emisión.", 20, y + 17);
    doc.text("• Los precios pueden variar según disponibilidad de productos, repuestos o componentes.", 20, y + 23);
    doc.text("• La atención se realiza previa coordinación con el cliente.", 20, y + 29);
    doc.text("• Garantía de hasta 1 año en productos nuevos, según condiciones del proveedor.", 20, y + 35);
    doc.text("• En servicios técnicos, la garantía aplica sobre el trabajo realizado.", 20, y + 41);
    doc.text("• El diagnóstico puede variar si se detectan fallas adicionales durante la revisión.", 20, y + 47);

    // ===== FOOTER =====
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 285, 210, 12, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Gracias por confiar en XyberTechX Technology.", 15, 292);

    doc.setFont("helvetica", "normal");
    doc.text("Tecnología que responde.", 140, 292);

    const nombreArchivo = `Cotizacion-${cliente.replaceAll(" ", "-")}.pdf`;
    doc.save(nombreArchivo);
  };

  logo.onerror = () => {
    alert("No se pudo cargar el logo. Revisa la ruta: img/logo 2.0.png");
  };
};