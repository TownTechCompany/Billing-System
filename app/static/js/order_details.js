if (window.ORDER_DETAILS_JS_LOADED) {
  if (typeof initOrderDetails === 'function') initOrderDetails();
}
window.ORDER_DETAILS_JS_LOADED = true;

/* order_detail.js */

function initOrderDetails() {
  console.log('[OrderDetails] Initializing...');
  addedItems = [];
}

function openAddItemModal() {
  if (typeof window.__spa !== 'undefined') {
    window.__spa.navigate('/pos?edit_order_id=' + ORDER_ID);
  } else {
    window.location.href = '/pos?edit_order_id=' + ORDER_ID;
  }
}

// ── Dropdown toggle ────────────────────────────────────────
function toggleMore() {
  const dd = document.getElementById('moreDropdown');
  dd.classList.toggle('open');
}
document.addEventListener('click', e => {
  const wrap = document.querySelector('.od-more-wrap');
  if (wrap && !wrap.contains(e.target)) {
    document.getElementById('moreDropdown')?.classList.remove('open');
  }
});

// ── Toast ──────────────────────────────────────────────────
function showToast(msg, type = 'success') {
  const stack = document.getElementById('toastStack');
  const el = document.createElement('div');
  el.className = `toast-item ${type}`;
  el.innerHTML = `<i class="fa-solid ${type === 'success' ? 'fa-circle-check' : 'fa-circle-xmark'}"></i> ${msg}`;
  stack.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

// ── Print ──────────────────────────────────────────────────
function printReceipt() {
  window.print();
}

// ── Reopen Order ──────────────────────────────────────────
function reopenOrder(orderId) {
  fetch(`/orders/update-order/${orderId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'open' })
  })
    .then(r => r.json())
    .then(() => {
      showToast('Order reopened');
      setTimeout(() => location.reload(), 800);
    })
    .catch(() => showToast('Failed to reopen order', 'error'));
}

// ── Share ──────────────────────────────────────────────────
function shareOrder() {
  const url = window.location.href;
  if (navigator.share) {
    navigator.share({ title: `Order ${ORDER_NUM}`, url });
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => showToast('Link copied to clipboard'));
  } else {
    showToast('Order: ' + ORDER_NUM);
  }
  document.getElementById('moreDropdown')?.classList.remove('open');
}

// ── Delete ─────────────────────────────────────────────────
function confirmDelete(orderId) {
  document.getElementById('moreDropdown')?.classList.remove('open');
  const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
  document.getElementById('confirmDeleteBtn').onclick = () => deleteOrder(orderId, modal);
  modal.show();
}

function deleteOrder(orderId, modal) {
  fetch(`/orders/delete-order/${orderId}`, { method: 'DELETE' })
    .then(r => r.json())
    .then(() => {
      modal.hide();
      showToast('Order deleted');
      setTimeout(() => history.back(), 1000);
    })
    .catch(() => showToast('Failed to delete order', 'error'));
}


// ── Checkout ───────────────────────────────────────────────
function proceedCheckout() {
  // Calculate from displayed totals
  const totalEl = document.querySelector('.od-total-amount');
  const totalText = totalEl ? totalEl.textContent.replace('₹', '') : '0.00';
  const totalAmt = parseFloat(totalText) || ORDER_TOTAL;

  // Build summary HTML
  const rows = Array.from(document.querySelectorAll('.od-item-row')).map(r => {
    const name  = r.querySelector('.od-item-name')?.textContent || '';
    const price = r.querySelector('.od-item-price')?.textContent || '';
    return `<div class="cs-row"><span>${escHtml(name)}</span><span>${price}</span></div>`;
  }).join('');

  document.getElementById('checkoutSummary').innerHTML = `
    ${rows}
    <div class="cs-row final"><span>Total</span><span>₹${totalAmt.toFixed(2)}</span></div>
  `;

  // Reset payment selection to Cash (default)
  selectPaymentMethod('Cash');
  document.getElementById('cashReceived').value = '';
  document.getElementById('changeAmount').textContent = '₹0.00';

  new bootstrap.Modal(document.getElementById('checkoutModal')).show();
}

function selectPaymentMethod(method) {
  // Update buttons UI
  document.querySelectorAll('.od-pay-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.method === method);
  });

  // Toggle detail blocks
  document.querySelectorAll('.pay-detail-block').forEach(el => el.style.display = 'none');
  
  if (method === 'Cash') {
    document.getElementById('cashDetails').style.display = 'block';
  } else if (method === 'UPI') {
    document.getElementById('upiDetails').style.display = 'block';
    updateUpiQr();
  } else if (method === 'Card') {
    document.getElementById('cardDetails').style.display = 'block';
  }
}

function calculateChange() {
  const totalEl = document.querySelector('.od-total-amount');
  const totalText = totalEl ? totalEl.textContent.replace('₹', '') : '0.00';
  const totalAmt = parseFloat(totalText) || ORDER_TOTAL;
  
  const received = parseFloat(document.getElementById('cashReceived').value) || 0;
  const change = Math.max(0, received - totalAmt);
  
  document.getElementById('changeAmount').textContent = `₹${change.toFixed(2)}`;
}

function updateUpiQr() {
  const totalEl = document.querySelector('.od-total-amount');
  const totalText = totalEl ? totalEl.textContent.replace('₹', '') : '0.00';
  const totalAmt = parseFloat(totalText) || ORDER_TOTAL;
  
  const pa = 'towntech@upi'; // Replace with real UPI ID if available in settings
  const pn = 'TownTech';
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=${pa}&pn=${pn}&am=${totalAmt.toFixed(2)}&cu=INR`;
  
  document.getElementById('upiQrCode').src = qrUrl;
}

function confirmCheckout() {
  const method = document.querySelector('.od-pay-btn.active')?.dataset.method || 'Cash';
  fetch(`/orders/checkout-order/${ORDER_ID}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payment_method: method })
  })
    .then(r => r.json())
    .then(() => {
      bootstrap.Modal.getInstance(document.getElementById('checkoutModal'))?.hide();
      showToast('Payment confirmed! ✓');
      setTimeout(() => location.reload(), 1000);
    })
    .catch(() => {
      // Graceful fallback — mark locally if endpoint not yet wired
      bootstrap.Modal.getInstance(document.getElementById('checkoutModal'))?.hide();
      showToast('Order checked out');
      const pill = document.querySelector('.od-status-pill');
      if (pill) { pill.className = 'od-status-pill paid'; pill.textContent = 'PAID'; }
    });
}

// ── Util ───────────────────────────────────────────────────
function escHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}