import { db } from "../firebase.js";

import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const listaProductos = document.getElementById("listaProductos");
const buscarProducto = document.getElementById("buscarProducto");
const carritoLista = document.getElementById("carritoLista");
const totalVenta = document.getElementById("totalVenta");
const btnCobrar = document.getElementById("btnCobrar");
const metodoPago = document.getElementById("metodoPago");

let productos = [];
let carrito = [];

async function cargarProductos() {
  try {
    const querySnapshot = await getDocs(collection(db, "inventario"));
    productos = [];

    querySnapshot.forEach((documento) => {
      productos.push({
        id: documento.id,
        ...documento.data()
      });
    });

    mostrarProductos(productos);
  } catch (error) {
    console.error("Error cargando productos:", error);
    listaProductos.innerHTML = "<p>Error al cargar productos.</p>";
  }
}

function mostrarProductos(lista) {
  listaProductos.innerHTML = "";

  if (lista.length === 0) {
    listaProductos.innerHTML = "<p>No hay productos disponibles.</p>";
    return;
  }

  lista.forEach((producto) => {
    const card = document.createElement("div");
    card.classList.add("producto-card");

    card.innerHTML = `
      <h3>${producto.nombre}</h3>
      <p>Categoría: ${producto.categoria}</p>
      <p>Stock: ${producto.stock}</p>
      <strong>S/${Number(producto.precio).toFixed(2)}</strong>
      <button ${producto.stock <= 0 ? "disabled" : ""}>
        ${producto.stock <= 0 ? "Sin stock" : "Agregar"}
      </button>
    `;

    const boton = card.querySelector("button");
    boton.addEventListener("click", () => agregarAlCarrito(producto.id));

    listaProductos.appendChild(card);
  });
}

function agregarAlCarrito(idProducto) {
  const producto = productos.find((item) => item.id === idProducto);
  if (!producto) return;

  const productoEnCarrito = carrito.find((item) => item.id === idProducto);

  if (productoEnCarrito) {
    if (productoEnCarrito.cantidad >= producto.stock) {
      alert("No hay más stock disponible.");
      return;
    }

    productoEnCarrito.cantidad++;
  } else {
    carrito.push({
      id: producto.id,
      nombre: producto.nombre,
      categoria: producto.categoria,
      precio: Number(producto.precio),
      costo: Number(producto.costo || 0),
      stock: Number(producto.stock),
      cantidad: 1
    });
  }

  renderCarrito();
}

function renderCarrito() {
  carritoLista.innerHTML = "";

  if (carrito.length === 0) {
    carritoLista.innerHTML = `<p class="carrito-vacio">No hay productos agregados.</p>`;
    totalVenta.textContent = "S/0.00";
    return;
  }

  let total = 0;

  carrito.forEach((item) => {
    const subtotal = item.precio * item.cantidad;
    total += subtotal;

    const div = document.createElement("div");
    div.classList.add("carrito-item");

    div.innerHTML = `
      <div>
        <strong>${item.nombre}</strong>
        <p>S/${item.precio.toFixed(2)} x ${item.cantidad}</p>
      </div>

      <div class="carrito-actions">
        <button class="btn-menos">-</button>
        <span>${item.cantidad}</span>
        <button class="btn-mas">+</button>
        <button class="btn-eliminar">Eliminar</button>
      </div>
    `;

    div.querySelector(".btn-menos").addEventListener("click", () => disminuirCantidad(item.id));
    div.querySelector(".btn-mas").addEventListener("click", () => aumentarCantidad(item.id));
    div.querySelector(".btn-eliminar").addEventListener("click", () => eliminarDelCarrito(item.id));

    carritoLista.appendChild(div);
  });

  totalVenta.textContent = `S/${total.toFixed(2)}`;
}

function aumentarCantidad(idProducto) {
  const item = carrito.find((producto) => producto.id === idProducto);
  if (!item) return;

  if (item.cantidad >= item.stock) {
    alert("No hay más stock disponible.");
    return;
  }

  item.cantidad++;
  renderCarrito();
}

function disminuirCantidad(idProducto) {
  const item = carrito.find((producto) => producto.id === idProducto);
  if (!item) return;

  item.cantidad--;

  if (item.cantidad <= 0) {
    carrito = carrito.filter((producto) => producto.id !== idProducto);
  }

  renderCarrito();
}

function eliminarDelCarrito(idProducto) {
  carrito = carrito.filter((producto) => producto.id !== idProducto);
  renderCarrito();
}

async function procesarVenta() {
  if (carrito.length === 0) {
    alert("El carrito está vacío.");
    return;
  }

  if (!metodoPago.value) {
    alert("Selecciona un método de pago.");
    return;
  }

  try {
    btnCobrar.disabled = true;
    btnCobrar.textContent = "Procesando...";

    let total = 0;
    let ganancia = 0;

    const productosVenta = carrito.map((item) => {
      const subtotal = item.precio * item.cantidad;
      const gananciaItem = (item.precio - item.costo) * item.cantidad;

      total += subtotal;
      ganancia += gananciaItem;

      return {
        id: item.id,
        nombre: item.nombre,
        categoria: item.categoria,
        precio: item.precio,
        costo: item.costo,
        cantidad: item.cantidad,
        subtotal: subtotal,
        ganancia: gananciaItem
      };
    });

    const ventaRef = await addDoc(collection(db, "ventas"), {
      fecha: new Date(),
      productos: productosVenta,
      total: total,
      ganancia: ganancia,
      metodoPago: metodoPago.value,
      origen: "POS",
      estado: "completada"
    });

    for (const item of carrito) {
      const productoRef = doc(db, "inventario", item.id);
      const nuevoStock = item.stock - item.cantidad;

      await updateDoc(productoRef, {
        stock: nuevoStock
      });
    }

    carrito = [];
    metodoPago.value = "";
    renderCarrito();

    window.location.href = `ticket.html?id=${ventaRef.id}`;
    return;

  } catch (error) {
    console.error("Error al procesar venta:", error);
    alert("Error al procesar la venta.");
  } finally {
    btnCobrar.disabled = false;
    btnCobrar.textContent = "Cobrar venta";
  }
}

buscarProducto.addEventListener("input", () => {
  const texto = buscarProducto.value.toLowerCase();

  const filtrados = productos.filter((producto) =>
    producto.nombre.toLowerCase().includes(texto) ||
    producto.categoria.toLowerCase().includes(texto)
  );

  mostrarProductos(filtrados);
});

btnCobrar.addEventListener("click", procesarVenta);

cargarProductos();