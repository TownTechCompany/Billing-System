let allOrders = [];
let dtTable = null;
let pendingDelete = null;

document.addEventListener('DOMContentLoaded', () => {
    initDT();
    loadOrders();
    document.getElementById('searchInput').addEventListener('input', e => dtTable.search(e.target.value).draw());
    document.getElementById('filterPayment').addEventListener('change', applyFilters);
});

function initDT() {
    dtTable = $('#ordersTable').DataTable({
        dom: 't<"dt-footer-row"<"dataTables_info"i><"dataTables_paginate"p>>',
        pagingType: 'simple_numbers',
        pageLength: 15,
        language: {
            info: 'Showing _START_–_END_ of _TOTAL_ orders',
            paginate: { previous: '<i class="fa-solid fa-chevron-left"></i>', next: '<i class="fa-solid fa-chevron-right"></i>' },
            emptyTable: '<div style="padding:48px 0;color:#94a3b8;font-size:0.83rem;">No orders yet.</div>'
        },
        columnDefs: [{ orderable: false, targets: [5] }],
        order: [[1, 'desc']]
    });
}

async function loadOrders() {
    try {
        const r = await fetch('/api/orders');
        allOrders = await r.json();
        renderTable(allOrders);
        document.getElementById('countBadge').textContent = allOrders.length;
    } catch { showToast('Failed to load orders', 'error'); }
}

function applyFilters() {
    const pay = document.getElementById('filterPayment').value.toLowerCase();
    $.fn.dataTable.ext.search = [];
    if (pay) {
        $.fn.dataTable.ext.search.push((settings, data) => {
            if (settings.nTable.id !== 'ordersTable') return true;
            return data[3].toLowerCase().includes(pay);
        });
    }
    dtTable.draw();
}

function renderTable(orders) {
    dtTable.clear();
    orders.forEach(o => {
        const d = new Date(o.date_created);
        const payLower = (o.payment_method || 'cash').toLowerCase();
        const safe = String(o.order_number).replace(/'/g, "\\'");
        dtTable.row.add([
            `<span class="order-num">${escHtml(o.order_number)}</span>`,
            `<div class="order-date">${d.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</div>
             <div class="order-time">${d.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</div>`,
            `<span class="items-badge">${o.item_count}</span>`,
            `<span class="status-pill status-${payLower}">${escHtml(o.payment_method)}</span>`,
            `<span class="total-val">₹${Number(o.total_amount).toFixed(2)}</span>`,
            `<div class="action-btn-group" style="justify-content:flex-end;">
                <button class="act-btn delete" onclick="openDeleteModal(${o.id},'${safe}')" title="Delete"><i class="fa-regular fa-trash-can"></i></button>
             </div>`
        ]);
    });
    dtTable.draw();
}

function openDeleteModal(id, num) {
    pendingDelete = id;
    document.getElementById('deleteDesc').textContent = `Order "${num}" will be permanently removed.`;
    document.getElementById('confirmDeleteBtn').onclick = execDelete;
    new bootstrap.Modal(document.getElementById('deleteModal')).show();
}

async function execDelete() {
    bootstrap.Modal.getInstance(document.getElementById('deleteModal'))?.hide();
    if (!pendingDelete) return;
    try {
        const res = await fetch(`/api/orders/${pendingDelete}`, { method: 'DELETE' });
        if (!res.ok) throw new Error();
        showToast('Order deleted ✓', 'success');
        await loadOrders();
    } catch { showToast('Delete failed', 'error'); }
    pendingDelete = null;
}
