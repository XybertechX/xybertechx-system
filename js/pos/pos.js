import { db } from "../firebase.js";

import {
  collection,
  doc,
  getDocs,
  runTransaction,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const listaProductos = document.getElementById("listaProductos");
const buscarProducto = document.getElementById("buscarProducto");
const carritoLista = document.getElementById("carritoLista");
const totalVenta = document.getElementById("totalVenta");
const btnCobrar = document.getElementById("btnCobrar");
const metodoPago = document.getElementById("metodoPago");

let productos = [];
let carrito = [];

function dinero(valor) {
  return `S/${Number(valor || 0).toFixed(2)}`;
}

function setMensajeVacio(contenedor, texto) {
  contenedor.innerHTML = "";
  const p = document.createElement("p");
  p.className = "carrito-vacio";
  p.textContent = texto;
  contenedor.appendChild(p);
}

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
    setMensajeVacio(listaProductos, "Error al cargar productos.");
  }
}

function mostrarProductos(lista) {
  listaProductos.innerHTML = "";

  if (lista.length === 0) {
    setMensajeVacio(listaProductos, "No hay productos disponibles.");
    return;
  }

  lista.forEach((producto) => {
    const stockProducto = Number(producto.stock || 0);
    const card = document.createElement("div");
    card.classList.add("producto-card");

    const nombre = document.createElement("h3");
    nombre.textContent = producto.nombre || "Producto sin nombre";

    const categoria = document.createElement("p");
    categoria.textContent = `Categoria: ${producto.categoria || "Sin categoria"}`;

    const stock = document.createElement("p");
    stock.textContent = `Stock: ${stockProducto}`;

    const precio = document.createElement("strong");
    precio.textContent = dinero(producto.precio);

    const boton = document.createElement("button");
    boton.disabled = stockProducto <= 0;
    boton.textContent = boton.disabled ? "Sin stock" : "Agregar";
    boton.addEventListener("click", () => agregarAlCarrito(producto.id));

    card.append(nombre, categoria, stock, precio, boton);
    listaProductos.appendChild(card);
  });
}

function agregarAlCarrito(idProducto) {
  const producto = productos.find((item) => item.id === idProducto);
  if (!producto) return;

  const productoEnCarrito = carrito.find((item) => item.id === idProducto);
  const stockProducto = Number(producto.stock || 0);

  if (productoEnCarrito) {
    if (productoEnCarrito.cantidad >= stockProducto) {
      alert("No hay mas stock disponible.");
      return;
    }

    productoEnCarrito.cantidad++;
  } else {
    carrito.push({
      id: producto.id,
      nombre: producto.nombre || "Producto",
      categoria: producto.categoria || "",
      precio: Number(producto.precio || 0),
      costo: Number(producto.costo || 0),
      stock: stockProducto,
      cantidad: 1
    });
  }

  renderCarrito();
}

function renderCarrito() {
  carritoLista.innerHTML = "";

  if (carrito.length === 0) {
    setMensajeVacio(carritoLista, "No hay productos agregados.");
    totalVenta.textContent = "S/0.00";
    return;
  }

  let total = 0;

  carrito.forEach((item) => {
    const subtotal = item.precio * item.cantidad;
    total += subtotal;

    const div = document.createElement("div");
    div.classList.add("carrito-item");

    const detalle = document.createElement("div");
    const nombre = document.createElement("strong");
    nombre.textContent = item.nombre;
    const precio = document.createElement("p");
    precio.textContent = `${dinero(item.precio)} x ${item.cantidad}`;
    detalle.append(nombre, precio);

    const acciones = document.createElement("div");
    acciones.classList.add("carrito-actions");

    const btnMenos = document.createElement("button");
    btnMenos.classList.add("btn-menos");
    btnMenos.textContent = "-";
    btnMenos.addEventListener("click", () => disminuirCantidad(item.id));

    const cantidad = document.createElement("span");
    cantidad.textContent = item.cantidad;

    const btnMas = document.createElement("button");
    btnMas.classList.add("btn-mas");
    btnMas.textContent = "+";
    btnMas.addEventListener("click", () => aumentarCantidad(item.id));

    const btnEliminar = document.createElement("button");
    btnEliminar.classList.add("btn-eliminar");
    btnEliminar.textContent = "Eliminar";
    btnEliminar.addEventListener("click", () => eliminarDelCarrito(item.id));

    acciones.append(btnMenos, cantidad, btnMas, btnEliminar);
    div.append(detalle, acciones);
    carritoLista.appendChild(div);
  });

  totalVenta.textContent = dinero(total);
}

function aumentarCantidad(idProducto) {
  const item = carrito.find((producto) => producto.id === idProducto);
  if (!item) return;

  if (item.cantidad >= item.stock) {
    alert("No hay mas stock disponible.");
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
    alert("El carrito esta vacio.");
    return;
  }

  if (!metodoPago.value) {
    alert("Selecciona un metodo de pago.");
    return;
  }

  try {
    btnCobrar.disabled = true;
    btnCobrar.textContent = "Procesando...";

    let total = 0;
    let utilidad = 0;

    const productosVenta = carrito.map((item) => {
      const subtotal = item.precio * item.cantidad;
      const utilidadItem = (item.precio - item.costo) * item.cantidad;

      total += subtotal;
      utilidad += utilidadItem;

      return {
        id: item.id,
        nombre: item.nombre,
        categoria: item.categoria,
        precio: item.precio,
        costo: item.costo,
        cantidad: item.cantidad,
        subtotal,
        utilidad: utilidadItem,
        ganancia: utilidadItem
      };
    });

    const ventaRef = doc(collection(db, "ventas"));

    await runTransaction(db, async (transaction) => {
      const lecturas = [];

      for (const item of carrito) {
        const productoRef = doc(db, "inventario", item.id);
        const productoSnap = await transaction.get(productoRef);

        if (!productoSnap.exists()) {
          throw new Error(`Producto no encontrado: ${item.nombre}`);
        }

        const stockActual = Number(productoSnap.data().stock || 0);
        if (stockActual < item.cantidad) {
          throw new Error(`Stock insuficiente para ${item.nombre}`);
        }

        lecturas.push({ productoRef, stockActual, item });
      }

      transaction.set(ventaRef, {
        fecha: serverTimestamp(),
        productos: productosVenta,
        total,
        utilidad,
        ganancia: utilidad,
        metodoPago: metodoPago.value,
        origen: "POS",
        estado: "completada"
      });

      lecturas.forEach(({ productoRef, stockActual, item }) => {
        transaction.update(productoRef, {
          stock: stockActual - item.cantidad
        });
      });
    });

    carrito = [];
    metodoPago.value = "";
    renderCarrito();

    window.location.href = `ticket.html?id=${ventaRef.id}`;
  } catch (error) {
    console.error("Error al procesar venta:", error);
    alert(error.message || "Error al procesar la venta.");
  } finally {
    btnCobrar.disabled = false;
    btnCobrar.textContent = "Cobrar venta";
  }
}

buscarProducto.addEventListener("input", () => {
  const texto = buscarProducto.value.toLowerCase();

  const filtrados = productos.filter((producto) =>
    String(producto.nombre || "").toLowerCase().includes(texto) ||
    String(producto.categoria || "").toLowerCase().includes(texto)
  );

  mostrarProductos(filtrados);
});

btnCobrar.addEventListener("click", procesarVenta);

cargarProductos();
