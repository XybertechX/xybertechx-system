import { db } from "./firebase.js";
import {
  collection,
  doc,
  getDocs,
  runTransaction,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const select = document.getElementById("producto");
const totalSpan = document.getElementById("total");
const utilidadSpan = document.getElementById("utilidad");
const itemsTotal = document.getElementById("itemsTotal");
const carritoLista = document.getElementById("carritoLista");
const listaVentas = document.getElementById("listaVentas");

let productos = [];
let carrito = [];

function dinero(valor) {
  return Number(valor || 0).toFixed(2);
}

function fechaComoDate(fecha) {
  if (!fecha) return null;
  if (fecha.toDate) return fecha.toDate();

  const convertida = new Date(fecha);
  return isNaN(convertida.getTime()) ? null : convertida;
}

async function cargarProductos() {
  const datos = await getDocs(collection(db, "inventario"));

  productos = [];
  select.innerHTML = "";

  datos.forEach((docu) => {
    const p = docu.data();
    productos.push({ id: docu.id, ...p });

    const option = document.createElement("option");
    option.value = docu.id;
    option.textContent = `${p.nombre || "Producto"} - S/${p.precio || 0} (Stock: ${p.stock || 0})`;
    select.appendChild(option);
  });
}

window.agregarAlCarrito = () => {
  const id = select.value;
  const cantidad = Number(document.getElementById("cantidad").value);
  const producto = productos.find(p => p.id === id);

  if (!producto) return;

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

  carrito.forEach((item, index) => {
    const subtotal = item.precio * item.cantidad;
    const ganancia = (item.precio - item.costo) * item.cantidad;

    total += subtotal;
    utilidad += ganancia;
    items += item.cantidad;

    const li = document.createElement("li");
    li.className = "cart-item";

    const detalle = document.createElement("div");
    const nombre = document.createElement("strong");
    nombre.textContent = item.nombre;
    const cantidad = document.createElement("span");
    cantidad.className = "badge";
    cantidad.textContent = `x${item.cantidad}`;
    detalle.append(nombre, cantidad);

    const precioBox = document.createElement("div");
    const precioLabel = document.createElement("small");
    precioLabel.textContent = "Precio";
    const precioValor = document.createElement("strong");
    precioValor.textContent = `S/${dinero(item.precio)}`;
    precioBox.append(precioLabel, precioValor);

    const totalBox = document.createElement("div");
    const totalLabel = document.createElement("small");
    totalLabel.textContent = "Total";
    const totalValor = document.createElement("strong");
    totalValor.textContent = `S/${dinero(subtotal)}`;
    totalBox.append(totalLabel, totalValor);

    const btn = document.createElement("button");
    btn.textContent = "Quitar";
    btn.className = "btn-danger";
    btn.onclick = () => {
      carrito.splice(index, 1);
      renderCarrito();
    };

    li.append(detalle, precioBox, totalBox, btn);
    carritoLista.appendChild(li);
  });

  totalSpan.textContent = dinero(total);
  utilidadSpan.textContent = dinero(utilidad);
  itemsTotal.textContent = items;
}

async function cargarVentasDelDia() {
  listaVentas.innerHTML = "";

  const hoy = new Date();
  const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const finDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1);
  const datos = await getDocs(collection(db, "ventas"));

  let ventasCount = 0;

  datos.forEach((docu) => {
    const venta = docu.data();
    const fechaVenta = fechaComoDate(venta.fecha);

    if (!fechaVenta || fechaVenta < inicioDia || fechaVenta >= finDia) return;

    ventasCount++;

    const li = document.createElement("li");
    li.className = "sale-item";

    const titulo = document.createElement("div");
    const ventaLabel = document.createElement("strong");
    ventaLabel.textContent = `Venta #${ventasCount}`;
    const hora = document.createElement("small");
    hora.textContent = fechaVenta.toLocaleTimeString();
    titulo.append(ventaLabel, hora);

    const totalBox = document.createElement("div");
    const totalLabel = document.createElement("small");
    totalLabel.textContent = "Total";
    const totalValor = document.createElement("strong");
    totalValor.textContent = `S/${dinero(venta.total)}`;
    totalBox.append(totalLabel, totalValor);

    const utilidadBox = document.createElement("div");
    const utilidadLabel = document.createElement("small");
    utilidadLabel.textContent = "Utilidad";
    const utilidadValor = document.createElement("strong");
    utilidadValor.textContent = `S/${dinero(venta.utilidad ?? venta.ganancia)}`;
    utilidadBox.append(utilidadLabel, utilidadValor);

    li.append(titulo, totalBox, utilidadBox);
    listaVentas.prepend(li);
  });

  if (ventasCount === 0) {
    const li = document.createElement("li");
    li.textContent = "No hay ventas registradas hoy.";
    listaVentas.appendChild(li);
  }
}

window.confirmarVenta = async () => {
  if (carrito.length === 0) {
    alert("El carrito esta vacio");
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
        origen: "Admin",
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

  alert("Venta registrada");

  carrito = [];
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

cargarProductos();
renderCarrito();
cargarVentasDelDia();
