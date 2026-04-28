/* ── pos.js ── Point of Sale logic ── */

// Use var to allow re-declaration in SPA navigation
if (typeof cart === 'undefined') {
  var cart = {};           // { id: { id, name, price, qty } }
}
if (typeof selectedPayment === 'undefined') {
  var selectedPayment = 'Cash';
}
if (typeof sheetExpanded === 'undefined') {
  var sheetExpanded = false;
}

function initPOS() {
  console.log('[POS] Initialising...');
  
  // Reset state for a new order if needed, or keep it. 
  // Usually for "New Order" page we might want a fresh start.
  // cart = {}; 

  // ── Category filter
  document.querySelectorAll('.cat-pill').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.cat-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterProducts(btn.dataset.cat, document.getElementById('productSearch').value);
    };
  });

  // ── Search
  const searchEl = document.getElementById('productSearch');
  if (searchEl) {
    searchEl.oninput = e => {
      const activeCat = document.querySelector('.cat-pill.active')?.dataset.cat || '';
      filterProducts(activeCat, e.target.value);
    };
  }

  // Initialise qty=0 state on all cards
  document.querySelectorAll('.product-card').forEach(card => {
    const id = card.dataset.id;
    const qty = cart[id] ? cart[id].qty : 0;
    updateCardQtyDisplay(card, qty);
    if (qty > 0) card.classList.add('in-cart');
    else card.classList.remove('in-cart');
    card.setAttribute('data-qty', String(qty));
  });

  renderCart();
}

// Global expose for SPA
window.initPOS = initPOS;

// Run on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPOS);
} else {
  initPOS();
}

/* ─────────────────────────────────────────
   Filter
───────────────────────────────────────── */
function filterProducts(cat, search) {
  document.querySelectorAll('.product-card').forEach(card => {
    const matchCat    = !cat    || card.dataset.category === cat;
    const matchSearch = !search || card.dataset.name.toLowerCase().includes(search.toLowerCase());
    card.classList.toggle('hidden', !(matchCat && matchSearch));
  });
}

/* ─────────────────────────────────────────
   Qty controls (called inline from HTML)
───────────────────────────────────────── */
function changeQty(productId, delta) {
  const card = document.querySelector(`.product-card[data-id="${productId}"]`);
  if (!card) return;

  const id    = parseInt(card.dataset.id);
  const name  = card.dataset.name;
  const price = parseFloat(card.dataset.price);

  if (!cart[id] && delta > 0) {
    cart[id] = { id, name, price, qty: 0 };
  }
  if (!cart[id]) return;

  cart[id].qty += delta;

  if (cart[id].qty <= 0) {
    delete cart[id];
    updateCardQtyDisplay(card, 0);
    card.classList.remove('in-cart');
    card.setAttribute('data-qty', '0');
  } else {
    updateCardQtyDisplay(card, cart[id].qty);
    card.classList.add('in-cart');
    card.setAttribute('data-qty', String(cart[id].qty));

    // Pulse animation on +
    if (delta > 0) {
      const plusBtn = card.querySelector('.qty-plus');
      if (plusBtn) {
        plusBtn.style.transform = 'scale(0.88)';
        setTimeout(() => plusBtn.style.transform = '', 120);
      }
    }
  }

  renderCart();
}

function updateCardQtyDisplay(card, qty) {
  const numEl = card.querySelector('.qty-num');
  if (numEl) numEl.textContent = qty;
}

/* ─────────────────────────────────────────
   Cart render
───────────────────────────────────────── */
function renderCart() {
  const items       = Object.values(cart);
  const totalEl     = document.getElementById('cartBarTotal');
  const proceedBtn  = document.getElementById('proceedBtn');
  const listEl      = document.getElementById('cartItemsList');
  const bkSubtotal  = document.getElementById('bkSubtotal');
  const bkTax       = document.getElementById('bkTax');
  const bkTotal     = document.getElementById('bkTotal');
  const sheet       = document.getElementById('cartSheet');
  const gridWrap    = document.getElementById('posGridWrap');

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const tax      = subtotal * 0.05;
  const total    = subtotal + tax;

  if (totalEl)    totalEl.textContent   = '₹' + subtotal.toFixed(2);
  if (bkSubtotal) bkSubtotal.textContent = '₹' + subtotal.toFixed(2);
  if (bkTax)      bkTax.textContent     = '₹' + tax.toFixed(2);
  if (bkTotal)    bkTotal.textContent   = '₹' + total.toFixed(2);

  if (proceedBtn) {
    proceedBtn.disabled = items.length === 0;
    // Reset text if it was in "Placing order..." state
    if (items.length === 0) {
      proceedBtn.innerHTML = 'Place Order <i class="fa-solid fa-chevron-right proceed-arrow"></i>';
    }
  }

  // Render cart rows
  if (listEl) {
    if (!items.length) {
      listEl.innerHTML = '';
    } else {
      listEl.innerHTML = items.map(item => `
        <div class="cart-item-row">
          <div class="cart-item-badge">${item.qty}</div>
          <div class="cart-item-info">
            <div class="cart-item-name">${escHtml(item.name)}</div>
          </div>
          <div class="cart-item-price">₹${(item.price * item.qty).toFixed(0)}</div>
        </div>
      `).join('');
    }
  }

  // Show/hide sheet and manage bottom padding on grid
  if (!items.length) {
    collapseSheet();
    if (gridWrap) gridWrap.style.paddingBottom = '12px';
  } else {
    // Sheet visible — give grid breathing room
    if (gridWrap) gridWrap.style.paddingBottom = '110px';
  }
}

/* ─────────────────────────────────────────
   Sheet expand / collapse
───────────────────────────────────────── */
function toggleCartExpand() {
  const items = Object.values(cart);
  if (!items.length) return;

  const sheet = document.getElementById('cartSheet');
  if (!sheet) return;

  sheetExpanded = !sheetExpanded;
  sheet.classList.toggle('expanded', sheetExpanded);
}

function collapseSheet() {
  sheetExpanded = false;
  const sheet = document.getElementById('cartSheet');
  if (sheet) sheet.classList.remove('expanded');
}

/* ─────────────────────────────────────────
   Checkout
───────────────────────────────────────── */
function placeorder() {
  const items = Object.values(cart);
  if (!items.length) return;

  const payload = {
    items: items.map(i => ({ product_id: i.id, quantity: i.qty, price: i.price })),
    payment_method: selectedPayment
  };

  const btn = document.getElementById('proceedBtn');
  if (btn) { 
    btn.disabled = true; 
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-2"></i>Placing order…'; 
  }

  fetch('/orders/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
    .then(r => {
      if (!r.ok) throw new Error('Network error');
      return r.json();
    })
    .then(data => {
      const orderNum = data.data?.order_number || '';
      showToast('Order #' + orderNum + ' placed successfully! ✓', 'success');
      clearAllCart();
    })
    .catch((err) => {
      console.error('[POS] Order failed:', err);
      showToast('Order failed. Please try again.', 'error');
      if (btn) { 
        btn.disabled = false; 
        btn.innerHTML = 'Place Order <i class="fa-solid fa-chevron-right proceed-arrow"></i>'; 
      }
    });
}

function clearAllCart() {
  cart = {};
  document.querySelectorAll('.product-card').forEach(card => {
    updateCardQtyDisplay(card, 0);
    card.classList.remove('in-cart');
    card.setAttribute('data-qty', '0');
  });
  renderCart();
}

/* ─────────────────────────────────────────
   Utilities
───────────────────────────────────────── */
function escHtml(str) {
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;');
}

function showToast(msg, type) {
  // Use global showToast from common.js/script.js if available
  if (typeof window.showToast === 'function' && window.showToast !== showToast) {
    window.showToast(msg, type);
    return;
  }
  const stack = document.getElementById('toastStack');
  if (!stack) return;
  const el = document.createElement('div');
  el.className = 'toast ' + (type || 'success');
  el.textContent = msg;
  stack.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}