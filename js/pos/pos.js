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
const filtroStockPOS = document.getElementById("filtroStockPOS");
const carritoLista = document.getElementById("carritoLista");
const totalVenta = document.getElementById("totalVenta");
const totalVentaRapido = document.getElementById("totalVentaRapido");
const itemsCarrito = document.getElementById("itemsCarrito");
const productosDisponiblesPOS = document.getElementById("productosDisponiblesPOS");
const btnCobrar = document.getElementById("btnCobrar");
const btnVaciarCarrito = document.getElementById("btnVaciarCarrito");
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

function productosFiltrados() {
  const texto = buscarProducto.value.trim().toLowerCase();
  const filtro = filtroStockPOS.value;

  return productos.filter((producto) => {
    const stock = Number(producto.stock || 0);
    const coincide = `${producto.nombre || ""} ${producto.categoria || ""}`
      .toLowerCase()
      .includes(texto);

    if (!coincide) return false;
    if (filtro === "disponibles") return stock > 0;
    if (filtro === "bajo") return stock > 0 && stock <= 5;
    return true;
  });
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

    productos.sort((a, b) => String(a.nombre || "").localeCompare(String(b.nombre || "")));
    productosDisponiblesPOS.textContent = productos.filter((p) => Number(p.stock || 0) > 0).length;
    mostrarProductos();
  } catch (error) {
    console.error("Error cargando productos:", error);
    setMensajeVacio(listaProductos, "Error al cargar productos.");
  }
}

function mostrarProductos() {
  const lista = productosFiltrados();
  listaProductos.innerHTML = "";

  if (lista.length === 0) {
    setMensajeVacio(listaProductos, "No hay productos para este filtro.");
    return;
  }

  lista.forEach((producto) => {
    const stockProducto = Number(producto.stock || 0);
    const card = document.createElement("div");
    card.classList.add("producto-card");

    const nombre = document.createElement("h3");
    nombre.textContent = producto.nombre || "Producto sin nombre";

    const categoria = document.createElement("p");
    categoria.textContent = producto.categoria || "Sin categoria";

    const stock = document.createElement("p");
    stock.textContent = `${stockProducto} und.`;

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
    totalVentaRapido.textContent = "S/0.00";
    itemsCarrito.textContent = "0";
    return;
  }

  let total = 0;
  let items = 0;

  carrito.forEach((item) => {
    const subtotal = item.precio * item.cantidad;
    total += subtotal;
    items += item.cantidad;

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
    btnMenos.textContent = "-";
    btnMenos.addEventListener("click", () => disminuirCantidad(item.id));

    const cantidad = document.createElement("span");
    cantidad.textContent = item.cantidad;

    const btnMas = document.createElement("button");
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
  totalVentaRapido.textContent = dinero(total);
  itemsCarrito.textContent = items;
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

function vaciarCarrito() {
  if (carrito.length === 0) return;
  if (!confirm("Vaciar carrito?")) return;

  carrito = [];
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

buscarProducto.addEventListener("input", mostrarProductos);
filtroStockPOS.addEventListener("change", mostrarProductos);
btnVaciarCarrito.addEventListener("click", vaciarCarrito);
btnCobrar.addEventListener("click", procesarVenta);

cargarProductos();
