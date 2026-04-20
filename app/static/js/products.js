/**
 * products.js — Product Management Logic
 * Handles the card grid, category filtering, search, and CRUD modals.
 * Integrated with the SPA router via window.ProductApp.init().
 */

'use strict';

window.ProductApp = (() => {
    let allProducts = [];
    let activeCategory = 'all';
    let searchQuery = '';
    let pendingDeleteId = null;

    // ── Helpers ─────────────────────────────────────────────────────────────
    
    const esc = (s) => String(s || '').replace(/[&<>'"]/g, 
        t => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[t]));

    const toast = (msg, type = 'success') => {
        if (typeof showToast === 'function') showToast(msg, type);
        else alert(msg);
    };

    // ── Core Methods ────────────────────────────────────────────────────────

    async function load() {
        showSkeleton();
        try {
            const res = await fetch('/products/get-products');
            const json = await res.json();
            allProducts = json.data || [];
            buildChips();
            render();
        } catch (e) {
            console.error('[ProductApp] Load failed:', e);
            const grid = document.getElementById('productsGrid');
            if (grid) {
                grid.innerHTML = `
                    <div class="prod-empty">
                        <div class="prod-empty-icon"><i class="fas fa-exclamation-circle"></i></div>
                        <h5>Failed to load</h5><p>Please refresh the page.</p>
                    </div>`;
            }
        }
    }

    function render() {
        const grid = document.getElementById('productsGrid');
        if (!grid) return;

        const filtered = allProducts.filter(p => {
            const matchCat = activeCategory === 'all' || p.category === activeCategory;
            const matchQ = p.name.toLowerCase().includes(searchQuery) ||
                           p.category.toLowerCase().includes(searchQuery);
            return matchCat && matchQ;
        });

        const countLabel = document.getElementById('visibleCount');
        if (countLabel) {
            countLabel.textContent = `${filtered.length} item${filtered.length !== 1 ? 's' : ''}`;
        }

        if (filtered.length === 0) {
            grid.innerHTML = `
                <div class="prod-empty">
                    <div class="prod-empty-icon"><i class="fas fa-box-open"></i></div>
                    <h5>No products found</h5>
                    <p>${searchQuery ? 'Try a different search term.' : 'Add your first product to get started.'}</p>
                </div>`;
            return;
        }

        grid.innerHTML = filtered.map(p => {
            const imgHtml = (p.image && p.image !== 'placeholder.png' && !p.image.includes('via.placeholder'))
                ? `<img src="${p.image}" alt="${esc(p.name)}" loading="lazy"
                     onerror="this.parentElement.innerHTML='<div class=\\'prod-img-placeholder\\'><i class=\\'fas fa-utensils\\'></i></div>'">`
                : `<div class="prod-img-placeholder"><i class="fas fa-utensils"></i></div>`;

            return `
            <div class="prod-card" data-id="${p.id}">
                <div class="prod-img-wrap">${imgHtml}</div>
                <div class="prod-body">
                    <div class="prod-top-row">
                        <span class="prod-name">${esc(p.name)}</span>
                    </div>
                    <span class="prod-cat-tag">${esc(p.category)}</span>
                    <div class="prod-price-row">
                        <span class="prod-price">₹${parseFloat(p.price).toFixed(2)}</span>
                    </div>
                </div>
                <div class="prod-actions">
                    <button class="act-btn edit" onclick="ProductApp.openEditModal(${p.id})" title="Edit product">
                        <i class="fas fa-pen"></i>
                    </button>
                    <button class="act-btn delete" onclick="ProductApp.confirmDelete(${p.id}, '${esc(p.name)}')" title="Delete product">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>`;
        }).join('');
    }

    function buildChips() {
        const container = document.getElementById('catChips');
        if (!container) return;

        const cats = [...new Set(allProducts.map(p => p.category))].sort();
        const totalCountEl = document.getElementById('totalCount');
        if (totalCountEl) totalCountEl.textContent = allProducts.length;

        // Reset chips, keeping "All"
        container.innerHTML = `<button class="cat-chip ${activeCategory === 'all' ? 'active' : ''}" 
                                data-cat="all">All <span class="chip-count" id="totalCount">${allProducts.length}</span></button>`;

        cats.forEach(cat => {
            const count = allProducts.filter(p => p.category === cat).length;
            const btn = document.createElement('button');
            btn.className = `cat-chip ${activeCategory === cat ? 'active' : ''}`;
            btn.dataset.cat = cat;
            btn.innerHTML = `${esc(cat)} <span class="chip-count">${count}</span>`;
            btn.onclick = () => setCategory(cat);
            container.appendChild(btn);
        });

        // Add listener to "All" chip
        container.querySelector('[data-cat="all"]').onclick = () => setCategory('all');

        // Populate datalist for modal
        const dl = document.getElementById('catSuggestions');
        if (dl) dl.innerHTML = cats.map(c => `<option value="${esc(c)}">`).join('');
    }

    function setCategory(cat) {
        activeCategory = cat;
        document.querySelectorAll('.cat-chip').forEach(c => {
            c.classList.toggle('active', c.dataset.cat === cat);
        });
        render();
    }

    // ── Modals ──────────────────────────────────────────────────────────────

    function openAddModal() {
        resetForm();
        document.getElementById('modalTitle').textContent = 'Add Product';
        document.getElementById('saveProductBtn').textContent = 'Create Product';
        const modalEl = document.getElementById('productModal');
        if (modalEl) new bootstrap.Modal(modalEl).show();
    }

    function openEditModal(id) {
        const p = allProducts.find(x => x.id === id);
        if (!p) return;
        
        resetForm();
        document.getElementById('editProductId').value = p.id;
        document.getElementById('fName').value = p.name;
        document.getElementById('fCategory').value = p.category;
        document.getElementById('fPrice').value = p.price;

        const preview = document.getElementById('imagePreview');
        const placeholder = document.getElementById('imagePlaceholder');
        if (p.image && p.image !== 'placeholder.png' && !p.image.includes('via.placeholder')) {
            preview.src = p.image;
            preview.style.display = 'block';
            if (placeholder) placeholder.style.display = 'none';
        } else {
            preview.style.display = 'none';
            if (placeholder) placeholder.style.display = 'block';
        }

        document.getElementById('modalTitle').textContent = 'Edit Product';
        document.getElementById('saveProductBtn').textContent = 'Save Changes';
        const modalEl = document.getElementById('productModal');
        if (modalEl) new bootstrap.Modal(modalEl).show();
    }

    async function save() {
        const id       = document.getElementById('editProductId').value;
        const name     = document.getElementById('fName').value.trim();
        const category = document.getElementById('fCategory').value.trim();
        const price    = document.getElementById('fPrice').value;
        const fileInput = document.getElementById('fImage');

        if (!name || !category || !price) {
            toast('Please fill in all required fields', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('name', name);
        formData.append('category', category);
        formData.append('price', price);
        if (fileInput && fileInput.files.length > 0) {
            formData.append('image', fileInput.files[0]);
        }

        const url    = id ? `/products/update-product/${id}` : '/products/create-product';
        const method = id ? 'PUT' : 'POST';
        const btn    = document.getElementById('saveProductBtn');
        
        btn.disabled = true;
        btn.textContent = 'Saving…';

        try {
            const res = await fetch(url, { method, body: formData });
            if (!res.ok) throw new Error();
            
            const modalEl = document.getElementById('productModal');
            bootstrap.Modal.getInstance(modalEl)?.hide();
            
            toast(id ? 'Product updated' : 'Product added', 'success');
            await load();
        } catch (e) {
            toast('Error saving product', 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = id ? 'Save Changes' : 'Create Product';
        }
    }

    function confirmDelete(id, name) {
        pendingDeleteId = id;
        const desc = document.getElementById('deleteDesc');
        if (desc) desc.textContent = `"${name}" will be permanently removed. This cannot be undone.`;
        
        const confirmBtn = document.getElementById('confirmDeleteBtn');
        if (confirmBtn) confirmBtn.onclick = executeDelete;
        
        const modalEl = document.getElementById('deleteModal');
        if (modalEl) new bootstrap.Modal(modalEl).show();
    }

    async function executeDelete() {
        if (!pendingDeleteId) return;
        const btn = document.getElementById('confirmDeleteBtn');
        btn.disabled = true;
        btn.textContent = 'Deleting…';

        try {
            const res = await fetch(`/products/delete-product/${pendingDeleteId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error();
            
            const modalEl = document.getElementById('deleteModal');
            bootstrap.Modal.getInstance(modalEl)?.hide();
            
            toast('Product deleted', 'success');
            await load();
        } catch (e) {
            toast('Failed to delete product', 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Delete';
            pendingDeleteId = null;
        }
    }

    // ── Internal Helpers ─────────────────────────────────────────────────────

    function resetForm() {
        ['editProductId', 'fName', 'fCategory', 'fPrice', 'fImage'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        const preview = document.getElementById('imagePreview');
        const placeholder = document.getElementById('imagePlaceholder');
        if (preview) preview.style.display = 'none';
        if (placeholder) placeholder.style.display = 'block';
    }

    function showSkeleton() {
        const grid = document.getElementById('productsGrid');
        if (!grid) return;
        grid.innerHTML = [1,2,3,4].map(() => `
            <div class="skel-card">
                <div class="skel" style="width:90px;height:90px;border-radius:16px;flex-shrink:0;"></div>
                <div style="flex:1;display:flex;flex-direction:column;gap:9px;">
                    <div class="skel" style="height:14px;width:60%;"></div>
                    <div class="skel" style="height:11px;width:35%;"></div>
                    <div class="skel" style="height:22px;width:45%;margin-top:4px;border-radius:8px;"></div>
                </div>
            </div>`).join('');
    }

    function handleImagePreview() {
        const input = document.getElementById('fImage');
        if (!input) return;
        input.onchange = function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = e => {
                    const preview = document.getElementById('imagePreview');
                    const placeholder = document.getElementById('imagePlaceholder');
                    if (preview) {
                        preview.src = e.target.result;
                        preview.style.display = 'block';
                    }
                    if (placeholder) placeholder.style.display = 'none';
                };
                reader.readAsDataURL(file);
            }
        };
    }

    function init() {
        load();
        
        const searchInput = document.getElementById('productSearch');
        if (searchInput) {
            searchInput.oninput = function() {
                searchQuery = this.value.trim().toLowerCase();
                render();
            };
        }

        handleImagePreview();
    }

    // Export public methods
    return { init, openAddModal, openEditModal, save, confirmDelete };
})();

// Auto-run if not in SPA mode or first load
if (document.readyState === 'complete') {
    ProductApp.init();
} else {
    document.addEventListener('DOMContentLoaded', () => ProductApp.init());
}