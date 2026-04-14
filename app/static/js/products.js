let allProducts = [];
let dtTable = null;
let pendingDelete = null;

document.addEventListener('DOMContentLoaded', () => {
    initDT();
    loadProducts();
    document.getElementById('searchInput').addEventListener('input', e => dtTable.search(e.target.value).draw());
    document.getElementById('filterCategory').addEventListener('change', applyFilters);
    document.getElementById('fImage').addEventListener('change', previewImage);
});

function initDT() {
    dtTable = $('#productsTable').DataTable({
        dom: 't<"dt-footer-row"<"dataTables_info"i><"dataTables_paginate"p>>',
        pagingType: 'simple_numbers',
        pageLength: 10,
        language: {
            info: 'Showing _START_–_END_ of _TOTAL_ products',
            paginate: { previous: '<i class="fa-solid fa-chevron-left"></i>', next: '<i class="fa-solid fa-chevron-right"></i>' },
            emptyTable: '<div style="padding:48px 0;color:#94a3b8;font-size:0.83rem;">No products yet — add your first one.</div>'
        },
        columnDefs: [{ orderable: false, targets: [0, 4] }],
        order: [[1, 'asc']]
    });
}

async function loadProducts() {
    try {
        const r = await fetch('/products');
        allProducts = await r.json();
        renderTable(allProducts);
        populateCategories(allProducts);
        document.getElementById('countBadge').textContent = allProducts.length;
    } catch { showToast('Failed to load products', 'error'); }
}

function populateCategories(products) {
    const sel = document.getElementById('filterCategory');
    const current = sel.value;
    const cats = [...new Set(products.map(p => p.category))].sort();
    sel.innerHTML = '<option value="">All Categories</option>' + cats.map(c => `<option value="${escHtml(c)}">${escHtml(c)}</option>`).join('');
    sel.value = current;
}

function applyFilters() {
    const cat = document.getElementById('filterCategory').value.toLowerCase();
    $.fn.dataTable.ext.search = [];
    if (cat) {
        $.fn.dataTable.ext.search.push((settings, data) => {
            if (settings.nTable.id !== 'productsTable') return true;
            return data[2].toLowerCase().includes(cat);
        });
    }
    dtTable.draw();
}

function renderTable(products) {
    dtTable.clear();
    products.forEach(p => {
        const imgHtml = p.image && p.image !== 'placeholder.png'
            ? `<img src="${escHtml(p.image)}" class="img-preview" onerror="this.outerHTML='<div class=img-placeholder><i class=fa-solid fa-image></i></div>'">`
            : `<div class="img-placeholder"><i class="fa-solid fa-image"></i></div>`;
        const safe = String(p.name).replace(/'/g, "\\'");
        dtTable.row.add([
            imgHtml,
            `<span class="product-name">${escHtml(p.name)}</span>`,
            `<span class="category-pill">${escHtml(p.category)}</span>`,
            `<span class="price-badge">₹${Number(p.price).toFixed(2)}</span>`,
            `<div class="action-btn-group" style="justify-content:flex-end;">
                <button class="act-btn edit" onclick="openEditModal(${p.id})" title="Edit"><i class="fa-solid fa-pen"></i></button>
                <button class="act-btn delete" onclick="openDeleteModal(${p.id},'${safe}')" title="Delete"><i class="fa-regular fa-trash-can"></i></button>
             </div>`
        ]);
    });
    dtTable.draw();
}

function previewImage() {
    const file = document.getElementById('fImage').files[0];
    if (!file) return;
    const wrap = document.getElementById('imagePreviewWrap');
    const img = document.getElementById('imagePreview');
    img.src = URL.createObjectURL(file);
    wrap.style.display = 'block';
}

function openAddModal() {
    document.getElementById('editId').value = '';
    document.getElementById('modalTitle').textContent = 'New Product';
    document.getElementById('saveLabel').textContent = 'Create Product';
    document.getElementById('fName').value = '';
    document.getElementById('fCategory').value = '';
    document.getElementById('fPrice').value = '';
    document.getElementById('fImage').value = '';
    document.getElementById('imagePreviewWrap').style.display = 'none';
    new bootstrap.Modal(document.getElementById('productModal')).show();
}

function openEditModal(id) {
    const p = allProducts.find(x => x.id === id);
    if (!p) return;
    document.getElementById('editId').value = p.id;
    document.getElementById('modalTitle').textContent = 'Edit Product';
    document.getElementById('saveLabel').textContent = 'Save Changes';
    document.getElementById('fName').value = p.name;
    document.getElementById('fCategory').value = p.category;
    document.getElementById('fPrice').value = p.price;
    document.getElementById('fImage').value = '';
    const wrap = document.getElementById('imagePreviewWrap');
    const img = document.getElementById('imagePreview');
    if (p.image && p.image !== 'placeholder.png') { img.src = p.image; wrap.style.display = 'block'; }
    else { wrap.style.display = 'none'; }
    new bootstrap.Modal(document.getElementById('productModal')).show();
}

async function saveProduct() {
    const id = document.getElementById('editId').value;
    const name = document.getElementById('fName').value.trim();
    const category = document.getElementById('fCategory').value.trim();
    const price = document.getElementById('fPrice').value;
    if (!name || !category || !price) { showToast('Please fill all required fields', 'error'); return; }

    const fd = new FormData();
    fd.append('name', name);
    fd.append('category', category);
    fd.append('price', price);
    const fileInput = document.getElementById('fImage');
    if (fileInput.files[0]) fd.append('image', fileInput.files[0]);

    try {
        const isEdit = !!id;
        const res = await fetch(isEdit ? ` /products/${id}` : '/products', { method: isEdit ? 'PUT' : 'POST', body: fd });
        if (!res.ok) throw new Error();
        bootstrap.Modal.getInstance(document.getElementById('productModal'))?.hide();
        showToast(isEdit ? 'Product updated ✓' : 'Product created ✓', 'success');
        await loadProducts();
    } catch { showToast('Something went wrong', 'error'); }
}

function openDeleteModal(id, name) {
    pendingDelete = id;
    document.getElementById('deleteDesc').textContent = `"${name}" will be permanently removed.`;
    document.getElementById('confirmDeleteBtn').onclick = execDelete;
    new bootstrap.Modal(document.getElementById('deleteModal')).show();
}

async function execDelete() {
    bootstrap.Modal.getInstance(document.getElementById('deleteModal'))?.hide();
    if (!pendingDelete) return;
    try {
        const res = await fetch(` /products/${pendingDelete}`, { method: 'DELETE' });
        if (!res.ok) throw new Error();
        showToast('Product deleted ✓', 'success');
        await loadProducts();
    } catch { showToast('Delete failed', 'error'); }
    pendingDelete = null;
}
