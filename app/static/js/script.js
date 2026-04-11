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
