const addProductForm = document.querySelector("#addProductForm");
const ordersTableBody = document.querySelector("#ordersTableBody");

// 1. Add Product
addProductForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = {
    title: document.querySelector("#pTitle").value,
    category: document.querySelector("#pCategory").value,
    price: document.querySelector("#pPrice").value,
    stock: document.querySelector("#pStock").value
  };

  try {
    const res = await fetch("api/add_product.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    alert(result.message);
    if (result.status === "success") addProductForm.reset();
  } catch (err) {
    alert("Failed to add product");
  }
});

// 2. Fetch Orders
async function loadOrders() {
  try {
    const res = await fetch("api/get_orders.php");
    const json = await res.json();
    if (json.status === "success") {
      renderOrders(json.data);
    }
  } catch (err) {
    console.error("Failed to load orders", err);
  }
}

// 3. Render Orders Table
function renderOrders(orders) {
  ordersTableBody.innerHTML = "";
  orders.forEach((o) => {
    const items = JSON.parse(o.order_items);
    const itemsSummary = items.map(i => `${i.title} (x${i.qty})`).join(", ");

    const tr = document.createElement("tr");
    tr.className = "hover:bg-gray-50";
    tr.innerHTML = `
      <td class="py-3 px-4 font-mono font-bold">#${o.id}</td>
      <td class="py-3 px-4"><b>${o.customer_name}</b><br><span class="text-xs text-gray-500">${o.customer_phone}</span></td>
      <td class="py-3 px-4 text-xs text-gray-600 max-w-xs">${o.delivery_address}</td>
      <td class="py-3 px-4 font-bold text-indigo-700">PKR ${Number(o.total_amount).toLocaleString()}</td>
      <td class="py-3 px-4 text-xs text-gray-700">${itemsSummary}</td>
      <td class="py-3 px-4">
        <select onchange="updateStatus(${o.id}, this.value)" class="border rounded px-2 py-1 text-xs font-semibold ${
          o.status === 'Delivered' ? 'text-green-700 bg-green-50' : 'text-amber-700 bg-amber-50'
        }">
          <option value="Pending" ${o.status === 'Pending' ? 'selected' : ''}>Pending</option>
          <option value="Dispatched" ${o.status === 'Dispatched' ? 'selected' : ''}>Dispatched</option>
          <option value="Delivered" ${o.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
        </select>
      </td>
    `;
    ordersTableBody.appendChild(tr);
  });
}

// 4. Update Status
async function updateStatus(id, newStatus) {
  try {
    await fetch("api/update_order.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: newStatus })
    });
    loadOrders();
  } catch (err) {
    alert("Could not update status");
  }
}

// Initial Boot
loadOrders();