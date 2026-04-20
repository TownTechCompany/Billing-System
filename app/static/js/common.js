/**
 * TownTech Alert System
 * Unified alert notifications using custom showToast (Toast Only)
 */

const townTechAlert = {
    /**
     * Top Right Alert - Success
     */
    successTopRight: (title = 'Success', message = '', timer = 3000) => {
        showToast(message || title, 'success');
    },

    /**
     * Top Right Alert - Error
     */
    errorTopRight: (title = 'Error', message = '', timer = 4000) => {
        showToast(message || title, 'error');
    },

    /**
     * Top Right Alert - Warning
     */
    warningTopRight: (title = 'Warning', message = '', timer = 4000) => {
        showToast(message || title, 'warning');
    },

    /**
     * Top Right Alert - Info
     */
    infoTopRight: (title = 'Info', message = '', timer = 3000) => {
        showToast(message || title, 'info');
    },

    /**
     * Center Alert - Success (Now Toast)
     */
    successCenter: (title = 'Success', message = '', showConfirm = true) => {
        showToast(message || title, 'success');
    },

    /**
     * Center Alert - Error (Now Toast)
     */
    errorCenter: (title = 'Error', message = '', showConfirm = true) => {
        showToast(message || title, 'error');
    },

    /**
     * Center Alert - Warning (Now Toast)
     */
    warningCenter: (title = 'Warning', message = '', showConfirm = true) => {
        showToast(message || title, 'warning');
    },

    /**
     * Center Alert - Info (Now Toast)
     */
    infoCenter: (title = 'Info', message = '', showConfirm = true) => {
        showToast(message || title, 'info');
    },

    /**
     * Center Confirmation Dialog - Yes/No (Now Toast with Actions)
     */
    confirmDialog: (title = 'Confirm', message = '', onConfirm, onCancel) => {
        showToast(message || title, 'info', {
            confirmText: 'Yes',
            cancelText: 'No',
            onConfirm: onConfirm,
            onCancel: onCancel
        });
    },

    /**
     * Top Right Alert - General (Custom)
     */
    toastTopRight: (icon = 'info', title = 'Alert', timer = 3000) => {
        showToast(title, icon);
    },

    /**
     * Loading Alert - Center (Now Toast)
     */
    loading: (title = 'Loading...') => {
        showToast(title, 'info');
    },

    /**
     * Close any open alert (Now closes toasts)
     */
    close: () => {
        document.querySelectorAll('.toast-item').forEach(el => {
            el.classList.add('fade-out');
            setTimeout(() => el.remove(), 300);
        });
    }
};

