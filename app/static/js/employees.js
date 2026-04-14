/* ════════════════════════════════════════════════
   employees.js — Employee Management
   ════════════════════════════════════════════════ */

'use strict';

// ── State ──────────────────────────────────────────────────────────────────
let allEmployees = [];
let filteredEmployees = [];
let pendingDelete = null;
let pendingDeleteName = null;

// ── Init ───────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    loadEmployees();
    initSearch();
});
// ── Load Employees ─────────────────────────────────────────────────────────
async function loadEmployees() {
    try {
        const res = await fetch('/employees/get-employees');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        allEmployees = json.data || [];
        applyFilters();
        document.getElementById('countBadge').textContent = allEmployees.length;
    } catch (e) {
        showToast('Failed to load employees', 'error');
        console.error(e);
    }
}

// ── Search ──────────────────────────────────────────────────────────────────
function initSearch() {
    document.getElementById('searchInput').addEventListener('input', applyFilters);
}

// ── Apply Filters ───────────────────────────────────────────────────────────
function applyFilters() {
    const q = document.getElementById('searchInput').value.toLowerCase().trim();
    
    filteredEmployees = allEmployees.filter(emp => {
        if (!q) return true;
        const hay = [
            emp.first_name,
            emp.last_name,
            emp.email,
            emp.customer_type || ''
        ].join(' ').toLowerCase();
        return hay.includes(q);
    });

    renderCards();
}

// ── Render Cards ────────────────────────────────────────────────────────────
function renderCards() {
    const grid = document.getElementById('employeesGrid');
    const empty = document.getElementById('emptyState');

    if (filteredEmployees.length === 0) {
        grid.innerHTML = '';
        empty.style.display = 'flex';
        return;
    }

    empty.style.display = 'none';
    
    grid.innerHTML = filteredEmployees.map(emp => {
        const fullName = `${emp.first_name} ${emp.last_name}`;
        const initials = `${emp.first_name[0] || '?'}${emp.last_name[0] || '?'}`.toUpperCase();
        const role = emp.customer_type || 'Admin';
        const statusClass = emp.is_active ? '' : 'inactive';
        const statusText = emp.is_active ? 'Active' : 'Inactive';

        return `
            <div class="employee-card">
                <div class="card-header-row">
                    <div class="emp-avatar">${initials}</div>
                    <div class="emp-name-role">
                        <div class="emp-name">${esc(fullName)}</div>
                        <div class="emp-role">${esc(role)}</div>
                    </div>
                    <span class="emp-status-badge ${statusClass}">
                        <i class="fa-solid fa-circle" style="font-size:0.4rem;"></i>
                        ${statusText}
                    </span>
                </div>

                <div class="card-meta">
                    <div class="meta-item">
                        <i class="fa-solid fa-envelope"></i>
                        <span class="meta-value">${esc(emp.email)}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fa-solid fa-id-badge"></i>
                        <span class="meta-value">ID: ${emp.id}</span>
                    </div>
                    ${emp.phone ? `
                    <div class="meta-item">
                        <i class="fa-solid fa-phone"></i>
                        <span class="meta-value">${esc(emp.phone)}</span>
                    </div>
                    ` : ''}
                </div>

                <div class="card-actions">
                    <button class="card-btn edit" title="Edit" onclick="openEditModal(${emp.id}, '${esc(emp.first_name)}', '${esc(emp.last_name)}', '${esc(emp.email)}', '${esc(emp.customer_type || '')}')">
                        <i class="fa-regular fa-pen-to-square"></i> Edit
                    </button>
                    <button class="card-btn delete" title="Delete" onclick="openDeleteModal(${emp.id}, '${esc(fullName)}')">
                        <i class="fa-regular fa-trash-can"></i> Delete
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// ── Add/Edit Modal ──────────────────────────────────────────────────────────
function openAddModal() {
    document.getElementById('editId').value = '';
    document.getElementById('modalTitle').textContent = 'New Employee';
    document.getElementById('saveLabel').textContent = 'Create Employee';
    document.getElementById('fFirstName').value = '';
    document.getElementById('fLastName').value = '';
    document.getElementById('fEmail').value = '';
    document.getElementById('fPassword').value = '';
    document.getElementById('fRole').value = '';
    document.getElementById('fPassword').parentElement.parentElement.style.display = '';
    new bootstrap.Modal(document.getElementById('employeeModal')).show();
}

function openEditModal(id, firstName, lastName, email, role) {
    document.getElementById('editId').value = id;
    document.getElementById('modalTitle').textContent = 'Edit Employee';
    document.getElementById('saveLabel').textContent = 'Update Employee';
    document.getElementById('fFirstName').value = firstName;
    document.getElementById('fLastName').value = lastName;
    document.getElementById('fEmail').value = email;
    document.getElementById('fRole').value = role;
    document.getElementById('fPassword').value = '';
    document.getElementById('fPassword').parentElement.parentElement.style.display = 'none';
    new bootstrap.Modal(document.getElementById('employeeModal')).show();
}

// ── Save Employee ───────────────────────────────────────────────────────────
async function saveEmployee() {
    const id = document.getElementById('editId').value;
    const firstName = document.getElementById('fFirstName').value.trim();
    const lastName = document.getElementById('fLastName').value.trim();
    const email = document.getElementById('fEmail').value.trim();
    const password = document.getElementById('fPassword').value;
    const role = document.getElementById('fRole').value;

    if (!firstName || !lastName || !email || !role) {
        showToast('Please fill all required fields', 'error');
        return;
    }

    if (!id && !password) {
        showToast('Password is required for new employee', 'error');
        return;
    }

    const payload = {
        first_name: firstName,
        last_name: lastName,
        email: email,
        customer_type: role,
        ...(password && { password })
    };

    try {
        const url = id 
            ? `/employees/update-employee/${id}`
            : '/employees/create-employee';
        
        const method = id ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error();

        bootstrap.Modal.getInstance(document.getElementById('employeeModal'))?.hide();
        showToast(id ? 'Employee updated ✓' : 'Employee created ✓', 'success');
        await loadEmployees();
    } catch (e) {
        showToast(id ? 'Failed to update employee' : 'Failed to create employee', 'error');
        console.error(e);
    }
}

// ── Delete Modal ────────────────────────────────────────────────────────────
function openDeleteModal(id, name) {
    pendingDelete = id;
    pendingDeleteName = name;
    document.getElementById('deleteDesc').textContent = `"${name}" will be permanently removed. This cannot be undone.`;
    document.getElementById('confirmDeleteBtn').onclick = execDelete;
    new bootstrap.Modal(document.getElementById('deleteModal')).show();
}

async function execDelete() {
    bootstrap.Modal.getInstance(document.getElementById('deleteModal'))?.hide();
    if (!pendingDelete) return;

    try {
        const res = await fetch(`/employees/delete-employee/${pendingDelete}`, {
            method: 'DELETE'
        });

        if (!res.ok) throw new Error();

        showToast(`${pendingDeleteName} deleted ✓`, 'success');
        await loadEmployees();
    } catch (e) {
        showToast('Failed to delete employee', 'error');
        console.error(e);
    }

    pendingDelete = null;
    pendingDeleteName = null;
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
