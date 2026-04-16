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
function loadEmployees() {
    $.ajax({
        url: '/employees/get-employees',
        type: 'GET',
        dataType: 'json',
        success: function(json) {
            allEmployees = json.data || [];
            applyFilters();
            $('#countBadge').text(allEmployees.length);
        },
        error: function(xhr, status, e) {
            showToast('Failed to load employees', 'error');
            console.error(e);
        }
    });
}

// ── Search ──────────────────────────────────────────────────────────────────
function initSearch() {
    $('#searchInput').on('input', applyFilters);
}

// ── Apply Filters ───────────────────────────────────────────────────────────
function applyFilters() {
    const q = $('#searchInput').val().toLowerCase().trim();
    
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
    const grid = $('#employeesGrid');
    const empty = $('#emptyState');

    if (filteredEmployees.length === 0) {
        grid.empty();
        empty.css('display', 'flex');
        return;
    }

    empty.hide();
    
    grid.html(filteredEmployees.map(emp => {
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
    }).join(''));
}

// ── Add/Edit Modal ──────────────────────────────────────────────────────────
function openAddModal() {
    $('#editId').val('');
    $('#modalTitle').text('New Employee');
    $('#saveLabel').text('Create Employee');
    $('#fFirstName').val('');
    $('#fLastName').val('');
    $('#fEmail').val('');
    $('#fPassword').val('');
    $('#fRole').val('');
    $('#passwordField').show();
    new bootstrap.Modal(document.getElementById('employeeModal')).show();
}

function openEditModal(id, firstName, lastName, email, role) {
    $('#editId').val(id);
    $('#modalTitle').text('Edit Employee');
    $('#saveLabel').text('Update Employee');
    $('#fFirstName').val(firstName);
    $('#fLastName').val(lastName);
    $('#fEmail').val(email);
    $('#fRole').val(role);
    $('#fPassword').val('');
    $('#passwordField').hide();
    new bootstrap.Modal(document.getElementById('employeeModal')).show();
}

// ── Save Employee ───────────────────────────────────────────────────────────
async function saveEmployee() {
    const id = $('#editId').val();
    const firstName = $('#fFirstName').val().trim();
    const lastName = $('#fLastName').val().trim();
    const email = $('#fEmail').val().trim();
    const password = $('#fPassword').val();
    const role = $('#fRole').val();

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

    const url = id 
        ? `/employees/update-employee/${id}`
        : '/employees/create-employee';
    
    const method = id ? 'PUT' : 'POST';

    $.ajax({
        url: url,
        type: method,
        contentType: 'application/json',
        data: JSON.stringify(payload),
        success: function() {
            bootstrap.Modal.getInstance(document.getElementById('employeeModal'))?.hide();
            showToast(id ? 'Employee updated ✓' : 'Employee created ✓', 'success');
            loadEmployees();
        },
        error: function(xhr, status, e) {
            showToast(id ? 'Failed to update employee' : 'Failed to create employee', 'error');
            console.error(e);
        }
    });
}

// ── Delete Modal ────────────────────────────────────────────────────────────
function openDeleteModal(id, name) {
    pendingDelete = id;
    pendingDeleteName = name;
    $('#deleteDesc').text(`"${name}" will be permanently removed. This cannot be undone.`);
    $('#confirmDeleteBtn').off('click').on('click', execDelete);
    new bootstrap.Modal(document.getElementById('deleteModal')).show();
}

async function execDelete() {
    bootstrap.Modal.getInstance(document.getElementById('deleteModal'))?.hide();
    if (!pendingDelete) return;

    $.ajax({
        url: `/employees/delete-employee/${pendingDelete}`,
        type: 'DELETE',
        success: function() {
            showToast(`${pendingDeleteName} deleted ✓`, 'success');
            loadEmployees();
        },
        error: function(xhr, status, e) {
            showToast('Failed to delete employee', 'error');
            console.error(e);
        }
    });

    pendingDelete = null;
    pendingDeleteName = null;
}

// ── Toast ──────────────────────────────────────────────────────────────────
function showToast(msg, type = 'success') {
    const stack = $('#toastStack');
    if (!stack.length) return;
    const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
    const toast = $('<div>', {
        class: `toast-item${type === 'error' ? ' error' : ''}`,
        html: `<span class="toast-icon">${icons[type] || '•'}</span>${esc(msg)}`
    });
    stack.append(toast);
    setTimeout(() => {
        toast.css('animation', 'toastIn .3s var(--ease-spring) reverse');
        toast.one('animationend', () => toast.remove());
    }, 2800);
}

// ── Utils ──────────────────────────────────────────────────────────────────
function esc(str) {
    return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
