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
  ["nombre", "categoria", "costo", "precio", "stock", "imagen"].forEach((id) => {
    document.getElementById(id).value = "";
  });
}

function obtenerImagen(producto) {
  return (producto.imagen || producto.imagenUrl || producto.imageUrl || "").trim();
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
  const imagen = document.getElementById("imagen").value.trim();

  if (!nombre || !categoria || !imagen || costo < 0 || precio <= 0 || stock < 0) {
    alert("Completa producto, categoria, imagen, precio y stock con valores validos.");
    return;
  }

  await addDoc(collection(db, "inventario"), {
    nombre,
    categoria,
    costo,
    precio,
    stock,
    imagen,
    imagenUrl: imagen
  });

  limpiarFormulario();
  await cargarProductos();
};

async function editarProducto(producto) {
  const nuevoNombre = prompt("Nombre del producto:", producto.nombre || "");
  if (nuevoNombre === null) return;

  const nuevaCategoria = prompt("Categoria:", producto.categoria || "");
  if (nuevaCategoria === null) return;

  const nuevoCosto = prompt("Costo:", producto.costo ?? 0);
  if (nuevoCosto === null) return;

  const nuevoPrecio = prompt("Precio venta:", producto.precio ?? 0);
  if (nuevoPrecio === null) return;

  const nuevoStock = prompt("Stock:", producto.stock ?? 0);
  if (nuevoStock === null) return;

  const nuevaImagen = prompt("URL de imagen para web/POS:", obtenerImagen(producto));
  if (nuevaImagen === null) return;

  const nombreActualizado = nuevoNombre.trim();
  const categoriaActualizada = nuevaCategoria.trim();
  const costoActualizado = Number(nuevoCosto);
  const precioActualizado = Number(nuevoPrecio);
  const stockActualizado = Number(nuevoStock);
  const imagenActualizada = nuevaImagen.trim();

  if (
    !nombreActualizado ||
    !categoriaActualizada ||
    !imagenActualizada ||
    costoActualizado < 0 ||
    precioActualizado <= 0 ||
    stockActualizado < 0
  ) {
    alert("Nombre, categoria, imagen, precio y stock deben ser valores validos.");
    return;
  }

  await updateDoc(doc(db, "inventario", producto.id), {
    nombre: nombreActualizado,
    categoria: categoriaActualizada,
    costo: costoActualizado,
    precio: precioActualizado,
    stock: stockActualizado,
    imagen: imagenActualizada,
    imagenUrl: imagenActualizada
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
    const imagen = obtenerImagen(producto);

    const li = document.createElement("li");
    li.className = "inventory-row";

    const productoVista = document.createElement("div");
    productoVista.className = "inventory-product-wrap";

    const thumb = document.createElement("img");
    thumb.className = "inventory-thumb";
    thumb.src = imagen || "img/logo 2.0.png";
    thumb.alt = producto.nombre || "Producto";
    thumb.loading = "lazy";
    thumb.onerror = () => {
      thumb.src = "img/logo 2.0.png";
    };

    const info = document.createElement("div");
    info.className = "inventory-product";
    const nombre = document.createElement("strong");
    nombre.textContent = producto.nombre || "Producto sin nombre";
    const categoria = document.createElement("small");
    categoria.textContent = producto.categoria || "Sin categoria";
    info.append(nombre, categoria);
    productoVista.append(thumb, info);

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
      productoVista,
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
