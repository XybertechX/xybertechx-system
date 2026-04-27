import { db } from "../firebase.js";

import {
  collection,
  getDocs,
  doc,
  updateDoc,
  increment
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const listaDevoluciones = document.getElementById("listaDevoluciones");
const buscarDevolucion = document.getElementById("buscarDevolucion");

let ventas = [];

async function cargarVentas() {
  try {
    listaDevoluciones.innerHTML = `<p class="carrito-vacio">Cargando ventas...</p>`;

    const querySnapshot = await getDocs(collection(db, "ventas"));

    ventas = [];

    querySnapshot.forEach((documento) => {
      ventas.push({
        id: documento.id,
        ...documento.data()
      });
    });

    ventas.sort((a, b) => {
      const fechaA = a.fecha?.toDate ? a.fecha.toDate() : new Date(0);
      const fechaB = b.fecha?.toDate ? b.fecha.toDate() : new Date(0);
      return fechaB - fechaA;
    });

    mostrarVentas(ventas);

  } catch (error) {
    console.error("Error cargando devoluciones:", error);
    listaDevoluciones.innerHTML = `<p class="carrito-vacio">Error al cargar ventas.</p>`;
  }
}

function mostrarVentas(lista) {
  listaDevoluciones.innerHTML = "";

  const ventasValidas = lista.filter((venta) => venta.estado !== "devuelta");

  if (ventasValidas.length === 0) {
    listaDevoluciones.innerHTML = `
      <p class="carrito-vacio">No hay ventas disponibles para devolución.</p>
    `;
    return;
  }

  ventasValidas.forEach((venta) => {
    const fecha = venta.fecha?.toDate
      ? venta.fecha.toDate().toLocaleString("es-PE", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        })
      : "Fecha no disponible";

    const card = document.createElement("div");
    card.classList.add("devolucion-card");

    card.innerHTML = `
      <div class="devolucion-header">
        <div>
          <h3>Venta #${venta.id.slice(0, 6)}</h3>
          <span>${fecha}</span>
        </div>

        <div class="devolucion-total">
          <small>Total</small>
          <strong>S/${Number(venta.total).toFixed(2)}</strong>
        </div>
      </div>

      <div class="devolucion-productos">
        ${venta.productos.map((producto) => `
          <div class="devolucion-producto">
            <div>
              <strong>${producto.nombre}</strong>
              <span>Cantidad: ${producto.cantidad}</span>
            </div>
            <p>S/${Number(producto.subtotal).toFixed(2)}</p>
          </div>
        `).join("")}
      </div>

      <div class="devolucion-footer">
        <span class="estado-venta">Lista para devolución</span>
        <button class="btn-devolver">Devolver venta</button>
      </div>
    `;

    card.querySelector(".btn-devolver").addEventListener("click", () => devolverVenta(venta));

    listaDevoluciones.appendChild(card);
  });
}

async function devolverVenta(venta) {
  const confirmar = confirm(
    `¿Confirmas devolver la venta #${venta.id.slice(0, 6)} por S/${Number(venta.total).toFixed(2)}?`
  );

  if (!confirmar) return;

  try {
    for (const producto of venta.productos) {
      const productoRef = doc(db, "inventario", producto.id);

      await updateDoc(productoRef, {
        stock: increment(Number(producto.cantidad))
      });
    }

    const ventaRef = doc(db, "ventas", venta.id);

    await updateDoc(ventaRef, {
      estado: "devuelta",
      fechaDevolucion: new Date()
    });

    alert("Devolución registrada correctamente.");
    cargarVentas();

  } catch (error) {
    console.error("Error procesando devolución:", error);
    alert("Error al procesar la devolución.");
  }
}

buscarDevolucion.addEventListener("input", () => {
  const texto = buscarDevolucion.value.trim().toLowerCase();

  const filtradas = ventas.filter((venta) => {
    const idVenta = venta.id.toLowerCase();

    const productosTexto = venta.productos
      .map((producto) => producto.nombre.toLowerCase())
      .join(" ");

    return idVenta.includes(texto) || productosTexto.includes(texto);
  });

  mostrarVentas(filtradas);
});

cargarVentas();