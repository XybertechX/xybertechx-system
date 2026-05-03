import { db } from "../firebase.js";

import {
  collection,
  doc,
  getDocs,
  increment,
  runTransaction,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const listaDevoluciones = document.getElementById("listaDevoluciones");
const buscarDevolucion = document.getElementById("buscarDevolucion");

let ventas = [];

function fechaComoDate(fecha) {
  if (!fecha) return null;
  if (fecha.toDate) return fecha.toDate();

  const convertida = new Date(fecha);
  return isNaN(convertida.getTime()) ? null : convertida;
}

function setMensaje(texto) {
  listaDevoluciones.innerHTML = "";
  const p = document.createElement("p");
  p.className = "carrito-vacio";
  p.textContent = texto;
  listaDevoluciones.appendChild(p);
}

async function cargarVentas() {
  try {
    setMensaje("Cargando ventas...");

    const querySnapshot = await getDocs(collection(db, "ventas"));

    ventas = [];

    querySnapshot.forEach((documento) => {
      ventas.push({
        id: documento.id,
        ...documento.data()
      });
    });

    ventas.sort((a, b) => {
      const fechaA = fechaComoDate(a.fecha) || new Date(0);
      const fechaB = fechaComoDate(b.fecha) || new Date(0);
      return fechaB - fechaA;
    });

    mostrarVentas(ventas);
  } catch (error) {
    console.error("Error cargando devoluciones:", error);
    setMensaje("Error al cargar ventas.");
  }
}

function crearProductoDevuelto(producto) {
  const row = document.createElement("div");
  row.className = "devolucion-producto";

  const detalle = document.createElement("div");
  const nombre = document.createElement("strong");
  nombre.textContent = producto.nombre || "Producto";
  const cantidad = document.createElement("span");
  cantidad.textContent = `Cantidad: ${producto.cantidad || 0}`;
  detalle.append(nombre, cantidad);

  const subtotal = document.createElement("p");
  subtotal.textContent = `S/${Number(producto.subtotal || producto.precio * producto.cantidad || 0).toFixed(2)}`;

  row.append(detalle, subtotal);
  return row;
}

function mostrarVentas(lista) {
  listaDevoluciones.innerHTML = "";

  const ventasValidas = lista.filter((venta) => venta.estado !== "devuelta");

  if (ventasValidas.length === 0) {
    setMensaje("No hay ventas disponibles para devolucion.");
    return;
  }

  ventasValidas.forEach((venta) => {
    const fechaDate = fechaComoDate(venta.fecha);
    const fecha = fechaDate
      ? fechaDate.toLocaleString("es-PE", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        })
      : "Fecha no disponible";

    const card = document.createElement("div");
    card.classList.add("devolucion-card");

    const header = document.createElement("div");
    header.className = "devolucion-header";

    const tituloBox = document.createElement("div");
    const titulo = document.createElement("h3");
    titulo.textContent = `Venta #${venta.id.slice(0, 6)}`;
    const fechaNode = document.createElement("span");
    fechaNode.textContent = fecha;
    tituloBox.append(titulo, fechaNode);

    const totalBox = document.createElement("div");
    totalBox.className = "devolucion-total";
    const totalLabel = document.createElement("small");
    totalLabel.textContent = "Total";
    const totalValor = document.createElement("strong");
    totalValor.textContent = `S/${Number(venta.total || 0).toFixed(2)}`;
    totalBox.append(totalLabel, totalValor);
    header.append(tituloBox, totalBox);

    const productosBox = document.createElement("div");
    productosBox.className = "devolucion-productos";
    (venta.productos || []).forEach((producto) => {
      productosBox.appendChild(crearProductoDevuelto(producto));
    });

    const footer = document.createElement("div");
    footer.className = "devolucion-footer";
    const estado = document.createElement("span");
    estado.className = "estado-venta";
    estado.textContent = "Lista para devolucion";
    const boton = document.createElement("button");
    boton.className = "btn-devolver";
    boton.textContent = "Devolver venta";
    boton.addEventListener("click", () => devolverVenta(venta));
    footer.append(estado, boton);

    card.append(header, productosBox, footer);
    listaDevoluciones.appendChild(card);
  });
}

async function devolverVenta(venta) {
  const confirmar = confirm(
    `Confirmas devolver la venta #${venta.id.slice(0, 6)} por S/${Number(venta.total || 0).toFixed(2)}?`
  );

  if (!confirmar) return;

  try {
    const ventaRef = doc(db, "ventas", venta.id);

    await runTransaction(db, async (transaction) => {
      const ventaSnap = await transaction.get(ventaRef);

      if (!ventaSnap.exists()) {
        throw new Error("La venta ya no existe.");
      }

      const ventaActual = ventaSnap.data();
      if (ventaActual.estado === "devuelta") {
        throw new Error("La venta ya fue devuelta.");
      }

      for (const producto of ventaActual.productos || []) {
        const productoRef = doc(db, "inventario", producto.id);
        transaction.update(productoRef, {
          stock: increment(Number(producto.cantidad || 0))
        });
      }

      transaction.update(ventaRef, {
        estado: "devuelta",
        fechaDevolucion: serverTimestamp()
      });
    });

    alert("Devolucion registrada correctamente.");
    cargarVentas();
  } catch (error) {
    console.error("Error procesando devolucion:", error);
    alert(error.message || "Error al procesar la devolucion.");
  }
}

buscarDevolucion.addEventListener("input", () => {
  const texto = buscarDevolucion.value.trim().toLowerCase();

  const filtradas = ventas.filter((venta) => {
    const idVenta = venta.id.toLowerCase();

    const productosTexto = (venta.productos || [])
      .map((producto) => String(producto.nombre || "").toLowerCase())
      .join(" ");

    return idVenta.includes(texto) || productosTexto.includes(texto);
  });

  mostrarVentas(filtradas);
});

cargarVentas();
