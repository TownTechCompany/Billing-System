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
    
    $('#togglePassword').on('click', function() {
        const passwordInput = $('#fPassword');
        const type = passwordInput.attr('type') === 'password' ? 'text' : 'password';
        passwordInput.attr('type', type);
        
        // Toggle icon
        $(this).toggleClass('fa-eye fa-eye-slash');
    });
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
            townTechAlert.errorTopRight('Failed to load employees');
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

    $('#visibleCount').text(`${filteredEmployees.length} item${filteredEmployees.length !== 1 ? 's' : ''}`);

    if (filteredEmployees.length === 0) {
        grid.html(`
            <div class="emp-empty">
                <div class="emp-empty-icon"><i class="fa-regular fa-users"></i></div>
                <h5>No employees found</h5>
                <p>Add your first employee to get started.</p>
            </div>
        `);
        return;
    }

    grid.html(filteredEmployees.map(emp => {
        const fullName = `${emp.first_name} ${emp.last_name}`;
        const initials = `${emp.first_name[0] || '?'}${emp.last_name[0] || '?'}`.toUpperCase();
        const role = emp.customer_type || 'Admin';

        return `
        <div class="emp-card" data-id="${emp.id}">
            <div class="emp-img-wrap">
                <div class="emp-avatar">${initials}</div>
            </div>
            <div class="emp-body">
                <div class="emp-top-row">
                    <span class="emp-name">${esc(fullName)}</span>
                </div>
                <span class="emp-role-tag">${esc(role)}</span>
                <div class="emp-email">
                    <i class="fa-regular fa-envelope" style="font-size: 0.8rem; color: #94a3b8;"></i>
                    ${esc(emp.email)}
                </div>
            </div>
            <div class="emp-actions">
                <button class="act-btn edit" title="Edit" onclick="openEditModal(${emp.id}, '${esc(emp.first_name)}', '${esc(emp.last_name)}', '${esc(emp.email)}', '${esc(emp.customer_type || '')}', '${esc(emp.password || '')}')">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="act-btn delete" title="Delete" onclick="openDeleteModal(${emp.id}, '${esc(fullName)}')">
                    <i class="fa-solid fa-trash"></i>
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
    
    // Reset password visibility state
    $('#fPassword').attr('type', 'password');
    $('#togglePassword').removeClass('fa-eye-slash').addClass('fa-eye');
    
    new bootstrap.Modal(document.getElementById('employeeModal')).show();
}

function openEditModal(id, firstName, lastName, email, role, password) {
    $('#editId').val(id);
    $('#modalTitle').text('Edit Employee');
    $('#saveLabel').text('Update Employee');
    $('#fFirstName').val(firstName);
    $('#fLastName').val(lastName);
    $('#fEmail').val(email);
    $('#fRole').val(role);
    $('#fPassword').val(password);
    
    // Reset password visibility state
    $('#fPassword').attr('type', 'password');
    $('#togglePassword').removeClass('fa-eye-slash').addClass('fa-eye');

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
        townTechAlert.errorTopRight('Please fill all required fields');
        return;
    }

    if (!id && !password) {
        townTechAlert.errorTopRight('Password is required for new employee');
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
            townTechAlert.successTopRight(id ? 'Employee updated ✓' : 'Employee created ✓');
            loadEmployees();
        },
        error: function(xhr) {
            const err = xhr.responseJSON?.message || (id ? 'Failed to update employee' : 'Failed to create employee');
            townTechAlert.errorTopRight(err);
            console.error('[Employees] Save error:', xhr);
        }
    });
}

// ── Delete Modal ────────────────────────────────────────────────────────────
function openDeleteModal(id, name) {
    townTechAlert.confirmDialog(
        'Delete Employee?',
        `Remove "${name}" permanently?`,
        () => {
            pendingDelete = id;
            pendingDeleteName = name;
            execDelete();
        }
    );
}

async function execDelete() {
    if (!pendingDelete) return;

    $.ajax({
        url: `/employees/delete-employee/${pendingDelete}`,
        type: 'DELETE',
        success: function() {
            townTechAlert.successTopRight(`${pendingDeleteName} deleted ✓`);
            loadEmployees();
        },
        error: function(xhr, status, e) {
            townTechAlert.errorTopRight('Failed to delete employee');
            console.error(e);
        }
    });

    pendingDelete = null;
    pendingDeleteName = null;
}


// ── Utils ──────────────────────────────────────────────────────────────────
function esc(str) {
    return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
