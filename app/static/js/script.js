function escHtml(str) {
    return String(str || '').replace(/[&<>'"]/g,
        t => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[t])
    );
}

function showToast(msg, type = 'success') {
    const stack = $('#toastStack');
    if (!stack.length) return;
    const el = $('<div>', {
        class: `toast-item ${type}`,
        html: `<span class="toast-icon"><i class="fa-solid ${type === 'success' ? 'fa-circle-check' : 'fa-circle-xmark'}"></i></span>${escHtml(msg)}`
    });
    stack.append(el);
    setTimeout(() => el.remove(), 3500);
}
