/* script.js — Global helpers: toast, user bottom-sheet, swipe-to-dismiss */

function escHtml(str) {
    return String(str || '').replace(/[&<>'"]/g,
        t => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[t])
    );
}

/**
 * showToast — Premium custom toast notifications
 * @param {string} msg - The message to display
 * @param {string} type - 'success', 'error', 'warning', 'info'
 * @param {object} options - Options like onConfirm, onCancel, confirmText
 */
function showToast(msg, type = 'success', options = {}) {
    const stack = document.getElementById('toastStack');
    if (!stack) return;

    const el = document.createElement('div');
    el.className = `toast-item ${type}`;
    
    const iconMap = {
        success: 'fa-circle-check',
        error: 'fa-circle-xmark',
        warning: 'fa-triangle-exclamation',
        info: 'fa-circle-info'
    };

    let innerHTML = `
        <div class="toast-icon">
            <i class="fa-solid ${iconMap[type] || 'fa-circle-info'}"></i>
        </div>
        <div class="toast-content">
            <div>${escHtml(msg)}</div>
    `;

    // Handle Confirmation (Actions)
    if (options.onConfirm) {
        innerHTML += `
            <div class="toast-actions">
                <button class="toast-btn toast-btn-primary" id="toastConfirmBtn">${options.confirmText || 'Yes'}</button>
                <button class="toast-btn toast-btn-secondary" id="toastCancelBtn">${options.cancelText || 'No'}</button>
            </div>
        `;
    }

    innerHTML += `</div>`;
    el.innerHTML = innerHTML;
    stack.appendChild(el);

    const close = () => {
        el.classList.add('fade-out');
        setTimeout(() => el.remove(), 300);
    };

    if (options.onConfirm) {
        el.querySelector('#toastConfirmBtn').addEventListener('click', () => {
            options.onConfirm();
            close();
        });
        el.querySelector('#toastCancelBtn').addEventListener('click', () => {
            if (options.onCancel) options.onCancel();
            close();
        });
    } else {
        // Auto-remove standard toasts
        setTimeout(close, 3500);
    }
}


function markUnsaved() {
    const fab = document.getElementById('saveFab');
    if (fab) fab.classList.add('visible');
}

// ── User Bottom Sheet toggle ──
function openUserSheet() {
    const s = document.getElementById('userSheet');
    const b = document.getElementById('userSheetBackdrop');
    if (s) s.classList.add('open');
    if (b) b.classList.add('open');
    document.body.style.overflow = 'hidden';
}
function closeUserSheet() {
    const s = document.getElementById('userSheet');
    const b = document.getElementById('userSheetBackdrop');
    if (s) s.classList.remove('open');
    if (b) b.classList.remove('open');
    document.body.style.overflow = '';
}

// Attach events safely after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const userMenuBtn   = document.getElementById('userMenuBtn');
    const userSheet     = document.getElementById('userSheet');
    const userSheetBack = document.getElementById('userSheetBackdrop');

    if (userMenuBtn)   userMenuBtn.addEventListener('click', openUserSheet);
    if (userSheetBack) userSheetBack.addEventListener('click', closeUserSheet);

    if (userSheet) {
        // Swipe-down to dismiss
        let touchStartY = 0;
        userSheet.addEventListener('touchstart', e => {
            touchStartY = e.touches[0].clientY;
        }, { passive: true });
        userSheet.addEventListener('touchend', e => {
            if (e.changedTouches[0].clientY - touchStartY > 60) closeUserSheet();
        }, { passive: true });
    }
});