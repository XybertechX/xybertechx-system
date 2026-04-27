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

// Agregar producto
window.agregarProducto = async () => {
  const nombre = document.getElementById("nombre").value;
  const categoria = document.getElementById("categoria").value;
  const costo = Number(document.getElementById("costo").value);
  const precio = Number(document.getElementById("precio").value);
  const stock = Number(document.getElementById("stock").value);

  await addDoc(collection(db, "inventario"), {
    nombre,
    categoria,
    costo,
    precio,
    stock
  });

  alert("Producto guardado");
  cargarProductos();
};

// Mostrar productos
async function cargarProductos() {
  lista.innerHTML = "";

  const datos = await getDocs(collection(db, "inventario"));

  datos.forEach((documento) => {
    const p = documento.data();
    const ganancia = (p.precio || 0) - (p.costo || 0);
    const estado = p.stock <= 5 ? "Stock bajo" : "Disponible";

    const li = document.createElement("li");
    li.className = "inventory-item";

    li.innerHTML = `
      <div>
        <strong>${p.nombre}</strong>
        <span>${p.categoria || "Sin categoría"}</span>
      </div>

      <div>
        <small>Costo</small>
        <strong>S/${p.costo || 0}</strong>
      </div>

      <div>
        <small>Venta</small>
        <strong>S/${p.precio || 0}</strong>
      </div>

      <div>
        <small>Ganancia</small>
        <strong>S/${ganancia}</strong>
      </div>

      <div>
        <small>Stock</small>
        <strong>${p.stock}</strong>
      </div>

      <div>
        <span class="badge">${estado}</span>
      </div>
    `;

    const acciones = document.createElement("div");
    acciones.className = "actions";

    const btnEditar = document.createElement("button");
    btnEditar.textContent = "Editar";

    btnEditar.onclick = async () => {
      const nuevoPrecio = prompt("Nuevo precio venta:", p.precio);
      const nuevoStock = prompt("Nuevo stock:", p.stock);

      if (nuevoPrecio !== null && nuevoStock !== null) {
        await updateDoc(doc(db, "inventario", documento.id), {
          precio: Number(nuevoPrecio),
          stock: Number(nuevoStock)
        });

        cargarProductos();
      }
    };

    const btnEliminar = document.createElement("button");
    btnEliminar.textContent = "Eliminar";
    btnEliminar.className = "btn-danger";

    btnEliminar.onclick = async () => {
      await deleteDoc(doc(db, "inventario", documento.id));
      cargarProductos();
    };

    acciones.appendChild(btnEditar);
    acciones.appendChild(btnEliminar);
    li.appendChild(acciones);
    lista.appendChild(li);
  });
}

// Cargar productos al abrir la página
cargarProductos();