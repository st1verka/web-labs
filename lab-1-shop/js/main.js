let cart = JSON.parse(localStorage.getItem('cart')) || [];

function updateCartButton() {
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cart-btn').innerText = `Корзина (${total})`;
}

function saveAndRender() {
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCartItems();
    updateCartButton();
}

window.addToCart = (id) => {
    const p = products.find(i => i.id === id);
    const existing = cart.find(i => i.id === id);
    if (existing) existing.quantity++;
    else cart.push({ ...p, quantity: 1 });
    saveAndRender();
    showNotification(`${p.name} добавлен`);
};

window.changeQty = (index, delta) => {
    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) cart.splice(index, 1);
    saveAndRender();
};

function renderCatalog() {
    document.getElementById('catalog').innerHTML = products.map(p => `
        <article class="product-card">
            <img src="assets/${p.image}" alt="${p.name}">
            <h3>${p.name}</h3>
            <p>${p.price} руб.</p>
            <button class="btn btn-primary" onclick="addToCart(${p.id})">В корзину</button>
        </article>
    `).join('');
}

function renderCartItems() {
    const container = document.getElementById('cart-items');
    container.innerHTML = cart.map((item, index) => `
        <div class="cart-item">
            <span>${item.name}</span>
            <div class="quantity-controls">
                <button class="qty-btn" onclick="changeQty(${index}, -1)">-</button>
                <span>${item.quantity}</span>
                <button class="qty-btn" onclick="changeQty(${index}, 1)">+</button>
            </div>
            <span>${item.price * item.quantity} руб.</span>
        </div>
    `).join('');
    document.getElementById('total-price').innerText = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
}

function showNotification(msg) {
    const note = document.getElementById('notification');
    note.innerText = msg; note.style.display = 'block';
    setTimeout(() => note.style.display = 'none', 2000);
}

function openCart() { document.getElementById('cart-modal').style.display = 'block'; renderCartItems(); }
function closeModal() { document.getElementById('cart-modal').style.display = 'none'; }
function showOrderForm() { document.getElementById('cart-content').style.display = 'none'; document.getElementById('order-form').style.display = 'block'; }
function backToCart() { document.getElementById('cart-content').style.display = 'block'; document.getElementById('order-form').style.display = 'none'; }
function createOrder() {
    if (document.getElementById('name').value && document.getElementById('phone').value) {
        alert("Заказ создан!");
        localStorage.removeItem('cart'); cart = []; saveAndRender(); closeModal();
    } else alert("Заполните поля!");
}

renderCatalog();
updateCartButton();