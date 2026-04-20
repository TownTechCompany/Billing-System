/**
 * more_dropdown.js
 * The More dropdown is fully managed by spa.js (attachNavListeners).
 * This file exists for ESC key support and exposes the global toggle helper.
 */
(function () {
    'use strict';

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && typeof window.closeMoreDropdown === 'function') {
            window.closeMoreDropdown();
        }
    });

})();
