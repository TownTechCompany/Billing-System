$(document).ready(function() {
    const formSidebar = $('#employeeFormSidebar');
    const formOverlay = $('#formOverlay');
    const employeeForm = $('#employeeForm');
    const createEmpBtn = $('#createEmpBtn');
    const closeFormBtn = $('#closeFormBtn');
    const passwordToggle = $('#passwordToggle');
    const passwordInput = $('#password');
    const employeesTable = $('#employeesTable tbody');
    const countBadge = $('#countBadge');
    const searchInput = $('#searchInput');
    const filterType = $('#filterType');
    const filterStatus = $('#filterStatus');
    
    window.allEmployees = [];
    let editingId = null;
    
    // Load employees on page load
    loadEmployees();
    
    // Make loadEmployees globally accessible
    window.loadEmployees = loadEmployees;
    
    // Open form for creating new employee
    createEmpBtn.on('click', function() {
        openForm();
    });
    
    // Close form
    closeFormBtn.on('click', closeForm);
    formOverlay.on('click', closeForm);
    
    // Password visibility toggle
    passwordToggle.on('click', function(e) {
        e.preventDefault();
        const type = passwordInput.attr('type');
        if (type === 'password') {
            passwordInput.attr('type', 'text');
            $(this).find('i').removeClass('ri-eye-line').addClass('ri-eye-off-line');
        } else {
            passwordInput.attr('type', 'password');
            $(this).find('i').removeClass('ri-eye-off-line').addClass('ri-eye-line');
        }
    });
    
    // Submit form
    employeeForm.on('submit', function(e) {
        e.preventDefault();
        submitForm();
    });
    
    // Search and filter
    searchInput.on('keyup', applyFilters);
    filterType.on('change', applyFilters);
    filterStatus.on('change', applyFilters);
    
    // Open form
    function openForm(employee = null) {
        if (employee) {
            // Edit mode
            $('#formTitle').text('Edit Employee');
            $('#submitBtn').text('Update Employee');
            $('#firstName').val(employee.first_name);
            $('#lastName').val(employee.last_name);
            $('#email').val(employee.email);
            $('#password').val('').attr('type', 'password');
            $('#employeeType').val(employee.customer_type);
            $('#isActive').prop('checked', employee.is_active);
            editingId = employee.id;
        } else {
            // Create mode
            $('#formTitle').text('Create Employee');
            $('#submitBtn').text('Create Employee');
            employeeForm[0].reset();
            $('#password').attr('type', 'password');
            $('#passwordToggle').find('i').removeClass('ri-eye-off-line').addClass('ri-eye-line');
            $('#employeeType').val('Staff');
            $('#isActive').prop('checked', true);
            editingId = null;
        }
        
        formSidebar.addClass('active');
        formOverlay.addClass('active');
    }
    
    // Close form
    function closeForm() {
        formSidebar.removeClass('active');
        formOverlay.removeClass('active');
        employeeForm[0].reset();
        editingId = null;
    }
    
    // Submit form
    function submitForm() {
        const formData = {
            first_name: $('#firstName').val().trim(),
            last_name: $('#lastName').val().trim(),
            email: $('#email').val().trim(),
            password: $('#password').val(),
            customer_type: $('#employeeType').val()
        };
        
        // Validate
        if (!formData.first_name || !formData.last_name || !formData.email) {
            townTechAlert.warningCenter('Validation Error', 'Please fill all required fields');
            return;
        }
        
        if (!editingId && !formData.password) {
            townTechAlert.warningCenter('Validation Error', 'Password is required for new employees');
            return;
        }
        
        townTechAlert.loading('Processing...');
        $('#submitBtn').prop('disabled', true);
        
        if (editingId) {
            // Update employee
            updateEmployee(editingId, formData);
        } else {
            // Create employee
            createEmployee(formData);
        }
    }
    
    // Create employee
    function createEmployee(data) {
        $.ajax({
            url: '/api/employees',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function(response) {
                townTechAlert.close();
                townTechAlert.successTopRight('Success', 'Employee created successfully', 2000);
                closeForm();
                loadEmployees();
            },
            error: function(xhr) {
                townTechAlert.close();
                $('#submitBtn').prop('disabled', false);
                
                let errorMsg = 'Failed to create employee';
                if (xhr.responseJSON && xhr.responseJSON.detail) {
                    errorMsg = xhr.responseJSON.detail;
                }
                townTechAlert.errorCenter('Error', errorMsg);
            }
        });
    }
    
    // Update employee
    function updateEmployee(id, data) {
        $.ajax({
            url: `/api/employees/${id}`,
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function(response) {
                townTechAlert.close();
                townTechAlert.successTopRight('Success', 'Employee updated successfully', 2000);
                closeForm();
                loadEmployees();
            },
            error: function(xhr) {
                townTechAlert.close();
                $('#submitBtn').prop('disabled', false);
                
                let errorMsg = 'Failed to update employee';
                if (xhr.responseJSON && xhr.responseJSON.detail) {
                    errorMsg = xhr.responseJSON.detail;
                }
                townTechAlert.errorCenter('Error', errorMsg);
            }
        });
    }
    
    // Load all employees
    function loadEmployees() {
        $.ajax({
            url: '/api/employees',
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                window.allEmployees = data;
                applyFilters();
            },
            error: function() {
                townTechAlert.errorCenter('Error', 'Failed to load employees');
                employeesTable.html('<tr><td colspan="5" class="text-center text-muted">Failed to load employees</td></tr>');
            }
        });
    }
    
    // Apply filters
    function applyFilters() {
        let filtered = window.allEmployees;
        
        const searchQuery = searchInput.val().toLowerCase().trim();
        if (searchQuery) {
            filtered = filtered.filter(emp => 
                emp.full_name.toLowerCase().includes(searchQuery) ||
                emp.email.toLowerCase().includes(searchQuery)
            );
        }
        
        const typeFilter = filterType.val();
        if (typeFilter) {
            filtered = filtered.filter(emp => emp.customer_type === typeFilter);
        }
        
        const statusFilter = filterStatus.val();
        if (statusFilter === 'active') {
            filtered = filtered.filter(emp => emp.is_active === true);
        } else if (statusFilter === 'inactive') {
            filtered = filtered.filter(emp => emp.is_active === false);
        }
        
        renderEmployees(filtered);
    }
    
    // Render employees table
    function renderEmployees(employees) {
        countBadge.text(employees.length);
        
        if (employees.length === 0) {
            employeesTable.html('<tr><td colspan="5" class="text-center text-muted p-4"><i class="ri-inbox-line"></i> No employees found</td></tr>');
            return;
        }
        
        let html = '';
        employees.forEach(emp => {
            const statusBadge = emp.is_active ? 
                '<span class="badge bg-success">Active</span>' : 
                '<span class="badge bg-secondary">Inactive</span>';
            
            html += `
                <tr>
                    <td>
                        <strong>${emp.full_name}</strong>
                    </td>
                    <td class="text-muted">${emp.email}</td>
                    <td>${emp.customer_type}</td>
                    <td>${statusBadge}</td>
                    <td style="text-align: right;">
                        <div class="table-actions">
                            <button class="edit-btn" title="Edit" onclick="editEmployee(${emp.id})">
                                <i class="ri-edit-line"></i>
                            </button>
                            <button class="toggle-btn" title="Toggle Status" onclick="toggleEmployeeStatus(${emp.id})">
                                <i class="ri-check-double-line"></i>
                            </button>
                            <button class="delete-btn" title="Delete" onclick="deleteEmployee(${emp.id})">
                                <i class="ri-delete-bin-line"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        employeesTable.html(html);
    }
    
    // Toggle employee status
    function toggleEmployeeStatus(id) {
        $.ajax({
            url: `/api/employees/${id}/toggle`,
            type: 'PATCH',
            success: function() {
                townTechAlert.successTopRight('Success', 'Employee status updated', 2000);
                loadEmployees();
            },
            error: function() {
                townTechAlert.errorCenter('Error', 'Failed to update status');
            }
        });
    }
    
    // Delete employee
    function deleteEmployee(id) {
        $.ajax({
            url: `/api/employees/${id}`,
            type: 'DELETE',
            success: function() {
                townTechAlert.successTopRight('Success', 'Employee deleted successfully', 2000);
                loadEmployees();
            },
            error: function() {
                townTechAlert.errorCenter('Error', 'Failed to delete employee');
            }
        });
    }

    // Make functions globally accessible
    window.editEmployee = function(id) {
        const emp = window.allEmployees.find(e => e.id === id);
        if (emp) {
            openForm(emp);
        }
    };
    
    window.toggleEmployeeStatus = toggleEmployeeStatus;
    window.deleteEmployee = function(id) {
        if (confirm('Are you sure you want to delete this employee?')) {
            deleteEmployee(id);
        }
    };
});
