document.addEventListener('DOMContentLoaded', () => {

    const catalogContainer = document.getElementById('catalog');

    function renderCatalog() {
        if (!catalogContainer) return;

        catalogContainer.innerHTML = products.map(product => `
            <article class="product-card">
                <img src="assets/${product.image}" alt="${product.name}" style="width:100%; height:150px; object-fit:contain;">
                <h3>${product.name}</h3>
                <p>${product.price} руб.</p>
                <button class="add-btn" onclick="addToCart(${product.id})">В корзину</button>
            </article>
        `).join('');
    }

    renderCatalog();

    const savedCart = JSON.parse(localStorage.getItem('cart')) || [];
    document.getElementById('cart-count').innerText = savedCart.length;
});

window.addToCart = function (id) {
    const product = products.find(p => p.id === id);
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart.push(product);
    localStorage.setItem('cart', JSON.stringify(cart));
    document.getElementById('cart-count').innerText = cart.length;
    alert(product.name + " добавлен!");
};

const modal = document.getElementById('cart-modal');
const cartItemsContainer = document.getElementById('cart-items');
const totalPriceElement = document.getElementById('total-price');

document.getElementById('cart-btn').addEventListener('click', () => {
    modal.style.display = 'block';
    renderCartItems();
});

function closeModal() {
    modal.style.display = 'none';
    document.getElementById('order-form').style.display = 'none';
    document.getElementById('cart-content').style.display = 'block';
}

function renderCartItems() {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p>Корзина пуста</p>';
        totalPriceElement.innerText = '0';
        return;
    }

    cartItemsContainer.innerHTML = cart.map((item, index) => `
        <div style="margin-bottom: 10px;">
            ${item.name} - ${item.price} руб.
            <button onclick="removeFromCart(${index})">Удалить</button>
        </div>
    `).join('');

    const total = cart.reduce((sum, item) => sum + item.price, 0);
    totalPriceElement.innerText = total;
}

window.removeFromCart = function (index) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));

    document.getElementById('cart-count').innerText = cart.length;
    renderCartItems();
};

function showOrderForm() {
    document.getElementById('cart-content').style.display = 'none';
    document.getElementById('order-form').style.display = 'block';
}

function createOrder() {
    const name = document.getElementById('name').value;
    const phone = document.getElementById('phone').value;

    if (name && phone) {
        alert("Заказ создан!");

        localStorage.removeItem('cart');
        document.getElementById('cart-count').innerText = "0";

        closeModal();
        document.getElementById('order-form').style.display = 'none';
        document.getElementById('cart-content').style.display = 'block';
    } else {
        alert("Пожалуйста, заполните все поля!");
    }
}