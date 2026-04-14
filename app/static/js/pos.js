let cart = {}; // { productId: { id, name, price, qty } }
let selectedPayment = 'Cash';

document.addEventListener('DOMContentLoaded', () => {
    // Category filter
    const catBtns = document.querySelectorAll('.cat-btn');
    for (let i = 0; i < catBtns.length; i++) {
        const btn = catBtns[i];
        btn.addEventListener('click', () => {
            for (let j = 0; j < catBtns.length; j++) catBtns[j].classList.remove('active');
            btn.classList.add('active');
            filterProducts(btn.dataset.cat, $('#productSearch').val());
        });
    }

    // Search
    $('#productSearch').on('input', e => {
        const activeCat = document.querySelector('.cat-btn.active')?.dataset.cat || '';
        filterProducts(activeCat, e.target.value);
    });

    // Payment method buttons
    const payBtns = document.querySelectorAll('.pay-btn');
    for (let i = 0; i < payBtns.length; i++) {
        const btn = payBtns[i];
        btn.addEventListener('click', () => {
            for (let j = 0; j < payBtns.length; j++) payBtns[j].classList.remove('active');
            btn.classList.add('active');
            selectedPayment = btn.dataset.method;
        });
    }
});

function filterProducts(cat, search) {
    const cards = document.querySelectorAll('.product-card');
    for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const matchCat = !cat || card.dataset.category === cat;
        const matchSearch = !search || card.dataset.name.toLowerCase().includes(search.toLowerCase());
        card.classList.toggle('hidden', !(matchCat && matchSearch));
    }
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
    const container = $('#cartItems');
    const emptyEl = $('#cartEmpty');
    const checkoutBtn = $('#checkoutBtn');
    const items = Object.values(cart);

    if (!items.length) {
        container.empty();
        container.append(emptyEl);
        emptyEl.css('display', 'flex');
        $('#cartTotal').text('₹0.00');
        checkoutBtn.prop('disabled', true);
        return;
    }

    emptyEl.hide();
    container.empty();

    let total = 0;
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const lineTotal = item.price * item.qty;
        total += lineTotal;
        const el = $('<div>', {
            class: 'cart-item',
            html: `
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
        `
        });
        container.append(el);
    }

    $('#cartTotal').text('₹' + total.toFixed(2));
    checkoutBtn.prop('disabled', false);
}

function checkout() {
    const items = Object.values(cart);
    if (!items.length) return;

    const payload = {
        items: items.map(i => ({ product_id: i.id, quantity: i.qty, price: i.price })),
        payment_method: selectedPayment
    };

    $.ajax({
        url: '/orders/create-order',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(payload),
        success: function(data) {
            showToast(`Order ${data.data.order_number} placed! ✓`, 'success');
            clearCart();
        },
        error: function() {
            showToast('Order failed. Try again.', 'error');
        }
    });
}
