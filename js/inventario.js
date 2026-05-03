import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const lista = document.getElementById("lista");
const buscarInventario = document.getElementById("buscarInventario");
const filtroInventario = document.getElementById("filtroInventario");
const totalProductos = document.getElementById("totalProductos");
const productosDisponibles = document.getElementById("productosDisponibles");
const productosBajoStock = document.getElementById("productosBajoStock");
const productosAgotados = document.getElementById("productosAgotados");

let productos = [];

function dinero(valor) {
  return `S/${Number(valor || 0).toFixed(2)}`;
}

function estadoProducto(stock) {
  if (stock <= 0) return "Agotado";
  if (stock <= 5) return "Stock bajo";
  return "Disponible";
}

function limpiarFormulario() {
  ["nombre", "categoria", "costo", "precio", "stock"].forEach((id) => {
    document.getElementById(id).value = "";
  });
}

function crearDato(label, valor) {
  const div = document.createElement("div");
  const small = document.createElement("small");
  small.textContent = label;
  const strong = document.createElement("strong");
  strong.textContent = valor;
  div.append(small, strong);
  return div;
}

function actualizarResumen() {
  const bajo = productos.filter((p) => Number(p.stock || 0) > 0 && Number(p.stock || 0) <= 5);
  const agotados = productos.filter((p) => Number(p.stock || 0) <= 0);
  const disponibles = productos.filter((p) => Number(p.stock || 0) > 5);

  totalProductos.textContent = productos.length;
  productosDisponibles.textContent = disponibles.length;
  productosBajoStock.textContent = bajo.length;
  productosAgotados.textContent = agotados.length;
}

function productosFiltrados() {
  const texto = buscarInventario.value.trim().toLowerCase();
  const filtro = filtroInventario.value;

  return productos.filter((producto) => {
    const stock = Number(producto.stock || 0);
    const coincideTexto = `${producto.nombre || ""} ${producto.categoria || ""}`
      .toLowerCase()
      .includes(texto);

    if (!coincideTexto) return false;
    if (filtro === "disponibles") return stock > 5;
    if (filtro === "bajo") return stock > 0 && stock <= 5;
    if (filtro === "agotados") return stock <= 0;
    return true;
  });
}

window.agregarProducto = async () => {
  const nombre = document.getElementById("nombre").value.trim();
  const categoria = document.getElementById("categoria").value.trim();
  const costo = Number(document.getElementById("costo").value);
  const precio = Number(document.getElementById("precio").value);
  const stock = Number(document.getElementById("stock").value);

  if (!nombre || !categoria || costo < 0 || precio <= 0 || stock < 0) {
    alert("Completa producto, categoria, precio y stock con valores validos.");
    return;
  }

  await addDoc(collection(db, "inventario"), {
    nombre,
    categoria,
    costo,
    precio,
    stock
  });

  limpiarFormulario();
  await cargarProductos();
};

async function editarProducto(producto) {
  const nuevoPrecio = prompt("Nuevo precio venta:", producto.precio);
  const nuevoStock = prompt("Nuevo stock:", producto.stock);

  if (nuevoPrecio === null || nuevoStock === null) return;

  const precioActualizado = Number(nuevoPrecio);
  const stockActualizado = Number(nuevoStock);

  if (precioActualizado <= 0 || stockActualizado < 0) {
    alert("Precio y stock deben ser valores validos.");
    return;
  }

  await updateDoc(doc(db, "inventario", producto.id), {
    precio: precioActualizado,
    stock: stockActualizado
  });

  await cargarProductos();
}

async function eliminarProducto(producto) {
  if (!confirm(`Eliminar ${producto.nombre || "este producto"}?`)) return;

  await deleteDoc(doc(db, "inventario", producto.id));
  await cargarProductos();
}

function renderProductos() {
  lista.innerHTML = "";
  const visibles = productosFiltrados();

  if (visibles.length === 0) {
    const li = document.createElement("li");
    li.className = "empty-list";
    li.textContent = "No hay productos para este filtro.";
    lista.appendChild(li);
    return;
  }

  visibles.forEach((producto) => {
    const stock = Number(producto.stock || 0);
    const ganancia = Number(producto.precio || 0) - Number(producto.costo || 0);
    const estado = estadoProducto(stock);

    const li = document.createElement("li");
    li.className = "inventory-row";

    const info = document.createElement("div");
    info.className = "inventory-product";
    const nombre = document.createElement("strong");
    nombre.textContent = producto.nombre || "Producto sin nombre";
    const categoria = document.createElement("small");
    categoria.textContent = producto.categoria || "Sin categoria";
    info.append(nombre, categoria);

    const estadoBox = document.createElement("div");
    const badge = document.createElement("span");
    badge.className = `inventory-status ${estado === "Agotado" ? "danger" : estado === "Stock bajo" ? "warning" : "ok"}`;
    badge.textContent = estado;
    estadoBox.appendChild(badge);

    const acciones = document.createElement("div");
    acciones.className = "actions";

    const btnEditar = document.createElement("button");
    btnEditar.textContent = "Editar";
    btnEditar.onclick = () => editarProducto(producto);

    const btnEliminar = document.createElement("button");
    btnEliminar.textContent = "Eliminar";
    btnEliminar.className = "btn-danger";
    btnEliminar.onclick = () => eliminarProducto(producto);

    acciones.append(btnEditar, btnEliminar);
    li.append(
      info,
      crearDato("Costo", dinero(producto.costo)),
      crearDato("Venta", dinero(producto.precio)),
      crearDato("Margen", dinero(ganancia)),
      crearDato("Stock", `${stock} und.`),
      estadoBox,
      acciones
    );
    lista.appendChild(li);
  });
}

async function cargarProductos() {
  const datos = await getDocs(collection(db, "inventario"));
  productos = [];

  datos.forEach((documento) => {
    productos.push({
      id: documento.id,
      ...documento.data()
    });
  });

  productos.sort((a, b) => Number(a.stock || 0) - Number(b.stock || 0));
  actualizarResumen();
  renderProductos();
}

buscarInventario.addEventListener("input", renderProductos);
filtroInventario.addEventListener("change", renderProductos);

cargarProductos();
