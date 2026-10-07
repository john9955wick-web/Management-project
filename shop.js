let catalog = [];
let cart = JSON.parse(localStorage.getItem("swiftCart")) || [];

const productsGrid = document.querySelector("#productsGrid");
const categoryFilter = document.querySelector("#categoryFilter");
const cartDrawer = document.querySelector("#cartDrawer");
const cartCountBadge = document.querySelector("#cartCountBadge");
const cartItemsContainer = document.querySelector("#cartItemsContainer");
const cartTotalDisplay = document.querySelector("#cartTotalDisplay");
const checkoutForm = document.querySelector("#checkoutForm");
const orderStatusMsg = document.querySelector("#orderStatusMsg");

// 1. Fetch Products
async function fetchProducts() {
  try {
    const res = await fetch("api/get_products.php");
    const json = await res.json();
    if (json.status === "success") {
      catalog = json.data;
      renderCatalog(catalog);
    }
  } catch (err) {
    console.error("Failed to load catalog", err);
  }
}

// 2. Render Products
function renderCatalog(items) {
  productsGrid.innerHTML = "";
  items.forEach((p) => {
    const card = document.createElement("div");
    card.className = "bg-white border rounded-xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition";
    card.innerHTML = `
      <div>
        <span class="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-600">${p.category}</span>
        <h3 class="font-bold text-gray-800 text-lg mt-2">${p.title}</h3>
        <p class="text-indigo-600 font-extrabold text-xl mt-1">PKR ${Number(p.price).toLocaleString()}</p>
        <p class="text-xs text-gray-400 mt-1">In Stock: ${p.stock} units</p>
      </div>
      <button onclick="addToCart(${p.id})" class="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2 rounded-lg transition">
        Add to Cart
      </button>
    `;
    productsGrid.appendChild(card);
  });
}

// 3. Filter Category
categoryFilter.addEventListener("change", () => {
  const cat = categoryFilter.value;
  const filtered = cat ? catalog.filter(item => item.category === cat) : catalog;
  renderCatalog(filtered);
});

// 4. Cart Operations
function addToCart(productId) {
  const product = catalog.find(p => p.id === productId);
  if (!product) return;

  const existing = cart.find(item => item.id === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id: product.id, title: product.title, price: product.price, qty: 1 });
  }

  saveCart();
  toggleCartDrawer(true);
}

function updateQty(id, change) {
  const item = cart.find(i => i.id === id);
  if (!item) return;

  item.qty += change;
  if (item.qty <= 0) {
    cart = cart.filter(i => i.id !== id);
  }
  saveCart();
}

function saveCart() {
  localStorage.setItem("swiftCart", JSON.stringify(cart));
  updateCartUI();
}

function updateCartUI() {
  const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
  cartCountBadge.textContent = totalCount;

  cartItemsContainer.innerHTML = "";
  let totalPrice = 0;

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = `<p class="text-gray-400 text-sm text-center py-6">Your cart is empty.</p>`;
  } else {
    cart.forEach(item => {
      const itemSubtotal = item.price * item.qty;
      totalPrice += itemSubtotal;

      const row = document.createElement("div");
      row.className = "py-3 flex justify-between items-center";
      row.innerHTML = `
        <div>
          <h4 class="font-bold text-sm text-gray-800">${item.title}</h4>
          <p class="text-xs text-gray-500">PKR ${item.price} x ${item.qty} = <b>PKR ${itemSubtotal}</b></p>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="updateQty(${item.id}, -1)" class="w-6 h-6 rounded bg-gray-200 text-gray-800 text-xs font-bold hover:bg-gray-300">-</button>
          <span class="text-xs font-bold">${item.qty}</span>
          <button onclick="updateQty(${item.id}, 1)" class="w-6 h-6 rounded bg-gray-200 text-gray-800 text-xs font-bold hover:bg-gray-300">+</button>
        </div>
      `;
      cartItemsContainer.appendChild(row);
    });
  }

  cartTotalDisplay.textContent = `PKR ${totalPrice.toLocaleString()}`;
}

// 5. Checkout
checkoutForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (cart.length === 0) {
    alert("Please add items to cart first!");
    return;
  }

  const totalPrice = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
  const payload = {
    customer_name: document.querySelector("#custName").value,
    customer_phone: document.querySelector("#custPhone").value,
    delivery_address: document.querySelector("#custAddress").value,
    total_amount: totalPrice,
    order_items: cart
  };

  orderStatusMsg.textContent = "Placing order...";
  orderStatusMsg.className = "text-xs font-bold text-gray-500";

  try {
    const res = await fetch("api/place_order.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await res.json();

    if (result.status === "success") {
      orderStatusMsg.textContent = "Order placed successfully!";
      orderStatusMsg.className = "text-xs font-bold text-green-600";
      cart = [];
      saveCart();
      checkoutForm.reset();
      setTimeout(() => toggleCartDrawer(false), 1500);
    } else {
      orderStatusMsg.textContent = result.message;
      orderStatusMsg.className = "text-xs font-bold text-red-600";
    }
  } catch (err) {
    orderStatusMsg.textContent = "Could not place order.";
    orderStatusMsg.className = "text-xs font-bold text-red-600";
  }
});

function toggleCartDrawer(open) {
  cartDrawer.classList.toggle("hidden", !open);
}

// Initial Boot
fetchProducts();
updateCartUI();