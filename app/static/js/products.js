let allProducts = [];
let dtTable = null;
let pendingDelete = null;

$(document).ready(() => {
    initDT();
    loadProducts();
    $('#searchInput').on('input', e => dtTable.search(e.target.value).draw());
    $('#filterCategory').on('change', applyFilters);
    $('#fImage').on('change', previewImage);
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

function loadProducts() {
    $.ajax({
        url: '/products/get-products',
        type: 'GET',
        dataType: 'json',
        success: function(json) {
            allProducts = json.data || [];
            renderTable(allProducts);
            populateCategories(allProducts);
            $('#countBadge').text(allProducts.length);
        },
        error: function() {
            showToast('Failed to load products', 'error');
        }
    });
}

function populateCategories(products) {
    const sel = $('#filterCategory');
    const current = sel.val();
    const cats = [...new Set(products.map(p => p.category))].sort();
    sel.html('<option value="">All Categories</option>' + cats.map(c => `<option value="${escHtml(c)}">${escHtml(c)}</option>`).join(''));
    sel.val(current);
}

function applyFilters() {
    const cat = $('#filterCategory').val().toLowerCase();
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
    for (let i = 0; i < products.length; i++) {
        const p = products[i];
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
    }
    dtTable.draw();
}

function previewImage() {
    const file = $('#fImage')[0].files[0];
    if (!file) return;
    const wrap = $('#imagePreviewWrap');
    const img = $('#imagePreview');
    img.attr('src', URL.createObjectURL(file));
    wrap.show();
}

function openAddModal() {
    $('#editId').val('');
    $('#modalTitle').text('New Product');
    $('#saveLabel').text('Create Product');
    $('#fName').val('');
    $('#fCategory').val('');
    $('#fPrice').val('');
    $('#fImage').val('');
    $('#imagePreviewWrap').hide();
    new bootstrap.Modal(document.getElementById('productModal')).show();
}

function openEditModal(id) {
    const p = allProducts.find(x => x.id === id);
    if (!p) return;
    $('#editId').val(p.id);
    $('#modalTitle').text('Edit Product');
    $('#saveLabel').text('Save Changes');
    $('#fName').val(p.name);
    $('#fCategory').val(p.category);
    $('#fPrice').val(p.price);
    $('#fImage').val('');
    const wrap = $('#imagePreviewWrap');
    const img = $('#imagePreview');
    if (p.image && p.image !== 'placeholder.png') { img.attr('src', p.image); wrap.show(); }
    else { wrap.hide(); }
    new bootstrap.Modal(document.getElementById('productModal')).show();
}

function saveProduct() {
    const id = $('#editId').val();
    const name = $('#fName').val().trim();
    const category = $('#fCategory').val().trim();
    const price = $('#fPrice').val();
    if (!name || !category || !price) { showToast('Please fill all required fields', 'error'); return; }

    const fd = new FormData();
    fd.append('name', name);
    fd.append('category', category);
    fd.append('price', price);
    const fileInput = $('#fImage')[0];
    if (fileInput.files[0]) fd.append('image', fileInput.files[0]);

    const isEdit = !!id;
    $.ajax({
        url: isEdit ? `/products/update-product/${id}` : '/products/create-product',
        type: isEdit ? 'PUT' : 'POST',
        data: fd,
        processData: false,
        contentType: false,
        success: function() {
            bootstrap.Modal.getInstance(document.getElementById('productModal'))?.hide();
            showToast(isEdit ? 'Product updated ✓' : 'Product created ✓', 'success');
            loadProducts();
        },
        error: function() {
            showToast('Something went wrong', 'error');
        }
    });
}

function openDeleteModal(id, name) {
    pendingDelete = id;
    $('#deleteDesc').text(`"${name}" will be permanently removed.`);
    $('#confirmDeleteBtn').off('click').on('click', execDelete);
    new bootstrap.Modal(document.getElementById('deleteModal')).show();
}

function execDelete() {
    bootstrap.Modal.getInstance(document.getElementById('deleteModal'))?.hide();
    if (!pendingDelete) return;
    $.ajax({
        url: `/products/delete-product/${pendingDelete}`,
        type: 'DELETE',
        success: function() {
            showToast('Product deleted ✓', 'success');
            loadProducts();
        },
        error: function() {
            showToast('Delete failed', 'error');
        }
    });
    pendingDelete = null;
}
