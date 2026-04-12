/* ════════════════════════════════════════════════
   orders.js — Order Management
   ════════════════════════════════════════════════ */

'use strict';

// ── State ──────────────────────────────────────────────────────────────────
let allOrders    = [];
let filteredOrders = [];
let allProducts  = [];
let currentView  = 'list';
let activeFilter = 'all';
let currentPage  = 1;
const PAGE_SIZE  = 15;

let currentOrderId   = null;
let currentOrderData = null;
let pendingVoidId    = null;
let pendingDeleteId  = null;
let pendingDeleteNum = null;
let checkoutPayMethod = 'Cash';
let pinBuffer = '';

// ── Init ───────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    startClock();
    initChips();
    initSearch();
    initDatePicker();
    buildPinPad();
    initPayMethodBtns();
    loadOrders();
    loadProducts();
});

// ── Clock ──────────────────────────────────────────────────────────────────
function startClock() {
    const el = document.getElementById('liveTime');
    if (!el) return;
    const tick = () => {
        const now = new Date();
        el.textContent = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };
    tick();
    setInterval(tick, 1000);
}

// ── Load Orders ────────────────────────────────────────────────────────────
async function loadOrders() {
    try {
        const res = await fetch('/api/orders');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        allOrders = await res.json();
        calcStats();
        applyFilters();
    } catch (e) {
        showToast('Failed to load orders', 'error');
        console.error(e);
    }
}

// ── Load Products ──────────────────────────────────────────────────────────
async function loadProducts() {
    try {
        const res = await fetch('/api/products');
        allProducts = await res.json();
    } catch {
        /* non-fatal */
    }
}

// ── Stats ──────────────────────────────────────────────────────────────────
function calcStats() {
    const today = new Date().toDateString();
    let open = 0, paid = 0, rev = 0;

    allOrders.forEach(o => {
        const oDate = new Date(o.date_created).toDateString();
        if (o.status === 'open') open++;
        if (o.status === 'paid' && oDate === today) { paid++; rev += o.total_amount; }
    });

    const todayOrders = allOrders.filter(o => new Date(o.date_created).toDateString() === today);
    const avg = todayOrders.length ? (todayOrders.reduce((s, o) => s + o.total_amount, 0) / todayOrders.length) : 0;

    setText('statOpen',    open);
    setText('statPaid',    paid);
    setText('statRevenue', '₹' + fmtNum(rev));
    setText('statAvg',     '₹' + fmtNum(avg));
    setText('headerOrderCount', `${todayOrders.length} order${todayOrders.length !== 1 ? 's' : ''} today`);
}

// ── Filter chips ───────────────────────────────────────────────────────────
function initChips() {
    document.querySelectorAll('#statusChips .chip').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#statusChips .chip').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeFilter = btn.dataset.filter;
            currentPage = 1;
            applyFilters();
        });
    });
}

// ── Search ─────────────────────────────────────────────────────────────────
function initSearch() {
    document.getElementById('orderSearch').addEventListener('input', () => {
        currentPage = 1;
        applyFilters();
    });
}

// ── Date picker ────────────────────────────────────────────────────────────
function initDatePicker() {
    if (typeof flatpickr === 'undefined') return;
    flatpickr('#orderDateRange', {
        mode: 'range',
        dateFormat: 'Y-m-d',
        allowInput: true,
        onClose(dates) {
            if (dates.length === 2) { currentPage = 1; applyFilters(dates[0], dates[1]); }
            if (dates.length === 0)  { currentPage = 1; applyFilters(); }
        },
        onReady(_, __, fp) {
            fp.calendarContainer?.classList.add('flatpickr-order');
        }
    });
}

// ── Apply all filters ──────────────────────────────────────────────────────
function applyFilters(dateFrom, dateTo) {
    const q = document.getElementById('orderSearch').value.toLowerCase().trim();

    filteredOrders = allOrders.filter(o => {
        // status
        if (activeFilter !== 'all' && (o.status || 'paid') !== activeFilter) return false;
        // date range
        if (dateFrom && dateTo) {
            const d = new Date(o.date_created);
            if (d < dateFrom || d > dateTo) return false;
        }
        // search
        if (q) {
            const hay = [o.order_number, o.customer_name, o.payment_method,
                         o.table_number, o.status, String(o.total_amount)].join(' ').toLowerCase();
            if (!hay.includes(q)) return false;
        }
        return true;
    });

    renderTable();
    if (currentView === 'table') renderFloorMap();
}

// ── Render table ───────────────────────────────────────────────────────────
function renderTable() {
    const tbody = document.getElementById('ordersBody');
    const empty = document.getElementById('emptyState');

    const total = filteredOrders.length;
    const start = (currentPage - 1) * PAGE_SIZE;
    const page  = filteredOrders.slice(start, start + PAGE_SIZE);

    if (total === 0) {
        tbody.innerHTML = '';
        empty.style.display = 'flex';
        renderPagination(0);
        return;
    }
    empty.style.display = 'none';

    tbody.innerHTML = page.map(o => {
        const status  = o.status || 'paid';
        const dotCls  = `row-dot row-dot-${status}`;
        const pillCls = `status-pill sp-${status}`;
        const pMethod = (o.payment_method || 'cash').toLowerCase().replace('/', '').replace(' ', '');
        const payCls  = `status-pill status-${pMethod}`;
        const oType   = (o.order_type || 'takeaway').toLowerCase();
        const typeCls = `otype-badge otype-${oType}`;
        const typeLabel = oType === 'dine-in' ? 'Dine-in' : oType === 'delivery' ? 'Delivery' : 'Takeaway';
        const tableInfo = o.table_number
            ? `<span class="${typeCls}">T${o.table_number}</span>`
            : `<span class="${typeCls}">${typeLabel}</span>`;
        const d = new Date(o.date_created);
        const dateStr = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

        return `<tr data-id="${o.id}" onclick="openPanel(${o.id})">
            <td><span class="${dotCls}" style="display:block;width:8px;height:8px;border-radius:50%;margin:auto"></span></td>
            <td><span class="order-num">${esc(o.order_number)}</span></td>
            <td>
                <div class="order-date">${dateStr}</div>
                <div class="order-time">${timeStr}</div>
            </td>
            <td class="hide-sm">${tableInfo}</td>
            <td class="hide-sm" style="color:var(--slate-500);font-size:.81rem">${esc(o.customer_name || '—')}</td>
            <td><span class="items-badge">${o.item_count ?? (o.items ? o.items.length : '?')}</span></td>
            <td><span class="total-val">₹${fmtNum(o.total_amount)}</span></td>
            <td><span class="status-pill ${payCls}">${esc(o.payment_method || 'Cash')}</span></td>
            <td><span class="${pillCls}">${status}</span></td>
            <td class="text-end" onclick="event.stopPropagation()">
                <div class="action-btn-group" style="justify-content:flex-end">
                    <button class="act-btn view"   title="View / Edit"   onclick="openPanel(${o.id})"><i class="fa-regular fa-pen-to-square"></i></button>
                    <button class="act-btn delete" title="Delete order"  onclick="openDeleteModal(${o.id},'${esc(o.order_number)}')"><i class="fa-regular fa-trash-can"></i></button>
                </div>
            </td>
        </tr>`;
    }).join('');

    renderPagination(total);
}

// ── Pagination ─────────────────────────────────────────────────────────────
function renderPagination(total) {
    const totalPages = Math.ceil(total / PAGE_SIZE);
    const start = Math.min((currentPage - 1) * PAGE_SIZE + 1, total);
    const end   = Math.min(currentPage * PAGE_SIZE, total);

    setText('paginInfo', total > 0 ? `Showing ${start}–${end} of ${total} orders` : '0 orders');

    const btns = document.getElementById('paginBtns');
    btns.innerHTML = '';

    if (totalPages <= 1) return;

    const prev = makeEl('button', 'pagin-btn', '<i class="fa-solid fa-chevron-left"></i>');
    prev.disabled = currentPage === 1;
    prev.onclick = () => { currentPage--; renderTable(); };
    btns.appendChild(prev);

    // Show max 5 page numbers
    const pages = buildPageRange(currentPage, totalPages);
    pages.forEach(p => {
        if (p === '…') {
            const sp = makeEl('span', '', '…');
            sp.style.cssText = 'padding:0 4px;color:var(--slate-400);font-size:.77rem;display:flex;align-items:center';
            btns.appendChild(sp);
        } else {
            const btn = makeEl('button', `pagin-btn${p === currentPage ? ' active' : ''}`, String(p));
            btn.onclick = () => { currentPage = p; renderTable(); };
            btns.appendChild(btn);
        }
    });

    const next = makeEl('button', 'pagin-btn', '<i class="fa-solid fa-chevron-right"></i>');
    next.disabled = currentPage === totalPages;
    next.onclick = () => { currentPage++; renderTable(); };
    btns.appendChild(next);
}

function buildPageRange(cur, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (cur <= 4) return [1, 2, 3, 4, 5, '…', total];
    if (cur >= total - 3) return [1, '…', total-4, total-3, total-2, total-1, total];
    return [1, '…', cur-1, cur, cur+1, '…', total];
}

// ── View toggle ────────────────────────────────────────────────────────────
function switchView(v) {
    currentView = v;
    document.getElementById('listView').style.display  = v === 'list'  ? 'flex' : 'none';
    document.getElementById('tableView').style.display = v === 'table' ? ''     : 'none';
    document.getElementById('vBtn-list').classList.toggle('active',  v === 'list');
    document.getElementById('vBtn-table').classList.toggle('active', v === 'table');
    if (v === 'table') renderFloorMap();
}

// ── Floor map ──────────────────────────────────────────────────────────────
function renderFloorMap() {
    const openOrders = allOrders.filter(o => o.status === 'open' && o.table_number);
    const occupiedTables = new Set(openOrders.map(o => o.table_number));
    const billedTables   = new Set(allOrders.filter(o => (o.status === 'paid') && o.table_number
                                      && new Date(o.date_created).toDateString() === new Date().toDateString())
                                   .map(o => o.table_number));

    // Get max table number from orders or default 12
    const maxTable = Math.max(12, ...allOrders.filter(o => o.table_number).map(o => o.table_number));
    const grid = document.getElementById('tableGrid');

    grid.innerHTML = Array.from({ length: maxTable }, (_, i) => {
        const n = i + 1;
        const occupied = occupiedTables.has(n);
        const billed   = billedTables.has(n);
        const cls      = occupied ? 't-occupied' : billed ? 't-billed' : 't-free';
        const icon     = occupied ? '🍽️' : billed ? '🧾' : '🪑';
        const lbl      = occupied ? 'Occupied' : billed ? 'Billed' : 'Free';
        const order    = occupied ? openOrders.find(o => o.table_number === n) : null;
        return `<div class="table-tile ${cls}" onclick="filterByTable(${n})">
            <div class="t-icon">${icon}</div>
            <div class="t-name">T${n}</div>
            <div class="t-pax">${lbl}</div>
            ${order ? `<div class="t-order">${esc(order.order_number)}</div>` : ''}
        </div>`;
    }).join('');
}

function filterByTable(n) {
    switchView('list');
    const q = document.getElementById('orderSearch');
    q.value = `T${n}`;
    applyFilters();
    showToast(`Showing orders for Table ${n}`, 'info');
}

// ── Open Detail Panel ──────────────────────────────────────────────────────
async function openPanel(orderId) {
    currentOrderId = orderId;

    // Optimistic: find in local data first
    const localOrder = allOrders.find(o => o.id === orderId);
    if (localOrder && localOrder.items) {
        currentOrderData = structuredClone(localOrder);
        renderPanel(currentOrderData);
    }

    // Always fetch full data (includes all items)
    try {
        const res = await fetch(`/api/orders/${orderId}`);
        if (!res.ok) throw new Error();
        currentOrderData = await res.json();
        renderPanel(currentOrderData);
    } catch {
        if (!localOrder) { showToast('Could not load order details', 'error'); return; }
    }

    document.getElementById('detailPanel').classList.add('open');
    document.getElementById('panelBackdrop').classList.add('open');
}

function renderPanel(data) {
    const isOpen = (data.status || 'paid') === 'open';

    // Header
    setText('dpOrderNum', data.order_number);

    const sb = document.getElementById('dpStatus');
    sb.textContent = data.status || 'paid';
    sb.className   = `dp-status-badge sp-${data.status || 'paid'}`;

    const tb = document.getElementById('dpType');
    const oType = (data.order_type || 'takeaway').toLowerCase();
    tb.textContent = data.table_number ? `Table ${data.table_number}` : ucfirst(oType);
    tb.className   = `dp-type-badge otype-${oType}`;

    // Meta
    setText('dpTime',     data.date_created || '—');
    setText('dpCustomer', data.customer_name || 'Walk-in');
    setText('dpMethod',   data.payment_method || '—');

    // Add item section
    document.getElementById('addItemSection').style.display  = isOpen ? '' : 'none';
    document.getElementById('discountRow').style.display     = isOpen ? 'flex' : 'none';
    document.getElementById('notesSection').style.display    = isOpen ? '' : 'none';

    // Notes
    if (isOpen) {
        document.getElementById('orderNotes').value = data.notes || '';
    }

    // Items
    const container = document.getElementById('dpItemsContainer');
    if (!data.items || data.items.length === 0) {
        container.innerHTML = '<div style="padding:24px;text-align:center;color:var(--slate-400);font-size:.82rem">No items</div>';
    } else {
        container.innerHTML = data.items.map(item => `
            <div class="dp-item-row" id="item-row-${item.id}">
                <div>
                    <div class="dp-item-name" title="${esc(item.product_name)}">${esc(item.product_name)}</div>
                    <div class="dp-item-price">₹${fmtNum(item.price)} each</div>
                </div>
                <div class="dp-qty-ctrl">
                    ${isOpen
                        ? `<button class="dp-qty-btn" onclick="changeQty(${item.id},-1)">−</button>
                           <span class="dp-qty-num" id="qty-${item.id}">${item.quantity}</span>
                           <button class="dp-qty-btn" onclick="changeQty(${item.id},1)">+</button>`
                        : `<span class="dp-qty-static">×${item.quantity}</span>`
                    }
                </div>
                <div class="dp-item-total" id="line-${item.id}">₹${fmtNum(item.price * item.quantity)}</div>
            </div>
        `).join('');
    }

    // Discount inputs
    if (isOpen && data.discount > 0) {
        document.getElementById('discountVal').value = data.discount;
    }

    recalcPanel();
    renderPanelActions(data);
}

function recalcPanel() {
    const items = currentOrderData?.items || [];
    const sub   = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const tax   = sub * 0.05;
    const dv    = parseFloat(document.getElementById('discountVal')?.value || 0) || 0;
    const dt    = document.getElementById('discountType')?.value || 'flat';
    const disc  = dt === 'pct' ? sub * dv / 100 : dv;
    const total = Math.max(0, sub + tax - disc);

    setText('dpSubtotal', '₹' + fmtNum(sub));
    setText('dpTax',      '₹' + fmtNum(tax));
    setText('dpDiscount', disc > 0 ? '−₹' + fmtNum(disc) : '₹0.00');
    setText('dpTotal',    '₹' + fmtNum(total));
}

function changeQty(itemId, delta) {
    if (!currentOrderData) return;
    const item = currentOrderData.items.find(i => i.id === itemId);
    if (!item) return;
    item.quantity = Math.max(0, item.quantity + delta);
    if (item.quantity === 0) {
        currentOrderData.items = currentOrderData.items.filter(i => i.id !== itemId);
        document.getElementById(`item-row-${itemId}`)?.remove();
    } else {
        setText(`qty-${itemId}`,  item.quantity);
        setText(`line-${itemId}`, '₹' + fmtNum(item.price * item.quantity));
    }
    recalcPanel();
}

function renderPanelActions(data) {
    const el     = document.getElementById('dpActions');
    const isOpen = (data.status || 'paid') === 'open';
    el.innerHTML = isOpen
        ? `<button class="dp-btn dp-btn-checkout" onclick="openCheckoutModal()">
               <i class="fa-solid fa-cash-register"></i>Checkout
           </button>
           <button class="dp-btn dp-btn-save" onclick="saveEdits()" title="Save changes">
               <i class="fa-solid fa-floppy-disk"></i>
           </button>
           <button class="dp-btn dp-btn-kot" onclick="printKOT()" title="Kitchen ticket">
               <i class="fa-solid fa-utensils"></i>
           </button>
           <button class="dp-btn dp-btn-void" onclick="promptVoid(${data.id})" title="Void order">
               <i class="fa-solid fa-ban"></i>
           </button>`
        : `<button class="dp-btn dp-btn-reprint" style="flex:1" onclick="printOrder(${data.id})">
               <i class="fa-solid fa-print"></i>Re-print Receipt
           </button>
           <button class="dp-btn dp-btn-del" onclick="openDeleteModal(${data.id},'${esc(data.order_number)}')" title="Delete">
               <i class="fa-regular fa-trash-can"></i>
           </button>`;
}

function closePanel() {
    document.getElementById('detailPanel').classList.remove('open');
    document.getElementById('panelBackdrop').classList.remove('open');
    document.getElementById('addItemResults').innerHTML = '';
    document.getElementById('addItemSearch').value = '';
    currentOrderId   = null;
    currentOrderData = null;
}

// ── Add product to open order ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('addItemSearch').addEventListener('input', function () {
        const q   = this.value.toLowerCase();
        const el  = document.getElementById('addItemResults');
        if (!q) { el.innerHTML = ''; return; }

        const hits = allProducts.filter(p => p.name.toLowerCase().includes(q) ||
                                             p.category.toLowerCase().includes(q)).slice(0, 8);
        el.innerHTML = hits.length
            ? hits.map(p => `
                <div class="dp-result-item" onclick="addProductToOrder(${p.id},'${esc(p.name)}',${p.price})">
                    <div>
                        <div class="dp-result-name">${esc(p.name)}</div>
                        <div class="dp-result-cat">${esc(p.category)}</div>
                    </div>
                    <div class="dp-result-price">₹${fmtNum(p.price)}</div>
                </div>`).join('')
            : '<div style="padding:12px;text-align:center;color:var(--slate-400);font-size:.8rem">No products found</div>';
    });
});

function addProductToOrder(pid, pname, price) {
    if (!currentOrderData) return;
    const existing = currentOrderData.items.find(i => i.product_id === pid);
    if (existing) {
        changeQty(existing.id, 1);
    } else {
        const newId = Date.now();
        currentOrderData.items.push({ id: newId, product_id: pid, product_name: pname, price, quantity: 1 });
        renderPanel(currentOrderData);
    }
    document.getElementById('addItemSearch').value = '';
    document.getElementById('addItemResults').innerHTML = '';
    showToast(`${pname} added`, 'success');
}

// ── Save edits ─────────────────────────────────────────────────────────────
async function saveEdits() {
    if (!currentOrderData) return;
    const dv   = parseFloat(document.getElementById('discountVal')?.value || 0) || 0;
    const dt   = document.getElementById('discountType')?.value || 'flat';
    const sub  = currentOrderData.items.reduce((s, i) => s + i.price * i.quantity, 0);
    const disc = dt === 'pct' ? sub * dv / 100 : dv;
    const notes = document.getElementById('orderNotes')?.value || '';

    const payload = {
        discount: disc,
        notes,
        items: currentOrderData.items.map(i => ({
            product_id:   i.product_id || null,
            product_name: i.product_name,
            price:        i.price,
            quantity:     i.quantity
        }))
    };

    try {
        const res = await fetch(`/api/orders/${currentOrderId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error();
        showToast('Order saved ✓', 'success');
        await loadOrders();
    } catch {
        showToast('Failed to save order', 'error');
    }
}

// ── Checkout ───────────────────────────────────────────────────────────────
function openCheckoutModal() {
    if (!currentOrderData) return;
    const items  = currentOrderData.items;
    const sub    = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const tax    = sub * 0.05;
    const dv     = parseFloat(document.getElementById('discountVal')?.value || 0) || 0;
    const dt     = document.getElementById('discountType')?.value || 'flat';
    const disc   = dt === 'pct' ? sub * dv / 100 : dv;
    const total  = Math.max(0, sub + tax - disc);

    document.getElementById('checkoutSummary').innerHTML = `
        <strong>${items.length} item${items.length !== 1 ? 's' : ''}</strong><br>
        Subtotal: ₹${fmtNum(sub)} &nbsp;·&nbsp; Tax: ₹${fmtNum(tax)}&nbsp;
        ${disc > 0 ? `&nbsp;·&nbsp; Discount: −₹${fmtNum(disc)}` : ''}<br>
        <span style="font-family:'Plus Jakarta Sans';font-size:1.05rem;font-weight:800;color:var(--slate-900)">
            Total: ₹${fmtNum(total)}
        </span>`;

    // Reset pay method selection
    document.querySelectorAll('.pay-method-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.pay-method-btn[data-method="Cash"]')?.classList.add('active');
    checkoutPayMethod = 'Cash';

    new bootstrap.Modal(document.getElementById('checkoutModal')).show();
}

function initPayMethodBtns() {
    document.querySelectorAll('.pay-method-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.pay-method-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            checkoutPayMethod = btn.dataset.method;
        });
    });
}

async function confirmCheckout() {
    if (!currentOrderId) return;
    await saveEdits();   // persist any item edits first
    try {
        const res = await fetch(`/api/orders/${currentOrderId}/checkout`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ payment_method: checkoutPayMethod })
        });
        if (!res.ok) throw new Error();
        bootstrap.Modal.getInstance(document.getElementById('checkoutModal'))?.hide();
        closePanel();
        showToast('Order checked out ✓', 'success');
        await loadOrders();
    } catch {
        showToast('Checkout failed', 'error');
    }
}

// ── KOT / Print ────────────────────────────────────────────────────────────
function printKOT() {
    showToast('Kitchen ticket sent to printer 🍳', 'info');
    // Extend: POST to /api/orders/{id}/kot when kitchen printer route exists
}

function printOrder(id) {
    showToast('Printing receipt…', 'info');
    // Extend: POST to /api/orders/{id}/print
}

// ── Void ───────────────────────────────────────────────────────────────────
function promptVoid(id) {
    pendingVoidId = id;
    pinBuffer = '';
    updatePinDots();
    document.getElementById('pinError').style.display = 'none';
    new bootstrap.Modal(document.getElementById('voidPinModal')).show();
}

function buildPinPad() {
    const pad = document.getElementById('pinPad');
    if (!pad) return;
    const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫'];
    pad.innerHTML = keys.map(k => {
        if (k === '') return '<div></div>';
        return `<button class="pin-key${k === '⌫' ? ' del-key' : ''}" onclick="pinKey('${k}')">${k}</button>`;
    }).join('');
}

function pinKey(k) {
    if (k === '⌫') {
        pinBuffer = pinBuffer.slice(0, -1);
    } else if (pinBuffer.length < 4) {
        pinBuffer += k;
    }
    updatePinDots();
    if (pinBuffer.length === 4) setTimeout(checkPin, 120);
}

function updatePinDots() {
    document.querySelectorAll('#pinDots span').forEach((dot, i) => {
        dot.classList.toggle('filled', i < pinBuffer.length);
    });
}

async function checkPin() {
    // TODO: compare against settings.admin_pin from API
    const ADMIN_PIN = '1234';
    if (pinBuffer !== ADMIN_PIN) {
        document.getElementById('pinError').style.display = 'flex';
        pinBuffer = '';
        updatePinDots();
        return;
    }
    bootstrap.Modal.getInstance(document.getElementById('voidPinModal'))?.hide();
    try {
        const res = await fetch(`/api/orders/${pendingVoidId}/void`, { method: 'PATCH' });
        if (!res.ok) throw new Error();
        showToast('Order voided', 'info');
        closePanel();
        await loadOrders();
    } catch {
        showToast('Failed to void order', 'error');
    }
    pendingVoidId = null;
}

// ── Delete ─────────────────────────────────────────────────────────────────
function openDeleteModal(id, num) {
    pendingDeleteId  = id;
    pendingDeleteNum = num;
    setText('deleteDesc', `Order "${num}" will be permanently removed. This cannot be undone.`);
    document.getElementById('confirmDeleteBtn').onclick = execDelete;
    new bootstrap.Modal(document.getElementById('deleteModal')).show();
}

async function execDelete() {
    bootstrap.Modal.getInstance(document.getElementById('deleteModal'))?.hide();
    if (!pendingDeleteId) return;
    try {
        const res = await fetch(`/api/orders/${pendingDeleteId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error();
        showToast(`Order ${pendingDeleteNum} deleted`, 'success');
        closePanel();
        await loadOrders();
    } catch {
        showToast('Delete failed', 'error');
    }
    pendingDeleteId = null;
}

// ── Export ─────────────────────────────────────────────────────────────────
function exportOrders() {
    const rows = [['Order#', 'Date', 'Table', 'Customer', 'Items', 'Total', 'Method', 'Status']];
    filteredOrders.forEach(o => {
        rows.push([
            o.order_number,
            o.date_created,
            o.table_number || '',
            o.customer_name || '',
            o.item_count || '',
            o.total_amount,
            o.payment_method,
            o.status || 'paid'
        ]);
    });
    const csv  = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.href     = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    link.download = `orders_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    showToast('CSV exported ✓', 'success');
}

// ── Toast ──────────────────────────────────────────────────────────────────
function showToast(msg, type = 'success') {
    const stack = document.getElementById('toastStack');
    if (!stack) return;
    const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
    const toast = document.createElement('div');
    toast.className = `toast-item${type === 'error' ? ' error' : ''}`;
    toast.innerHTML = `<span class="toast-icon">${icons[type] || '•'}</span>${esc(msg)}`;
    stack.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'toastIn .3s var(--ease-spring) reverse';
        toast.addEventListener('animationend', () => toast.remove(), { once: true });
    }, 2800);
}

// ── Utils ──────────────────────────────────────────────────────────────────
function esc(str) {
    return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}
function fmtNum(n) {
    return Number(n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
function ucfirst(s) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
function makeEl(tag, cls, html) {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    el.innerHTML = html;
    return el;
}