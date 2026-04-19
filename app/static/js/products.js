/* ════════════════════════════════════════════════
   products.js — Product Management Logic (Card Grid)
   ════════════════════════════════════════════════ */

'use strict';

window.ProductApp = {
    state: {
        all: [],
        activeCategory: 'all',
        pendingDeleteId: null
    },

    init: function() {
        this.load();
        document.getElementById('productSearch')?.addEventListener('input', () => this.filterAndRender());
        document.getElementById('fImage')?.addEventListener('change', () => this.previewImage());
    },

    load: async function() {
        this._showSkeleton();
        try {
            const res = await fetch('/products/get-products');
            const json = await res.json();
            this.state.all = json.data || [];
            this.buildCategoryChips();
            this.renderCards(this.state.all);
        } catch (e) {
            console.error('[ProductApp] Load failed:', e);
            this._toast('Failed to load products', 'error');
        }
    },

    buildCategoryChips: function() {
        const products = this.state.all;
        const cats = [...new Set(products.map(p => p.category))].sort();
        const chipsEl = document.getElementById('catChips');
        if (!chipsEl) return;

        let html = `<button class="cat-chip ${this.state.activeCategory === 'all' ? 'active' : ''}" 
                     data-cat="all" onclick="ProductApp.setCategory('all')">
                     All <span class="prod-count-badge">${products.length}</span></button>`;
        
        cats.forEach(cat => {
            const count = products.filter(p => p.category === cat).length;
            html += `<button class="cat-chip ${this.state.activeCategory === cat ? 'active' : ''}" 
                      data-cat="${this._esc(cat)}" onclick="ProductApp.setCategory('${this._esc(cat)}')">
                      ${this._esc(cat)} <span class="prod-count-badge">${count}</span></button>`;
        });
        
        chipsEl.innerHTML = html;

        // Populate datalist for modal
        const dl = document.getElementById('catSuggestions');
        if (dl) dl.innerHTML = cats.map(c => `<option value="${this._esc(c)}">`).join('');
    },

    setCategory: function(cat) {
        this.state.activeCategory = cat;
        document.querySelectorAll('.cat-chip').forEach(b => {
            b.classList.toggle('active', b.dataset.cat === cat);
        });
        this.filterAndRender();
    },

    filterAndRender: function() {
        const q = document.getElementById('productSearch')?.value.toLowerCase().trim() || '';
        let filtered = this.state.all;

        if (this.state.activeCategory !== 'all') {
            filtered = filtered.filter(p => p.category === this.state.activeCategory);
        }

        if (q) {
            filtered = filtered.filter(p => 
                p.name.toLowerCase().includes(q) || 
                p.category.toLowerCase().includes(q)
            );
        }

        this.renderCards(filtered);
    },

    renderCards: function(products) {
        const grid = document.getElementById('productsGrid');
        if (!grid) return;

        if (!products.length) {
            grid.innerHTML = `
                <div class="prod-empty">
                    <i class="fas fa-box-open"></i>
                    <h5>No products found</h5>
                    <p>Try adjusting your search or add a new product.</p>
                </div>`;
            return;
        }

        grid.innerHTML = products.map((p, i) => {
            const imgHtml = (p.image && p.image !== 'placeholder.png' && !p.image.includes('via.placeholder'))
                ? `<img src="${p.image}" alt="${this._esc(p.name)}" onerror="this.parentElement.innerHTML='<div class=prod-img-placeholder><i class=fas fa-image></i></div>'">`
                : `<div class="prod-img-placeholder"><i class="fas fa-utensils"></i></div>`;

            return `
                <div class="prod-card" style="animation-delay:${i * 0.045}s;" onclick="ProductApp.openEditModal(${p.id})">
                    <div class="prod-img-wrap">${imgHtml}</div>
                    <div class="prod-body">
                        <div class="prod-name">${this._esc(p.name)}</div>
                        <div class="prod-cat">${this._esc(p.category)}</div>
                        <div class="prod-price-row">
                            <span class="prod-price-label">Price</span>
                            <span class="prod-price">₹${Number(p.price).toFixed(2)}</span>
                        </div>
                    </div>
                    <div class="prod-actions" onclick="event.stopPropagation()">
                        <button class="act-btn edit" onclick="ProductApp.openEditModal(${p.id})" title="Edit">
                            <i class="fas fa-pen"></i>
                        </button>
                        <button class="act-btn delete" onclick="ProductApp.openDeleteModal(${p.id}, '${this._escJs(p.name)}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>`;
        }).join('');
    },

    // ── Modal Operations ─────────────────────────────────────────────────────

    openAddModal: function() {
        this._resetForm();
        document.getElementById('modalTitle').textContent = 'Add Product';
        document.getElementById('saveProductBtn').textContent = 'Create Product';
        new bootstrap.Modal(document.getElementById('productModal')).show();
    },

    openEditModal: function(id) {
        const p = this.state.all.find(x => x.id === id);
        if (!p) return;

        this._resetForm();
        document.getElementById('editProductId').value = p.id;
        document.getElementById('modalTitle').textContent = 'Edit Product';
        document.getElementById('saveProductBtn').textContent = 'Save Changes';
        document.getElementById('fName').value = p.name;
        document.getElementById('fCategory').value = p.category;
        document.getElementById('fPrice').value = p.price;

        const wrap = document.getElementById('imagePreviewWrap');
        const img = document.getElementById('imagePreview');
        if (p.image && p.image !== 'placeholder.png' && !p.image.includes('via.placeholder')) {
            img.src = p.image;
            wrap.style.display = 'inline-block';
        }
        new bootstrap.Modal(document.getElementById('productModal')).show();
    },

    save: async function() {
        const id = document.getElementById('editProductId').value;
        const name = document.getElementById('fName').value.trim();
        const category = document.getElementById('fCategory').value.trim();
        const price = document.getElementById('fPrice').value;

        if (!name || !category || !price) {
            this._toast('Please fill all required fields', 'error');
            return;
        }

        const fd = new FormData();
        fd.append('name', name);
        fd.append('category', category);
        fd.append('price', price);
        const file = document.getElementById('fImage').files[0];
        if (file) fd.append('image', file);

        const isEdit = !!id;
        const btn = document.getElementById('saveProductBtn');
        const originalText = btn.textContent;
        
        btn.textContent = 'Saving…';
        btn.disabled = true;

        try {
            const url = isEdit ? `/products/update-product/${id}` : '/products/create-product';
            const method = isEdit ? 'PUT' : 'POST';
            
            const res = await fetch(url, { method, body: fd });
            if (res.ok) {
                bootstrap.Modal.getInstance(document.getElementById('productModal'))?.hide();
                this._toast(isEdit ? 'Product updated ✓' : 'Product added ✓', 'success');
                this.load();
            } else {
                throw new Error('Save failed');
            }
        } catch (e) {
            this._toast('Error saving product', 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = originalText;
        }
    },

    openDeleteModal: function(id, name) {
        this.state.pendingDeleteId = id;
        document.getElementById('deleteDesc').textContent = `"${name}" will be permanently removed.`;
        document.getElementById('confirmDeleteBtn').onclick = () => this.executeDelete();
        new bootstrap.Modal(document.getElementById('deleteModal')).show();
    },

    executeDelete: async function() {
        const id = this.state.pendingDeleteId;
        if (!id) return;

        bootstrap.Modal.getInstance(document.getElementById('deleteModal'))?.hide();
        
        try {
            const res = await fetch(`/products/delete-product/${id}`, { method: 'DELETE' });
            if (res.ok) {
                this._toast('Product deleted', 'success');
                this.load();
            } else {
                throw new Error('Delete failed');
            }
        } catch (e) {
            this._toast('Failed to delete', 'error');
        } finally {
            this.state.pendingDeleteId = null;
        }
    },

    // ── Internal Helpers ─────────────────────────────────────────────────────

    previewImage: function() {
        const file = document.getElementById('fImage').files[0];
        if (!file) return;
        const wrap = document.getElementById('imagePreviewWrap');
        const img = document.getElementById('imagePreview');
        img.src = URL.createObjectURL(file);
        wrap.style.display = 'inline-block';
    },

    _resetForm: function() {
        document.getElementById('editProductId').value = '';
        document.getElementById('fName').value = '';
        document.getElementById('fCategory').value = '';
        document.getElementById('fPrice').value = '';
        document.getElementById('fImage').value = '';
        document.getElementById('imagePreviewWrap').style.display = 'none';
    },

    _showSkeleton: function() {
        const grid = document.getElementById('productsGrid');
        if (grid) {
            grid.innerHTML = [1,2,3,4].map(() => `
                <div class="skel-card">
                    <div class="skel" style="width:90px;height:90px;border-radius:16px;flex-shrink:0;"></div>
                    <div style="flex:1;display:flex;flex-direction:column;gap:8px;">
                        <div class="skel" style="height:14px;width:60%;"></div>
                        <div class="skel" style="height:11px;width:35%;"></div>
                        <div class="skel" style="height:20px;width:45%;margin-top:4px;border-radius:6px;"></div>
                    </div>
                </div>`).join('');
        }
    },

    _toast: function(msg, type) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: type,
                title: msg,
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true
            });
        }
    },

    _esc: function(s) {
        if (!s) return '';
        return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    },

    _escJs: function(s) {
        if (!s) return '';
        return String(s).replace(/\\/g,'\\\\').replace(/'/g,"\\'");
    }
};

// Auto-init if DOM is ready, or let SPA handle it
if (document.readyState === 'complete') {
    ProductApp.init();
} else {
    document.addEventListener('DOMContentLoaded', () => ProductApp.init());
}
