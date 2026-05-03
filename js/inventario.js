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

function crearDato(label, valor) {
  const div = document.createElement("div");
  const small = document.createElement("small");
  small.textContent = label;
  const strong = document.createElement("strong");
  strong.textContent = valor;
  div.append(small, strong);
  return div;
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

  document.getElementById("nombre").value = "";
  document.getElementById("categoria").value = "";
  document.getElementById("costo").value = "";
  document.getElementById("precio").value = "";
  document.getElementById("stock").value = "";

  alert("Producto guardado");
  cargarProductos();
};

async function cargarProductos() {
  lista.innerHTML = "";

  const datos = await getDocs(collection(db, "inventario"));

  datos.forEach((documento) => {
    const p = documento.data();
    const ganancia = Number(p.precio || 0) - Number(p.costo || 0);
    const estado = Number(p.stock || 0) <= 5 ? "Stock bajo" : "Disponible";

    const li = document.createElement("li");
    li.className = "inventory-item";

    const producto = document.createElement("div");
    const nombre = document.createElement("strong");
    nombre.textContent = p.nombre || "Producto sin nombre";
    const categoria = document.createElement("span");
    categoria.textContent = p.categoria || "Sin categoria";
    producto.append(nombre, categoria);

    const estadoBox = document.createElement("div");
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = estado;
    estadoBox.appendChild(badge);

    const acciones = document.createElement("div");
    acciones.className = "actions";

    const btnEditar = document.createElement("button");
    btnEditar.textContent = "Editar";

    btnEditar.onclick = async () => {
      const nuevoPrecio = prompt("Nuevo precio venta:", p.precio);
      const nuevoStock = prompt("Nuevo stock:", p.stock);

      if (nuevoPrecio === null || nuevoStock === null) return;

      const precioActualizado = Number(nuevoPrecio);
      const stockActualizado = Number(nuevoStock);

      if (precioActualizado <= 0 || stockActualizado < 0) {
        alert("Precio y stock deben ser valores validos.");
        return;
      }

      await updateDoc(doc(db, "inventario", documento.id), {
        precio: precioActualizado,
        stock: stockActualizado
      });

      cargarProductos();
    };

    const btnEliminar = document.createElement("button");
    btnEliminar.textContent = "Eliminar";
    btnEliminar.className = "btn-danger";

    btnEliminar.onclick = async () => {
      if (!confirm(`Eliminar ${p.nombre || "este producto"}?`)) return;

      await deleteDoc(doc(db, "inventario", documento.id));
      cargarProductos();
    };

    acciones.append(btnEditar, btnEliminar);
    li.append(
      producto,
      crearDato("Costo", `S/${Number(p.costo || 0).toFixed(2)}`),
      crearDato("Venta", `S/${Number(p.precio || 0).toFixed(2)}`),
      crearDato("Ganancia", `S/${ganancia.toFixed(2)}`),
      crearDato("Stock", Number(p.stock || 0)),
      estadoBox,
      acciones
    );
    lista.appendChild(li);
  });
}

cargarProductos();
