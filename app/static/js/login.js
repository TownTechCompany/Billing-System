// Cookie utility functions
  const CookieManager = {
    set: (name, value, days = 30) => {
      const expires = new Date();
      expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
      const secure = window.location.protocol === 'https:' ? '; Secure' : '';
      document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/${secure}; SameSite=Lax`;
    },
    
    get: (name) => {
      const nameEQ = name + "=";
      const cookies = document.cookie.split(';');
      for (let cookie of cookies) {
        cookie = cookie.trim();
        if (cookie.indexOf(nameEQ) === 0) {
          return decodeURIComponent(cookie.substring(nameEQ.length));
        }
      }
      return null;
    },
    
    delete: (name) => {
      CookieManager.set(name, '', -1);
    }
  };

  $(document).ready(function() {
    // Password toggle eye icon
    const passwordInput = $('#password');
    const passwordToggle = $('#passwordToggle');
    const passwordIcon = $('#passwordIcon');

    passwordToggle.on('click', function(e) {
      e.preventDefault();
      
      const type = passwordInput.attr('type');
      if (type === 'password') {
        passwordInput.attr('type', 'text');
        passwordIcon.removeClass('ri-eye-line').addClass('ri-eye-off-line');
      } else {
        passwordInput.attr('type', 'password');
        passwordIcon.removeClass('ri-eye-off-line').addClass('ri-eye-line');
      }
    });

    // Load remembered email on page load
    const rememberMe = $('#rememberMe');
    const email = $('#email');
    const password = $('#password');
    const savedEmail = CookieManager.get('remembered_email');
    
    if (savedEmail) {
      email.val(savedEmail);
      rememberMe.prop('checked', true);
      password.val(CookieManager.get('remembered_password'));
    }

    // Handle login form submission with AJAX
    $('#loginForm').on('submit', function(e) {
      e.preventDefault();
      
      const emailVal = $('#email').val();
      const passwordVal = $('#password').val();
      const rememberMeVal = $('#rememberMe').is(':checked');
      const loginBtn = $('#loginBtn');
      
      // Validate fields
      if (!emailVal || !passwordVal) {
        townTechAlert.warningCenter('Validation Error', 'Please fill in all fields');
        return;
      }
      
      // Show loading alert
      loginBtn.prop('disabled', true);
      
      // AJAX request
      $.ajax({
        url: '/api/auth/login',
        type: 'POST',
        contentType: 'application/json',
        dataType: 'json',
        xhrFields: {
          withCredentials: true
        },
        data: JSON.stringify({
          email: emailVal,
          password: passwordVal,
          remember_me: rememberMeVal
        }),
        success: function(response) {
          townTechAlert.close();
          
          // Handle "Remember Me"
          if (rememberMeVal) {
            CookieManager.set('remembered_email', emailVal, 30);
            CookieManager.set('remembered_password', passwordVal, 30);
          } else {
            CookieManager.delete('remembered_email');
            CookieManager.delete('remembered_password');
          }
          
          // Show success alert
          townTechAlert.successCenter(
            'Login Successful',
            `Welcome back, ${response.user.first_name}!`,
            2000
          );
          
          // Redirect to dashboard
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 2000);
        },
        error: function(xhr, status, error) {
          townTechAlert.close();
          loginBtn.prop('disabled', false);
          
          let errorMsg = 'Login failed. Please try again.';
          
          if (xhr.responseJSON && xhr.responseJSON.detail) {
            errorMsg = xhr.responseJSON.detail;
          } else if (xhr.status === 401) {
            errorMsg = 'Invalid email or password';
          } else if (xhr.status === 500) {
            errorMsg = 'Server error. Please try again later.';
          }
          
          // Show error alert
          townTechAlert.errorCenter('Login Failed', errorMsg);
        }
      });
    });
  });

  // Logout function
  function logout() {
    $.ajax({
      url: '/api/auth/logout',
      type: 'POST',
      contentType: 'application/json',
      success: function() {
        CookieManager.delete('remembered_email');
        townTechAlert.successTopRight('Logged Out', 'You have been logged out', 1500);
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      },
      error: function() {
        CookieManager.delete('remembered_email');
        window.location.href = '/';
      }
    });
  }