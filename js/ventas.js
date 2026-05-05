import { db } from "./firebase.js";
import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const productoSeleccionado = document.getElementById("producto");
const productoBusqueda = document.getElementById("productoBusqueda");
const productoResultados = document.getElementById("productoResultados");
const totalSpan = document.getElementById("total");
const utilidadSpan = document.getElementById("utilidad");
const itemsTotal = document.getElementById("itemsTotal");
const carritoLista = document.getElementById("carritoLista");
const listaVentas = document.getElementById("listaVentas");
const ventasCeoCount = document.getElementById("ventasCeoCount");
const clienteServicio = document.getElementById("clienteServicio");
const metodoPagoCEO = document.getElementById("metodoPagoCEO");
const notaVenta = document.getElementById("notaVenta");

let productos = [];
let carrito = [];

function dinero(valor) {
  return Number(valor || 0).toFixed(2);
}

function textoProducto(producto) {
  return `${producto.nombre || "Producto"} - S/${dinero(producto.precio)} (Stock: ${producto.stock || 0})`;
}

function fechaComoDate(fecha) {
  if (!fecha) return null;
  if (fecha.toDate) return fecha.toDate();

  const convertida = new Date(fecha);
  return isNaN(convertida.getTime()) ? null : convertida;
}

function rangoHoy() {
  const hoy = new Date();
  return {
    inicio: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()),
    fin: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1)
  };
}

function agregarVacio(lista, texto) {
  const li = document.createElement("li");
  li.className = "empty-list";
  li.textContent = texto;
  lista.appendChild(li);
}

function agregarItemLista(lista, titulo, detalle, valor, badge) {
  const li = document.createElement("li");

  const texto = document.createElement("div");
  const strong = document.createElement("strong");
  strong.textContent = titulo;
  const small = document.createElement("small");
  small.textContent = detalle;
  texto.append(strong, small);

  const derecha = document.createElement("div");
  derecha.className = "list-value";
  const valorNode = document.createElement("span");
  valorNode.textContent = valor;
  derecha.appendChild(valorNode);

  if (badge) {
    const badgeNode = document.createElement("small");
    badgeNode.className = "status-pill";
    badgeNode.textContent = badge;
    derecha.appendChild(badgeNode);
  }

  li.append(texto, derecha);
  lista.appendChild(li);
}

async function cargarProductos() {
  const datos = await getDocs(collection(db, "inventario"));

  productos = [];
  productoSeleccionado.value = "";

  datos.forEach((docu) => {
    const p = docu.data();
    productos.push({ id: docu.id, ...p });
  });

  productos = productos
    .filter((p) => Number(p.stock || 0) > 0)
    .sort((a, b) => String(a.nombre || "").localeCompare(String(b.nombre || "")));

  renderResultadosProducto(productos.slice(0, 8));
}

function renderResultadosProducto(lista) {
  productoResultados.innerHTML = "";

  if (lista.length === 0) {
    const empty = document.createElement("div");
    empty.className = "product-empty";
    empty.textContent = "Sin productos disponibles.";
    productoResultados.appendChild(empty);
    return;
  }

  lista.forEach((p) => {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "product-option";
    boton.onclick = () => seleccionarProducto(p.id);

    const info = document.createElement("span");
    const nombre = document.createElement("strong");
    nombre.textContent = p.nombre || "Producto";
    const meta = document.createElement("small");
    meta.textContent = `${p.categoria || "Inventario"} | Stock ${p.stock || 0}`;
    info.append(nombre, meta);

    const precio = document.createElement("em");
    precio.textContent = `S/${dinero(p.precio)}`;

    boton.append(info, precio);
    productoResultados.appendChild(boton);
  });
}

function seleccionarProducto(id) {
  const producto = productos.find(p => p.id === id);
  if (!producto) return;

  productoSeleccionado.value = producto.id;
  productoBusqueda.value = textoProducto(producto);
  renderResultadosProducto([producto]);
}

function filtrarProductosCEO() {
  const termino = productoBusqueda.value.trim().toLowerCase();
  const filtrados = productos.filter((p) => {
    const nombre = String(p.nombre || "").toLowerCase();
    const categoria = String(p.categoria || "").toLowerCase();
    const texto = textoProducto(p).toLowerCase();
    return !termino || texto.includes(termino) || nombre.includes(termino) || categoria.includes(termino);
  });

  if (!filtrados.some(p => p.id === productoSeleccionado.value)) {
    productoSeleccionado.value = "";
  }

  renderResultadosProducto(filtrados.slice(0, 8));
}

window.agregarAlCarrito = () => {
  const id = productoSeleccionado.value;
  const cantidad = Number(document.getElementById("cantidad").value);
  const producto = productos.find(p => p.id === id);

  if (!producto) {
    alert("Selecciona un producto del buscador.");
    return;
  }

  if (!cantidad || cantidad <= 0) {
    alert("Ingresa una cantidad valida");
    return;
  }

  const itemExistente = carrito.find(item => item.id === id);
  const cantidadActual = itemExistente ? itemExistente.cantidad : 0;

  if (cantidadActual + cantidad > Number(producto.stock || 0)) {
    alert("Stock insuficiente");
    return;
  }

  if (itemExistente) {
    itemExistente.cantidad += cantidad;
  } else {
    carrito.push({
      id: producto.id,
      nombre: producto.nombre || "Producto",
      categoria: producto.categoria || "",
      precio: Number(producto.precio || 0),
      costo: Number(producto.costo || 0),
      cantidad
    });
  }

  document.getElementById("cantidad").value = "";
  renderCarrito();
};

function renderCarrito() {
  carritoLista.innerHTML = "";

  let total = 0;
  let utilidad = 0;
  let items = 0;

  if (carrito.length === 0) {
    agregarVacio(carritoLista, "Agrega productos o repuestos usados en el servicio.");
  }

  carrito.forEach((item, index) => {
    const subtotal = item.precio * item.cantidad;
    const ganancia = (item.precio - item.costo) * item.cantidad;

    total += subtotal;
    utilidad += ganancia;
    items += item.cantidad;

    const li = document.createElement("li");

    const detalle = document.createElement("div");
    const nombre = document.createElement("strong");
    nombre.textContent = item.nombre;
    const cantidad = document.createElement("small");
    cantidad.textContent = `${item.categoria || "Producto"} | x${item.cantidad}`;
    detalle.append(nombre, cantidad);

    const valores = document.createElement("div");
    valores.className = "list-value";
    const totalItem = document.createElement("span");
    totalItem.textContent = `S/${dinero(subtotal)}`;
    const unitario = document.createElement("small");
    unitario.textContent = `Unit. S/${dinero(item.precio)}`;
    valores.append(totalItem, unitario);

    const btn = document.createElement("button");
    btn.textContent = "Quitar";
    btn.className = "btn-danger";
    btn.onclick = () => {
      carrito.splice(index, 1);
      renderCarrito();
    };

    li.append(detalle, valores, btn);
    carritoLista.appendChild(li);
  });

  totalSpan.textContent = dinero(total);
  utilidadSpan.textContent = dinero(utilidad);
  itemsTotal.textContent = items;
}

async function cargarVentasDelDia() {
  listaVentas.innerHTML = "";
  const { inicio, fin } = rangoHoy();
  const q = query(
    collection(db, "ventas"),
    where("fecha", ">=", inicio),
    where("fecha", "<", fin),
    orderBy("fecha", "desc"),
    limit(30)
  );

  const datos = await getDocs(q);
  let ventasCount = 0;

  datos.forEach((docu) => {
    const venta = docu.data();
    if (venta.origen !== "CEO" && venta.origen !== "Admin") return;

    const fechaVenta = fechaComoDate(venta.fecha);
    ventasCount++;

    const productos = (venta.productos || [])
      .map((p) => `${p.nombre || "Producto"} x${p.cantidad || 0}`)
      .join(", ");

    agregarItemLista(
      listaVentas,
      venta.cliente || "Servicio CEO",
      `${fechaVenta ? fechaVenta.toLocaleTimeString() : "Sin hora"} - ${venta.metodoPago || "Sin metodo"}`,
      `S/${dinero(venta.total)}`,
      productos || "Servicio"
    );
  });

  ventasCeoCount.textContent = ventasCount;

  if (ventasCount === 0) {
    agregarVacio(listaVentas, "No hay servicios CEO registrados hoy.");
  }
}

window.confirmarVenta = async () => {
  if (carrito.length === 0) {
    alert("Agrega al menos un producto o repuesto al servicio.");
    return;
  }

  if (!metodoPagoCEO.value) {
    alert("Selecciona un metodo de pago.");
    return;
  }

  const totalVenta = carrito.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
  const utilidadVenta = carrito.reduce((sum, item) => sum + (item.precio - item.costo) * item.cantidad, 0);
  const ventaRef = doc(collection(db, "ventas"));

  try {
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
        cliente: clienteServicio.value.trim() || "Cliente servicio CEO",
        nota: notaVenta.value.trim(),
        metodoPago: metodoPagoCEO.value,
        productos: carrito.map(item => ({
          ...item,
          subtotal: item.precio * item.cantidad,
          utilidad: (item.precio - item.costo) * item.cantidad,
          ganancia: (item.precio - item.costo) * item.cantidad
        })),
        total: totalVenta,
        utilidad: utilidadVenta,
        ganancia: utilidadVenta,
        fecha: serverTimestamp(),
        origen: "CEO",
        estado: "completada"
      });

      lecturas.forEach(({ productoRef, stockActual, item }) => {
        transaction.update(productoRef, {
          stock: stockActual - item.cantidad
        });
      });
    });
  } catch (error) {
    alert(error.message || "Error al registrar la venta");
    return;
  }

  alert("Venta CEO registrada");

  carrito = [];
  clienteServicio.value = "";
  metodoPagoCEO.value = "";
  notaVenta.value = "";
  renderCarrito();
  await cargarProductos();
  await cargarVentasDelDia();
};

window.vaciarCarrito = () => {
  if (carrito.length === 0) return;

  if (confirm("Vaciar carrito?")) {
    carrito = [];
    renderCarrito();
  }
};

productoBusqueda.addEventListener("input", filtrarProductosCEO);
productoBusqueda.addEventListener("focus", filtrarProductosCEO);

cargarProductos();
renderCarrito();
cargarVentasDelDia();
