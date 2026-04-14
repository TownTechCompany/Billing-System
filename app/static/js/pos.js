let cart = {}; // { productId: { id, name, price, qty } }
let selectedPayment = 'Cash';

document.addEventListener('DOMContentLoaded', () => {
    // Category filter
    document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterProducts(btn.dataset.cat, document.getElementById('productSearch').value);
        });
    });

    // Search
    document.getElementById('productSearch').addEventListener('input', e => {
        const activeCat = document.querySelector('.cat-btn.active')?.dataset.cat || '';
        filterProducts(activeCat, e.target.value);
    });

    // Payment method buttons
    document.querySelectorAll('.pay-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.pay-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedPayment = btn.dataset.method;
        });
    });
});

function filterProducts(cat, search) {
    document.querySelectorAll('.product-card').forEach(card => {
        const matchCat = !cat || card.dataset.category === cat;
        const matchSearch = !search || card.dataset.name.toLowerCase().includes(search.toLowerCase());
        card.classList.toggle('hidden', !(matchCat && matchSearch));
    });
}

function addToCart(productId) {
    const card = document.querySelector(`.product-card[data-id="${productId}"]`);
    if (!card) return;
    const id = parseInt(card.dataset.id);
    const name = card.dataset.name;
    const price = parseFloat(card.dataset.price);

    if (cart[id]) {
        cart[id].qty++;
    } else {
        cart[id] = { id, name, price, qty: 1 };
    }
    renderCart();

    // Pulse animation
    card.style.transform = 'scale(0.97)';
    setTimeout(() => card.style.transform = '', 120);
}

function changeQty(id, delta) {
    if (!cart[id]) return;
    cart[id].qty += delta;
    if (cart[id].qty <= 0) delete cart[id];
    renderCart();
}

function removeFromCart(id) {
    delete cart[id];
    renderCart();
}

function clearCart() {
    cart = {};
    renderCart();
}

function renderCart() {
    const container = document.getElementById('cartItems');
    const emptyEl = document.getElementById('cartEmpty');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const items = Object.values(cart);

    if (!items.length) {
        container.innerHTML = '';
        container.appendChild(emptyEl);
        emptyEl.style.display = 'flex';
        document.getElementById('cartTotal').textContent = '₹0.00';
        checkoutBtn.disabled = true;
        return;
    }

    emptyEl.style.display = 'none';
    container.innerHTML = '';

    let total = 0;
    items.forEach(item => {
        const lineTotal = item.price * item.qty;
        total += lineTotal;
        const el = document.createElement('div');
        el.className = 'cart-item';
        el.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-name">${escHtml(item.name)}</div>
                <div class="cart-item-price">₹${item.price.toFixed(2)} each</div>
            </div>
            <div class="cart-item-controls">
                <button class="qty-btn" onclick="changeQty(${item.id}, -1)">−</button>
                <span class="qty-num">${item.qty}</span>
                <button class="qty-btn" onclick="changeQty(${item.id}, 1)">+</button>
            </div>
            <div class="cart-item-total">₹${lineTotal.toFixed(0)}</div>
            <button class="cart-item-remove" onclick="removeFromCart(${item.id})" title="Remove"><i class="fa-solid fa-xmark"></i></button>
        `;
        container.appendChild(el);
    });

    document.getElementById('cartTotal').textContent = '₹' + total.toFixed(2);
    checkoutBtn.disabled = false;
}

async function checkout() {
    const items = Object.values(cart);
    if (!items.length) return;

    const payload = {
        items: items.map(i => ({ product_id: i.id, quantity: i.qty, price: i.price })),
        payment_method: selectedPayment
    };

    try {
        const res = await fetch('/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error();
        showToast(`Order ${data.order_number} placed! ✓`, 'success');
        clearCart();
    } catch { showToast('Order failed. Try again.', 'error'); }
}
