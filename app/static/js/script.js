/* script.js — Global helpers: toast, user bottom-sheet, swipe-to-dismiss */

function escHtml(str) {
    return String(str || '').replace(/[&<>'"]/g,
        t => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[t])
    );
}

function showToast(msg, type = 'success') {
    const stack = document.getElementById('toastStack');
    if (!stack) return;
    const el = document.createElement('div');
    el.className = `toast-item ${type}`;
    el.innerHTML = `<span class="toast-icon"><i class="fa-solid ${type === 'success' ? 'fa-circle-check' : 'fa-circle-xmark'}"></i></span>${escHtml(msg)}`;
    stack.appendChild(el);
    setTimeout(() => el.remove(), 3500);
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