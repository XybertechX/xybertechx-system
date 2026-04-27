import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const select = document.getElementById("producto");
const totalSpan = document.getElementById("total");
const utilidadSpan = document.getElementById("utilidad");
const itemsTotal = document.getElementById("itemsTotal");
const carritoLista = document.getElementById("carritoLista");
const listaVentas = document.getElementById("listaVentas");

let productos = [];
let carrito = [];

async function cargarProductos() {
  const datos = await getDocs(collection(db, "inventario"));

  productos = [];
  select.innerHTML = "";

  datos.forEach((docu) => {
    const p = docu.data();
    productos.push({ id: docu.id, ...p });

    const option = document.createElement("option");
    option.value = docu.id;
    option.textContent = `${p.nombre} - S/${p.precio || 0} (Stock: ${p.stock || 0})`;
    select.appendChild(option);
  });
}

window.agregarAlCarrito = () => {
  const id = select.value;
  const cantidad = Number(document.getElementById("cantidad").value);
  const producto = productos.find(p => p.id === id);

  if (!producto) return;

  if (!cantidad || cantidad <= 0) {
    alert("Ingresa una cantidad válida");
    return;
  }

  if (cantidad > producto.stock) {
    alert("Stock insuficiente");
    return;
  }

  carrito.push({
    id: producto.id,
    nombre: producto.nombre,
    precio: producto.precio || 0,
    costo: producto.costo || 0,
    cantidad
  });

  document.getElementById("cantidad").value = "";
  renderCarrito();
};

function renderCarrito() {
  carritoLista.innerHTML = "";

  let total = 0;
  let utilidad = 0;
  let items = 0;

  carrito.forEach((item, index) => {
    const subtotal = item.precio * item.cantidad;
    const ganancia = (item.precio - item.costo) * item.cantidad;

    total += subtotal;
    utilidad += ganancia;
    items += item.cantidad;

    const li = document.createElement("li");
    li.className = "cart-item";

    li.innerHTML = `
      <div>
        <strong>${item.nombre}</strong>
        <span class="badge">x${item.cantidad}</span>
      </div>

      <div>
        <small>Precio</small>
        <strong>S/${item.precio}</strong>
      </div>

      <div>
        <small>Total</small>
        <strong>S/${subtotal.toFixed(2)}</strong>
      </div>
    `;

    const btn = document.createElement("button");
    btn.textContent = "Quitar";
    btn.className = "btn-danger";

    btn.onclick = () => {
      carrito.splice(index, 1);
      renderCarrito();
    };

    li.appendChild(btn);
    carritoLista.appendChild(li);
  });

  totalSpan.textContent = total.toFixed(2);
  utilidadSpan.textContent = utilidad.toFixed(2);
  itemsTotal.textContent = items;
}

async function cargarVentasDelDia() {
  listaVentas.innerHTML = "";

  const hoy = new Date();
  const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).toISOString();
  const finDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1).toISOString();

  const q = query(
    collection(db, "ventas"),
    where("fecha", ">=", inicioDia),
    where("fecha", "<", finDia)
  );

  const datos = await getDocs(q);

  let ventasCount = 0;

  datos.forEach((docu) => {
    const venta = docu.data();
    ventasCount++;

    const li = document.createElement("li");
    li.className = "sale-item";

    li.innerHTML = `
      <div>
        <strong>Venta #${ventasCount}</strong>
        <small>${new Date(venta.fecha).toLocaleTimeString()}</small>
      </div>

      <div>
        <small>Total</small>
        <strong>S/${(venta.total || 0).toFixed(2)}</strong>
      </div>

      <div>
        <small>Utilidad</small>
        <strong>S/${(venta.utilidad || 0).toFixed(2)}</strong>
      </div>
    `;

    listaVentas.prepend(li);
  });

  if (ventasCount === 0) {
    listaVentas.innerHTML = `<li>No hay ventas registradas hoy.</li>`;
  }
}

window.confirmarVenta = async () => {
  if (carrito.length === 0) {
    alert("El carrito está vacío");
    return;
  }

  for (const item of carrito) {
    const productoActual = productos.find(p => p.id === item.id);

    if (!productoActual || item.cantidad > productoActual.stock) {
      alert(`Stock insuficiente para ${item.nombre}`);
      return;
    }
  }

  const totalVenta = carrito.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
  const utilidadVenta = carrito.reduce((sum, item) => sum + (item.precio - item.costo) * item.cantidad, 0);

  await addDoc(collection(db, "ventas"), {
    productos: carrito,
    total: totalVenta,
    utilidad: utilidadVenta,
    fecha: new Date().toISOString()
  });

  for (const item of carrito) {
    const productoActual = productos.find(p => p.id === item.id);

    await updateDoc(doc(db, "inventario", item.id), {
      stock: productoActual.stock - item.cantidad
    });
  }

  alert("Venta registrada 💰");

  carrito = [];
  renderCarrito();
  await cargarProductos();
  await cargarVentasDelDia();
};

window.vaciarCarrito = () => {
  if (carrito.length === 0) return;

  if (confirm("¿Vaciar carrito?")) {
    carrito = [];
    renderCarrito();
  }
};

cargarProductos();
renderCarrito();
cargarVentasDelDia();