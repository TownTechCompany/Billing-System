/* ── pos.js ── Point of Sale logic ── */

// Use var + guard to avoid re-declaration errors during SPA navigation
if (typeof cart          === 'undefined') var cart = {};
if (typeof selectedPayment === 'undefined') var selectedPayment = 'Cash';
if (typeof sheetExpanded   === 'undefined') var sheetExpanded   = false;
if (typeof selectedTable   === 'undefined') var selectedTable   = null;   // null = no table
if (typeof selectedOrderType === 'undefined') var selectedOrderType = 'dine-in';
if (typeof editOrderId       === 'undefined') var editOrderId       = null;
if (typeof editOrderNum      === 'undefined') var editOrderNum      = null;

// Number of tables to generate (can be adjusted)
var TABLE_COUNT = 15;

/* ─────────────────────────────────────────
   Init — called on load AND on SPA re-nav
───────────────────────────────────────── */
function initPOS() {
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

  // ── Restore qty display on cards (cart state survives SPA nav)
  document.querySelectorAll('.product-card').forEach(card => {
    const id  = card.dataset.id;
    const qty = cart[id] ? cart[id].qty : 0;
    updateCardQtyDisplay(card, qty);
    card.classList.toggle('in-cart', qty > 0);
    card.setAttribute('data-qty', String(qty));
  });

  // ── Build table chips
  buildTableChips();

  // ── Restore order-type button active state
  syncOrderTypeButtons();

  renderCart();

  // Ensure URL params are evaluated even when navigating via SPA router
  applyURLParams();
}

// Expose for SPA router
window.initPOS = initPOS;

// Boot on first load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { initPOS(); });
} else {
  initPOS();
}

/* ─────────────────────────────────────────
   Apply URL query params (table, type, customer)
   Passed when coming from Orders → New Order modal
───────────────────────────────────────── */
function applyURLParams() {
  const params = new URLSearchParams(window.location.search);
  const tableParam = params.get('table');
  const typeParam  = params.get('type');

  if (typeParam) {
    selectedOrderType = typeParam;
    syncOrderTypeButtons();
  }

  if (tableParam) {
    const n = parseInt(tableParam, 10);
    if (!isNaN(n) && n > 0) {
      selectedTable = n;
      buildTableChips();
    }
  }

  const editId = params.get('edit_order_id');
  if (editId) {
    loadOrderForEdit(editId);
  } else {
    editOrderId = null;
    editOrderNum = null;
    const titleEl = document.querySelector('.top-bar-page-title');
    if (titleEl) titleEl.innerHTML = 'New Order';
  }
}

/* ─────────────────────────────────────────
   Load Order for Edit
───────────────────────────────────────── */
function loadOrderForEdit(id) {
  fetch(`/orders/get-order-detail/${id}`)
    .then(r => r.json())
    .then(res => {
      if (!res.data) return;
      const order = res.data;
      
      editOrderId = order.id;
      editOrderNum = order.order_number;
      
      // Update UI title
      const titleEl = document.querySelector('.top-bar-page-title');
      if (titleEl) {
        titleEl.innerHTML = `Editing <span style="color:var(--brand-500);font-weight:800">#${editOrderNum}</span>`;
      }
      
      // Set table & type
      if (order.table_number) selectedTable = parseInt(order.table_number);
      if (order.order_type) selectedOrderType = order.order_type;
      buildTableChips();
      syncOrderTypeButtons();
      
      // Populate cart
      cart = {};
      if (order.items && order.items.length) {
        order.items.forEach(item => {
          cart[item.product_id] = {
            id: item.product_id,
            name: item.product_name,
            price: item.price,
            qty: item.quantity
          };
          
          // Update card UI if visible
          const card = document.querySelector(`.product-card[data-id="${item.product_id}"]`);
          if (card) {
            updateCardQtyDisplay(card, item.quantity);
            card.classList.add('in-cart');
            card.setAttribute('data-qty', String(item.quantity));
          }
        });
      }
      
      renderCart();
      
      // Expand cart by default for edit mode
      sheetExpanded = false; // ensure toggle expands it
      toggleCartExpand();
    })
    .catch(err => {
      console.error('[POS] Failed to load order for edit:', err);
      showToast('Failed to load order details for editing', 'error');
    });
}

/* ─────────────────────────────────────────
   Build Table Chips (generated by JS)
───────────────────────────────────────── */
function buildTableChips() {
  const container = document.getElementById('tableChips');
  if (!container) return;

  let html = `<button class="table-chip no-table ${selectedTable === null ? 'active' : ''}"
                onclick="selectTable(null, this)">No Table</button>`;

  for (let i = 1; i <= TABLE_COUNT; i++) {
    const active = selectedTable === i ? 'active' : '';
    html += `<button class="table-chip ${active}" onclick="selectTable(${i}, this)">Table ${String(i).padStart(2,'0')}</button>`;
  }
  container.innerHTML = html;
}

function selectTable(num, btn) {
  selectedTable = num;
  document.querySelectorAll('.table-chip').forEach(c => c.classList.remove('active'));
  if (btn) btn.classList.add('active');
}

/* ─────────────────────────────────────────
   Order Type
───────────────────────────────────────── */
function selectOrderType(btn) {
  selectedOrderType = btn.dataset.type;
  document.querySelectorAll('.order-type-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function syncOrderTypeButtons() {
  document.querySelectorAll('.order-type-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === selectedOrderType);
  });
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
  const countLabel  = document.getElementById('cartItemCount');
  const proceedBtn  = document.getElementById('proceedBtn');
  const listEl      = document.getElementById('cartItemsList');
  const bkSubtotal  = document.getElementById('bkSubtotal');
  const bkTax       = document.getElementById('bkTax');
  const bkTotal     = document.getElementById('bkTotal');
  const gridWrap    = document.getElementById('posGridWrap');

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const tax      = subtotal * 0.05;
  const total    = subtotal + tax;

  if (totalEl)    totalEl.textContent   = '₹' + subtotal.toFixed(2);
  if (bkSubtotal) bkSubtotal.textContent = '₹' + subtotal.toFixed(2);
  if (bkTax)      bkTax.textContent     = '₹' + tax.toFixed(2);
  if (bkTotal)    bkTotal.textContent   = '₹' + total.toFixed(2);

  // Update item count label
  const totalQty = items.reduce((s, i) => s + i.qty, 0);
  if (countLabel) {
    countLabel.textContent = totalQty > 0 ? `ITEMS: ${totalQty}` : 'TOTAL AMOUNT';
  }

  if (proceedBtn) {
    proceedBtn.disabled = items.length === 0;
    if (items.length === 0) {
      proceedBtn.innerHTML = (editOrderId ? 'Update Order' : 'Place Order') + ' <i class="fa-solid fa-bolt proceed-arrow"></i>';
    } else {
      proceedBtn.innerHTML = (editOrderId ? 'Update Order' : 'Place Order') + ' <i class="fa-solid fa-bolt proceed-arrow"></i>';
    }
  }

  // Render cart rows
  if (listEl) {
    if (!items.length) {
      listEl.innerHTML = '';
    } else {
      listEl.innerHTML = items.map(item => `
        <div class="cart-item-row">
          <div class="cart-item-badge">${item.qty}x</div>
          <div class="cart-item-info">
            <div class="cart-item-name">${escHtml(item.name)}</div>
          </div>
          <div class="cart-item-price">₹${(item.price * item.qty).toFixed(0)}</div>
        </div>
      `).join('');
    }
  }

  // Show/hide sheet
  if (!items.length) {
    collapseSheet();
    if (gridWrap) gridWrap.style.paddingBottom = '12px';
  } else {
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
  const savedId = editOrderId;
  const items = Object.values(cart);
  if (!items.length) return;

  const isEdit = !!savedId;
  const payload = {
    items:          items.map(i => ({ product_id: i.id, product_name: i.name, quantity: i.qty, price: i.price })),
    payment_method: selectedPayment,
    order_type:     selectedOrderType,
    table_number:   selectedTable || null,
  };
  if (!isEdit) {
    payload.date_created = new Date().toISOString();
  }

  const btn = document.getElementById('proceedBtn');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${isEdit ? 'Updating' : 'Placing'} order…`;
  }

  const url = isEdit ? `/orders/update-order/${savedId}` : '/orders/create-order';
  const method = isEdit ? 'PATCH' : 'POST';

  fetch(url, {
    method: method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
    .then(r => {
      if (!r.ok) throw new Error('Network error');
      return r.json();
    })
    .then(data => {
      const orderNum = isEdit ? editOrderNum : (data.data?.order_number || '');
      showToast('Order #' + orderNum + (isEdit ? ' updated successfully! ✓' : ' placed successfully! ✓'), 'success');
      clearAllCart();
      
      // If editing, navigate back to the order details page
      if (isEdit) {
        setTimeout(() => {
          window.__spa.navigate(`/orders/${savedId}`);
        }, 1000);
      }
    })
    .catch(err => {
      console.error('[POS] Order failed:', err);
      showToast((isEdit ? 'Update' : 'Order') + ' failed. Please try again.', 'error');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = (isEdit ? 'Update Order' : 'Place Order') + ' <i class="fa-solid fa-bolt proceed-arrow"></i>';
      }
    });
}

function clearAllCart() {
  cart = {};
  selectedTable = null;
  selectedOrderType = 'dine-in';

  document.querySelectorAll('.product-card').forEach(card => {
    updateCardQtyDisplay(card, 0);
    card.classList.remove('in-cart');
    card.setAttribute('data-qty', '0');
  });

  // Reset table chips
  buildTableChips();

  // Reset order type
  syncOrderTypeButtons();

  // Clear edit mode
  editOrderId = null;
  editOrderNum = null;
  const titleEl = document.querySelector('.top-bar-page-title');
  if (titleEl) titleEl.innerHTML = 'New Order';

  // Clear URL params
  const url = new URL(window.location);
  url.searchParams.delete('edit_order_id');
  url.searchParams.delete('table');
  url.searchParams.delete('type');
  window.history.replaceState({}, '', url);

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
  if (typeof window.showToast === 'function' && window.showToast !== showToast) {
    window.showToast(msg, type);
    return;
  }
  const stack = document.getElementById('toastStack');
  if (!stack) return;
  const el = document.createElement('div');
  el.className = 'toast-item ' + (type || 'success');
  el.textContent = msg;
  stack.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}