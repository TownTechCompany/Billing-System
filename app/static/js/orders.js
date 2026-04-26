/* ════════════════════════════════════════════════
   orders.js — Order Management
   ════════════════════════════════════════════════ */

'use strict';

// ── State ──────────────────────────────────────────────────────────────────
let allOrders    = [];
let filteredOrders = [];
let allProducts  = [];
let currentView  = 'cards';
let lastOrderView = 'cards';
let activeFilter = 'all';
let activeTypeFilter = 'all';
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
    initTypeChips();
    initDatePicker();
    buildPinPad();
    initPayMethodBtns();
    loadOrders();
    loadProducts();
});

// ── Load Orders ────────────────────────────────────────────────────────────
function loadOrders() {
    $.ajax({
        url: '/orders/get-orders',
        type: 'GET',
        dataType: 'json',
        success: function(json) {
            allOrders = json.data || [];
            calcStats();
            applyFilters();
        },
        error: function(xhr, status, e) {
            showToast('Failed to load orders', 'error');
            console.error(e);
        }
    });
}

// ── Load Products ──────────────────────────────────────────────────────────
function loadProducts() {
    $.ajax({
        url: '/products/get-products',
        type: 'GET',
        dataType: 'json',
        success: function(json) {
            allProducts = json.data || [];
        },
        error: function() {
            /* non-fatal */
        }
    });
}

// ── Stats ──────────────────────────────────────────────────────────────────
function calcStats() {
    const today = new Date().toDateString();
    let open = 0, paid = 0, rev = 0;

    for (let i = 0; i < allOrders.length; i++) {
        const o = allOrders[i];
        const oDate = new Date(o.date_created).toDateString();
        if (o.status === 'open') open++;
        if (o.status === 'paid' && oDate === today) { paid++; rev += o.total_amount; }
    }

    const todayOrders = allOrders.filter(o => new Date(o.date_created).toDateString() === today);
    // setText('headerOrderCount', `${todayOrders.length} order${todayOrders.length !== 1 ? 's' : ''} today`);
    $('#headerOrderCount').text(todayOrders.length);
}

// ── Order Type Chips ───────────────────────────────────────────────────────
function initTypeChips() {
    const chips = $('.type-chip');
    chips.off('click').on('click', function() {
        chips.removeClass('active');
        $(this).addClass('active');
        activeTypeFilter = $(this).data('type');
        currentPage = 1;
        applyFilters();
    });
}

// ── Search (Disabled in new design) ─────────────────────────────────────────
function initSearch() {}

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
    const q = ($('#orderSearch').val() || '').toLowerCase().trim();
    
    // Auto-detect from input if not passed
    if (!dateFrom || !dateTo) {
        const dp = document.querySelector("#orderDateRange")?._flatpickr;
        if (dp && dp.selectedDates.length === 2) {
            dateFrom = new Date(dp.selectedDates[0]);
            dateTo = new Date(dp.selectedDates[1]);
            dateFrom.setHours(0,0,0,0);
            dateTo.setHours(23,59,59,999);
        }
    }

    filteredOrders = allOrders.filter(o => {
        // status
        if (activeFilter !== 'all' && (o.status || 'paid') !== activeFilter) return false;
        
        // type
        if (activeTypeFilter !== 'all' && (o.order_type || 'dine-in') !== activeTypeFilter) return false;
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

    // Update Filter UI status (Elements removed in new design, safe call)
    const hasRange = dateFrom && dateTo;
    $('#filterDot').css('display', hasRange ? 'block' : 'none');
    $('#filterBtn').toggleClass('active', !!hasRange);

    // headerOrderCount removed from HTML

    if (currentView === 'cards') renderCards();
    else if (currentView === 'list') renderTable();
    if (currentView === 'table') renderFloorMap();
}

// ── Tab Switcher ───────────────────────────────────────────────────────────
function switchMainTab(view) {
    $('.tab-btn').removeClass('active');
    $(`#mainTab-${view}`).addClass('active');
    
    if (view === 'orders') {
        currentView = 'cards';
        $('#tableView').hide();
        $('#cardsView').show();
        renderCards();
    } else {
        currentView = 'table';
        $('#cardsView').hide();
        $('#tableView').show();
        renderFloorMap();
    }
}

// ── Filter Sheet ───────────────────────────────────────────────────────────
function openFilterSheet() {
    $('#filterOverlay').addClass('open');
    $('#filterSheet').addClass('open');
    document.body.style.overflow = 'hidden';
}

function closeFilterSheet() {
    $('#filterOverlay').removeClass('open');
    $('#filterSheet').removeClass('open');
    document.body.style.overflow = '';
}

function resetAllFilters() {
    activeFilter = 'all';
    $('#statusChips .chip').removeClass('active');
    $('#statusChips .chip[data-filter="all"]').addClass('active');
    
    $('#orderSearch').val('');
    
    const dp = document.querySelector("#orderDateRange")?._flatpickr;
    if (dp) dp.clear();
    
    currentPage = 1;
    applyFilters();
    closeFilterSheet();
}

// ── Render table ───────────────────────────────────────────────────────────
function renderTable() {
    const tbody = $('#ordersBody');
    const empty = $('#emptyState');

    const total = filteredOrders.length;
    const start = (currentPage - 1) * PAGE_SIZE;
    const page  = filteredOrders.slice(start, start + PAGE_SIZE);

    if (total === 0) {
        tbody.empty();
        empty.css('display', 'flex');
        renderPagination(0);
        return;
    }
    empty.hide();

    tbody.html(page.map(o => {
        const status  = o.status || 'paid';
        const dotCls  = `row-dot row-dot-${status}`;
        const pillCls = `status-pill sp-${status}`;
        const pMethod = (o.payment_method || 'cash').toLowerCase().replace('/', '').replace(' ', '');
        const payCls  = `status-pill status-${pMethod}`;
        const oType   = normalizeOrderType(o.order_type || 'takeaway');
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
    }).join(''));

    renderPagination(total);
}

// ── Pagination ─────────────────────────────────────────────────────────────
function renderPagination(total) {
    const totalPages = Math.ceil(total / PAGE_SIZE);
    const start = Math.min((currentPage - 1) * PAGE_SIZE + 1, total);
    const end   = Math.min(currentPage * PAGE_SIZE, total);

    const btns = $('#paginBtns');
    btns.empty();

    if (totalPages <= 1) return;

    const prev = makeEl('button', 'pagin-btn', '<i class="fa-solid fa-chevron-left"></i>');
    prev.disabled = currentPage === 1;
    prev.onclick = () => { currentPage--; renderTable(); };
    btns.append(prev);

    // Show max 5 page numbers
    const pages = buildPageRange(currentPage, totalPages);
    for (let i = 0; i < pages.length; i++) {
        const p = pages[i];
        if (p === '…') {
            const sp = makeEl('span', '', '…');
            sp.style.cssText = 'padding:0 4px;color:var(--slate-400);font-size:.77rem;display:flex;align-items:center';
            btns.append(sp);
        } else {
            const btn = makeEl('button', `pagin-btn${p === currentPage ? ' active' : ''}`, String(p));
            btn.onclick = () => { currentPage = p; renderTable(); };
            btns.append(btn);
        }
    }

    const next = makeEl('button', 'pagin-btn', '<i class="fa-solid fa-chevron-right"></i>');
    next.disabled = currentPage === totalPages;
    next.onclick = () => { currentPage++; renderTable(); };
    btns.append(next);
}

function buildPageRange(cur, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (cur <= 4) return [1, 2, 3, 4, 5, '…', total];
    if (cur >= total - 3) return [1, '…', total-4, total-3, total-2, total-1, total];
    return [1, '…', cur-1, cur, cur+1, '…', total];
}

function switchMainTab(tab) {
    if (tab === 'orders') {
        switchView(lastOrderView);
    } else {
        switchView('table');
    }
}

// ── Render Cards ───────────────────────────────────────────────────────────
function renderCards() {
    const grid  = $('#ordersCardGrid');
    const empty = $('#emptyStateCards');

    const total = filteredOrders.length;
    const start = (currentPage - 1) * PAGE_SIZE;
    const page  = filteredOrders.slice(start, start + PAGE_SIZE);

    if (total === 0) {
        grid.empty();
        empty.css('display', 'flex');
        renderCardPagination(0);
        return;
    }
    empty.hide();

    grid.html(page.map(o => {
        const status    = o.status || 'paid';
        const oType     = normalizeOrderType(o.order_type || 'dine-in');
        const typeLabel = oType.toUpperCase();
        
        const d       = new Date(o.date_created);
        const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase();
        
        const items   = o.items || [];

        const lineItemsHtml = items.map(item => {
            const qty   = item.quantity || 1;
            const price = item.price || 0;
            const name  = esc(item.product_name || item.name || 'Item');
            return `<div class="oc-line-item">
                <span class="oc-line-name">${qty}x ${name}</span>
                <span class="oc-line-price">$${fmtNum(price * qty)}</span>
            </div>`;
        }).join('');

        return `
        <div class="order-card" data-status="${status}" data-id="${o.id}" onclick="openPanel(${o.id})">
          <div class="oc-body">
            <div class="oc-header">
              <div class="oc-id-block">
                <div class="oc-id-label">ORDER ID</div>
                <div class="oc-order-num">#${esc(o.order_number)}</div>
              </div>
              <div class="oc-badges">
                <span class="oc-status-badge oc-status-${status}">${status}</span>
              </div>
            </div>

            <div class="oc-time-row">
              <i class="fa-regular fa-clock"></i>
              <span>${timeStr}</span>
              <span class="oc-time-sep">•</span>
              <span>Today</span>
              <span class="oc-time-sep">•</span>
              <span class="oc-type-label">${typeLabel}</span>
            </div>

            <div class="oc-created-by">
              <i class="fa-regular fa-user"></i>
              <span>Served by <span class="oc-creator-name">${esc(o.served_by || 'Admin')}</span></span>
            </div>

            <div class="oc-line-items">${lineItemsHtml}</div>

            <hr class="oc-dashed-divider">

            <div class="oc-footer" onclick="event.stopPropagation()">
              <button class="oc-del-btn" onclick="openDeleteModal(${o.id},'${esc(o.order_number)}')" title="Delete order">
                <i class="fa-regular fa-trash-can"></i>
              </button>
              <div class="oc-total-block">
                <div class="oc-total-label">TOTAL AMOUNT</div>
                <div class="oc-total-val">$${fmtNum(o.total_amount)}</div>
              </div>
            </div>
          </div>
        </div>`;
    }).join(''));

    renderCardPagination(total);

    // Close all dropdowns on outside click
    $(document).off('click.carddropdown').on('click.carddropdown', function() {
        $('.oc-dropdown').removeClass('open');
    });
}

function toggleCardMenu(btn) {
    const dd = $(btn).find('.oc-dropdown');
    const isOpen = dd.hasClass('open');
    $('.oc-dropdown').removeClass('open'); // close all
    if (!isOpen) dd.addClass('open');
}

function renderCardPagination(total) {
    const totalPages = Math.ceil(total / PAGE_SIZE);
    const start = Math.min((currentPage - 1) * PAGE_SIZE + 1, total);
    const end   = Math.min(currentPage * PAGE_SIZE, total);

    setText('paginInfoCards', total > 0 ? `Showing ${start}–${end} of ${total} orders` : '0 orders');
    setText('orderTotalLabel', `${total} order${total !== 1 ? 's' : ''}`);

    const btns = $('#paginBtnsCards');
    btns.empty();
    if (totalPages <= 1) return;

    const prev = makeEl('button', 'pagin-btn', '<i class="fa-solid fa-chevron-left"></i>');
    prev.disabled = currentPage === 1;
    prev.onclick = () => { currentPage--; renderCards(); };
    btns.append(prev);

    const pages = buildPageRange(currentPage, totalPages);
    for (let i = 0; i < pages.length; i++) {
        const p = pages[i];
        if (p === '…') {
            const sp = makeEl('span', '', '…');
            sp.style.cssText = 'padding:0 4px;color:var(--slate-400);font-size:.77rem;display:flex;align-items:center';
            btns.append(sp);
        } else {
            const btn2 = makeEl('button', `pagin-btn${p === currentPage ? ' active' : ''}`, String(p));
            btn2.onclick = () => { currentPage = p; renderCards(); };
            btns.append(btn2);
        }
    }

    const next = makeEl('button', 'pagin-btn', '<i class="fa-solid fa-chevron-right"></i>');
    next.disabled = currentPage === totalPages;
    next.onclick = () => { currentPage++; renderCards(); };
    btns.append(next);
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
    const grid = $('#tableGrid');

    grid.html(Array.from({ length: maxTable }, (_, i) => {
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
    }).join(''));
}

function filterByTable(n) {
    switchView('list');
    const q = $('#orderSearch');
    q.val(`T${n}`);
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
    $.ajax({
        url: `/orders/get-order-detail/${orderId}`,
        type: 'GET',
        dataType: 'json',
        success: function(json) {
            currentOrderData = json.data;
            renderPanel(currentOrderData);
        },
        error: function() {
            if (!localOrder) { showToast('Could not load order details', 'error'); return; }
        }
    });

    $('#detailPanel').addClass('open');
    $('#panelBackdrop').addClass('open');
}

function renderPanel(data) {
    const isOpen = (data.status || 'paid') === 'open';

    // Header
    setText('dpOrderNum', data.order_number);

    const sb = $('#dpStatus');
    sb.text(data.status || 'paid');
    sb.prop('className', `dp-status-badge sp-${data.status || 'paid'}`);

    const tb = $('#dpType');
    const oType = normalizeOrderType(data.order_type || 'takeaway');
    tb.text(data.table_number ? `Table ${data.table_number}` : ucfirst(oType));
    tb.prop('className', `dp-type-badge otype-${oType}`);

    // Meta
    setText('dpTime',     data.date_created || '—');
    setText('dpCustomer', data.customer_name || 'Walk-in');
    setText('dpMethod',   data.payment_method || '—');

    // Add item section
    $('#addItemSection').css('display', isOpen ? '' : 'none');
    $('#discountRow').css('display', isOpen ? 'flex' : 'none');
    $('#notesSection').css('display', isOpen ? '' : 'none');

    // Notes
    if (isOpen) {
        $('#orderNotes').val(data.notes || '');
    }

    // Items
    const container = $('#dpItemsContainer');
    if (!data.items || data.items.length === 0) {
        container.html('<div style="padding:24px;text-align:center;color:var(--slate-400);font-size:.82rem">No items</div>');
    } else {
        container.html(data.items.map(item => `
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
        `).join(''));
    }

    // Discount inputs
    if (isOpen && data.discount > 0) {
        $('#discountVal').val(data.discount);
    }

    recalcPanel();
    renderPanelActions(data);
}

function recalcPanel() {
    const items = currentOrderData?.items || [];
    const sub   = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const tax   = sub * 0.05;
    const dv    = parseFloat($('#discountVal').val() || 0) || 0;
    const dt    = $('#discountType').val() || 'flat';
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
        $(`#item-row-${itemId}`).remove();
    } else {
        setText(`qty-${itemId}`,  item.quantity);
        setText(`line-${itemId}`, '₹' + fmtNum(item.price * item.quantity));
    }
    recalcPanel();
}

function renderPanelActions(data) {
    const el     = $('#dpActions');
    const isOpen = (data.status || 'paid') === 'open';
    el.html(isOpen
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
           </button>`);
}

function closePanel() {
    $('#detailPanel').removeClass('open');
    $('#panelBackdrop').removeClass('open');
    $('#addItemResults').empty();
    $('#addItemSearch').val('');
    currentOrderId   = null;
    currentOrderData = null;
}

// ── Add product to open order ──────────────────────────────────────────────
$(document).ready(() => {
    $('#addItemSearch').on('input', function () {
        const q   = $(this).val().toLowerCase();
        const el  = $('#addItemResults');
        if (!q) { el.empty(); return; }

        const hits = allProducts.filter(p => p.name.toLowerCase().includes(q) ||
                                             p.category.toLowerCase().includes(q)).slice(0, 8);
        el.html(hits.length
            ? hits.map(p => `
                <div class="dp-result-item" onclick="addProductToOrder(${p.id},'${esc(p.name)}',${p.price})">
                    <div>
                        <div class="dp-result-name">${esc(p.name)}</div>
                        <div class="dp-result-cat">${esc(p.category)}</div>
                    </div>
                    <div class="dp-result-price">₹${fmtNum(p.price)}</div>
                </div>`).join('')
            : '<div style="padding:12px;text-align:center;color:var(--slate-400);font-size:.8rem">No products found</div>');
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
    $('#addItemSearch').val('');
    $('#addItemResults').empty();
    showToast(`${pname} added`, 'success');
}

// ── Save edits ─────────────────────────────────────────────────────────────
async function saveEdits() {
    if (!currentOrderData) return;
    const dv   = parseFloat($('#discountVal').val() || 0) || 0;
    const dt   = $('#discountType').val() || 'flat';
    const sub  = currentOrderData.items.reduce((s, i) => s + i.price * i.quantity, 0);
    const disc = dt === 'pct' ? sub * dv / 100 : dv;
    const notes = $('#orderNotes').val() || '';

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

    $.ajax({
        url: `/orders/update-order/${currentOrderId}`,
        type: 'PATCH',
        contentType: 'application/json',
        data: JSON.stringify(payload),
        success: function() {
            showToast('Order saved ✓', 'success');
            loadOrders();
        },
        error: function() {
            showToast('Failed to save order', 'error');
        }
    });
}

// ── Checkout ───────────────────────────────────────────────────────────────
/**
 * Open Checkout Modal
 * Can be called with an orderId (e.g. from card view) OR with no args (from detail panel)
 */
async function openCheckoutModal(orderId) {
    if (orderId) {
        currentOrderId = orderId;
        const localOrder = allOrders.find(o => o.id === orderId);
        if (localOrder && localOrder.items) {
            currentOrderData = structuredClone(localOrder);
            renderCheckoutModal();
        } else {
            // Fetch if not in local or missing items
            $.ajax({
                url: `/orders/get-order-detail/${orderId}`,
                type: 'GET',
                dataType: 'json',
                success: function(json) {
                    currentOrderData = json.data;
                    renderCheckoutModal();
                },
                error: function() {
                    showToast('Could not load order for checkout', 'error');
                }
            });
        }
    } else {
        if (!currentOrderData) return;
        renderCheckoutModal();
    }
}

function renderCheckoutModal() {
    if (!currentOrderData) return;
    const items  = currentOrderData.items || [];
    const sub    = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const tax    = sub * 0.05;
    const dv     = parseFloat($('#discountVal').val() || 0) || 0;
    const dt     = $('#discountType').val() || 'flat';
    const disc   = dt === 'pct' ? sub * dv / 100 : dv;
    const total  = Math.max(0, sub + tax - disc);

    $('#checkoutSummary').html(`
        <strong>${items.length} item${items.length !== 1 ? 's' : ''}</strong><br>
        Subtotal: ₹${fmtNum(sub)} &nbsp;·&nbsp; Tax: ₹${fmtNum(tax)}&nbsp;
        ${disc > 0 ? `&nbsp;·&nbsp; Discount: −₹${fmtNum(disc)}` : ''}<br>
        <span style="font-family:'Plus Jakarta Sans';font-size:1.05rem;font-weight:800;color:var(--slate-900)">
            Total: ₹${fmtNum(total)}
        </span>`);

    // Reset pay method selection
    $('.pay-method-btn').removeClass('active');
    $('.pay-method-btn[data-method="Cash"]').addClass('active');
    checkoutPayMethod = 'Cash';

    new bootstrap.Modal(document.getElementById('checkoutModal')).show();
}

function initPayMethodBtns() {
    const pgBtns = document.querySelectorAll('.pay-method-btn');
    for (let i = 0; i < pgBtns.length; i++) {
        const btn = pgBtns[i];
        btn.addEventListener('click', () => {
            for (let j = 0; j < pgBtns.length; j++) pgBtns[j].classList.remove('active');
            btn.classList.add('active');
            checkoutPayMethod = btn.dataset.method;
        });
    }
}

function confirmCheckout() {
    if (!currentOrderId) return;
    saveEdits();   // persist any item edits first
    $.ajax({
        url: `/orders/checkout-order/${currentOrderId}`,
        type: 'PATCH',
        contentType: 'application/json',
        data: JSON.stringify({ payment_method: checkoutPayMethod }),
        success: function() {
            bootstrap.Modal.getInstance(document.getElementById('checkoutModal'))?.hide();
            closePanel();
            showToast('Order checked out ✓', 'success');
            loadOrders();
        },
        error: function() {
            showToast('Checkout failed', 'error');
        }
    });
}

// ── KOT / Print ────────────────────────────────────────────────────────────
function printKOT() {
    showToast('Kitchen Ticket (KOT) sent to printer 🍳', 'info');
}



function printOrder(id) {
    showToast('Printing receipt…', 'info');
    // Extend: POST to  /orders/{id}/print
}

// ── Void ───────────────────────────────────────────────────────────────────
function promptVoid(id) {
    pendingVoidId = id;
    pinBuffer = '';
    updatePinDots();
    $('#pinError').hide();
    new bootstrap.Modal(document.getElementById('voidPinModal')).show();
}

function buildPinPad() {
    const pad = $('#pinPad');
    if (!pad.length) return;
    const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫'];
    pad.html(keys.map(k => {
        if (k === '') return '<div></div>';
        return `<button class="pin-key${k === '⌫' ? ' del-key' : ''}" onclick="pinKey('${k}')">${k}</button>`;
    }).join(''));
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
    const dots = document.querySelectorAll('#pinDots span');
    for (let i = 0; i < dots.length; i++) {
        dots[i].classList.toggle('filled', i < pinBuffer.length);
    }
}

async function checkPin() {
    // TODO: compare against settings.admin_pin from API
    const ADMIN_PIN = '1234';
    if (pinBuffer !== ADMIN_PIN) {
        $('#pinError').css('display', 'flex');
        pinBuffer = '';
        updatePinDots();
        return;
    }
    bootstrap.Modal.getInstance(document.getElementById('voidPinModal'))?.hide();
    $.ajax({
        url: `/orders/void-order/${pendingVoidId}`,
        type: 'PATCH',
        success: function() {
            showToast('Order voided', 'info');
            closePanel();
            loadOrders();
        },
        error: function() {
            showToast('Failed to void order', 'error');
        }
    });
    pendingVoidId = null;
}

// ── Delete ─────────────────────────────────────────────────────────────────
function openDeleteModal(id, num) {
    pendingDeleteId  = id;
    pendingDeleteNum = num;
    setText('deleteDesc', `Order "${num}" will be permanently removed. This cannot be undone.`);
    $('#confirmDeleteBtn').off('click').on('click', execDelete);
    new bootstrap.Modal(document.getElementById('deleteModal')).show();
}

async function execDelete() {
    bootstrap.Modal.getInstance(document.getElementById('deleteModal'))?.hide();
    if (!pendingDeleteId) return;
    $.ajax({
        url: `/orders/delete-order/${pendingDeleteId}`,
        type: 'DELETE',
        success: function() {
            showToast(`Order ${pendingDeleteNum} deleted`, 'success');
            closePanel();
            loadOrders();
        },
        error: function() {
            showToast('Delete failed', 'error');
        }
    });
    pendingDeleteId = null;
}

// ── Export ─────────────────────────────────────────────────────────────────
function exportOrders() {
    const rows = [['Order#', 'Date', 'Table', 'Customer', 'Items', 'Total', 'Method', 'Status']];
    for (let i = 0; i < filteredOrders.length; i++) {
        const o = filteredOrders[i];
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
    }
    const csv  = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.href     = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    link.download = `orders_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    showToast('CSV exported ✓', 'success');
}

// ── Toast ──────────────────────────────────────────────────────────────────
// Redundant showToast removed; using global script.js variant

// ── Utils ──────────────────────────────────────────────────────────────────
function esc(str) {
    return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function setText(id, val) {
    const el = $('#' + id);
    if (el.length) el.text(val);
}
function fmtNum(n) {
    return Number(n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
function ucfirst(s) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
function normalizeOrderType(type) {
    return String(type || 'takeaway').trim().toLowerCase().replace(/[_\s]+/g, '-');
}
function makeEl(tag, cls, html) {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    el.innerHTML = html;
    return el;
}