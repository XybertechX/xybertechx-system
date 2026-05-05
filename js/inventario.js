import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const lista = document.getElementById("lista");
const buscarInventario = document.getElementById("buscarInventario");
const filtroInventario = document.getElementById("filtroInventario");
const totalProductos = document.getElementById("totalProductos");
const productosDisponibles = document.getElementById("productosDisponibles");
const productosBajoStock = document.getElementById("productosBajoStock");
const productosAgotados = document.getElementById("productosAgotados");
const modalProducto = document.getElementById("modalProducto");
const cerrarModalProducto = document.getElementById("cerrarModalProducto");
const guardarProductoEditado = document.getElementById("guardarProductoEditado");
const editPreview = document.getElementById("editPreview");
const editPreviewEstado = document.getElementById("editPreviewEstado");

let productos = [];
let productoEditando = null;

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
  document.getElementById("visibleWeb").checked = true;
  document.getElementById("destacado").checked = false;
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

function crearPlaceholderImagen() {
  const placeholder = document.createElement("div");
  placeholder.className = "inventory-thumb-placeholder";
  const label = document.createElement("span");
  label.textContent = "Sin imagen";
  placeholder.appendChild(label);
  return placeholder;
}

function crearMiniatura(producto, imagen) {
  if (!imagen) return crearPlaceholderImagen();

  const thumb = document.createElement("img");
  thumb.className = "inventory-thumb";
  thumb.src = imagen;
  thumb.alt = producto.nombre || "Producto";
  thumb.loading = "lazy";
  thumb.onerror = () => {
    thumb.replaceWith(crearPlaceholderImagen());
  };
  return thumb;
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
  const visibleWeb = document.getElementById("visibleWeb").checked;
  const destacado = document.getElementById("destacado").checked;

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
    imagenUrl: imagen,
    visibleWeb,
    destacado,
    creadoEn: serverTimestamp(),
    actualizadoEn: serverTimestamp()
  });

  limpiarFormulario();
  await cargarProductos();
};

async function editarProducto(producto) {
  productoEditando = producto;
  document.getElementById("editNombre").value = producto.nombre || "";
  document.getElementById("editCategoria").value = producto.categoria || "";
  document.getElementById("editCosto").value = producto.costo ?? 0;
  document.getElementById("editPrecio").value = producto.precio ?? 0;
  document.getElementById("editStock").value = producto.stock ?? 0;
  document.getElementById("editImagen").value = obtenerImagen(producto);
  document.getElementById("editVisibleWeb").checked = producto.visibleWeb !== false;
  document.getElementById("editDestacado").checked = Boolean(producto.destacado);
  editPreview.src = obtenerImagen(producto) || "img/logo 2.0.png";
  editPreviewEstado.textContent = obtenerImagen(producto) ? "Imagen actual" : "Sin imagen cargada";
  modalProducto.classList.remove("hidden");
}

async function guardarEdicionProducto() {
  if (!productoEditando) return;

  const nombreActualizado = document.getElementById("editNombre").value.trim();
  const categoriaActualizada = document.getElementById("editCategoria").value.trim();
  const costoActualizado = Number(document.getElementById("editCosto").value);
  const precioActualizado = Number(document.getElementById("editPrecio").value);
  const stockActualizado = Number(document.getElementById("editStock").value);
  let imagenActualizada = document.getElementById("editImagen").value.trim();
  const visibleWeb = document.getElementById("editVisibleWeb").checked;
  const destacado = document.getElementById("editDestacado").checked;

  if (
    !nombreActualizado ||
    !categoriaActualizada ||
    !imagenActualizada ||
    costoActualizado < 0 ||
    precioActualizado <= 0 ||
    stockActualizado < 0
  ) {
    alert("Nombre, categoria, imagen, precio y stock deben ser valores validos.");
    guardarProductoEditado.disabled = false;
    guardarProductoEditado.textContent = "Guardar cambios";
    return;
  }

  try {
    guardarProductoEditado.disabled = true;
    guardarProductoEditado.textContent = "Guardando...";

    await updateDoc(doc(db, "inventario", productoEditando.id), {
      nombre: nombreActualizado,
      categoria: categoriaActualizada,
      costo: costoActualizado,
      precio: precioActualizado,
      stock: stockActualizado,
      imagen: imagenActualizada,
      imagenUrl: imagenActualizada,
      visibleWeb,
      destacado,
      actualizadoEn: serverTimestamp()
    });
  } catch (error) {
    console.error("Error editando producto:", error);
    alert(error.message || "No se pudo guardar el producto.");
    guardarProductoEditado.disabled = false;
    guardarProductoEditado.textContent = "Guardar cambios";
    return;
  }

  guardarProductoEditado.disabled = false;
  guardarProductoEditado.textContent = "Guardar cambios";
  modalProducto.classList.add("hidden");
  productoEditando = null;
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

    const thumb = crearMiniatura(producto, imagen);

    const info = document.createElement("div");
    info.className = "inventory-product";
    const nombre = document.createElement("strong");
    nombre.textContent = producto.nombre || "Producto sin nombre";
    const categoria = document.createElement("small");
    categoria.textContent = `${producto.categoria || "Sin categoria"}${producto.visibleWeb === false ? " | Oculto web" : ""}${producto.destacado ? " | Destacado" : ""}`;
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
cerrarModalProducto.addEventListener("click", () => modalProducto.classList.add("hidden"));
guardarProductoEditado.addEventListener("click", guardarEdicionProducto);
document.getElementById("editImagen").addEventListener("input", (event) => {
  editPreview.src = event.target.value || "img/logo 2.0.png";
  editPreviewEstado.textContent = event.target.value ? "Vista por URL" : "Sin imagen cargada";
});

cargarProductos();
