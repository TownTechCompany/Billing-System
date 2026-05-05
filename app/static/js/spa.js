/* ═══════════════════════════════════════════════════════
   BillPOS — SPA Router  (spa.js)
   Intercepts bottom-nav navigation:
     1. Fetch the target URL
     2. Extract {% block content %} (everything inside .main-content)
     3. Inject page-specific <link> CSS (once per href)
     4. Inject and execute page-specific <script> JS (once per src)
     5. Update top-bar title + bottom-nav active state
     6. Push browser history
   Back/forward handled via popstate.
   All existing page JS logic is untouched.
═══════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── helpers ── */
  const $ = id => document.getElementById(id);
  const qs = sel => document.querySelector(sel);
  const qsa = sel => [...document.querySelectorAll(sel)];

  /* Sets already injected — prevents duplicate CSS/JS */
  const loadedCSS = new Set();
  const loadedJS  = new Set();

  /* Page title map — matches what the server renders */
  const PAGE_TITLES = {
    '/':          'Dashboard',
    '/dashboard': 'Dashboard',
    '/pos':       'Point of Sale',
    '/products':  'Products',
    '/orders':    'Orders',
    '/settings':  'Settings',
    '/employees': 'Employees',
    '/settings/shop': 'Shop Identity',
    '/settings/tax': 'Tax & GST',
    '/settings/payments': 'Payments',
    '/settings/receipt': 'Receipt',
    '/settings/tables': 'Tables',
    '/settings/data': 'Data & Reset',
  };

  /* ── Extract the inner content from a fetched HTML string ──
     We look for everything inside <div class="main-content">…</div>
     which is what {% block content %} renders into.
     If not found, we fall back to the full <body>.           */
  function extractContent(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');

    /* content block */
    const mc = doc.querySelector('.main-content');
    const content = mc ? mc.innerHTML : doc.body.innerHTML;

    /* page-specific <link rel="stylesheet"> (from <head>) */
    const cssLinks = [...doc.querySelectorAll('head link[rel="stylesheet"]')]
      .map(l => l.getAttribute('href'))
      .filter(Boolean);

    /* page-specific <script src="…"> from anywhere in doc */
    const scripts = [...doc.querySelectorAll('script[src]')]
      .map(s => s.getAttribute('src'))
      .filter(Boolean);

    /* inline <script> blocks from {% block scripts %} */
    const inlineScripts = [...doc.querySelectorAll('body script:not([src])')]
      .map(s => s.textContent)
      .filter(t => t.trim());

    return { content, cssLinks, scripts, inlineScripts };
  }

  /* ── Lazy-load a CSS <link> (once per href) ── */
  function ensureCSS(href) {
    const absHref = new URL(href, location.origin).href;
    if (loadedCSS.has(absHref)) return Promise.resolve();
    loadedCSS.add(absHref);
    return new Promise(resolve => {
      const link = document.createElement('link');
      link.rel = 'stylesheet'; link.href = absHref;
      link.onload = link.onerror = resolve;
      document.head.appendChild(link);
    });
  }

  /* ── Lazy-load a script (once per src) ── */
  function ensureScript(src) {
    const absSrc = new URL(src, location.origin).href;
    if (loadedJS.has(absSrc)) return Promise.resolve();
    loadedJS.add(absSrc);
    return new Promise(resolve => {
      const s = document.createElement('script');
      s.src = absSrc;
      s.onload = s.onerror = resolve;
      document.body.appendChild(s);
    });
  }

  /* ── Execute inline script text in global scope ── */
  function execInline(code) {
    try {
      // eslint-disable-next-line no-new-func
      (new Function(code))();
    } catch (e) {
      console.warn('[SPA] inline script error:', e);
    }
  }

  /* ── Update top-bar page title ── */
  function updateTitle(path) {
    const titleEl = qs('.top-bar-page-title');
    let title = PAGE_TITLES[path];
    
    // Handle dynamic order details path
    if (!title && path.startsWith('/orders/')) {
      title = 'Order Details';
    }
    
    if (titleEl) titleEl.textContent = title || 'BillPOS';
    document.title = (title || 'BillPOS') + ' — BillPOS';
  }

  /* ── Sync top-bar back button for settings sub-pages ── */
  const SETTINGS_SUB_PAGES = [
    '/settings/shop', '/settings/tax', '/settings/payments',
    '/settings/receipt', '/settings/tables', '/settings/data',
  ];

  /* Regex for dynamic order-detail path: /orders/123 */
  const ORDER_DETAIL_RE = /^\/orders\/\d+(\/.*)?$/;

  function syncTopBar(path) {
    const topBar   = qs('.top-app-bar');
    const topBarLeft = qs('.top-bar-left');
    const mc       = qs('.main-content');

    if (ORDER_DETAIL_RE.test(path)) {
      /* ── Order Details page: hide global top bar, lock main-content scroll ── */
      if (topBar) topBar.style.display = 'none';
      if (mc) { mc.style.overflow = 'hidden'; mc.style.paddingBottom = '0'; }
    } else {
      /* ── All other pages: restore global top bar ── */
      if (topBar) topBar.style.display = '';
      if (mc) { mc.style.overflow = ''; mc.style.paddingBottom = ''; }

      if (!topBarLeft) return;
      if (SETTINGS_SUB_PAGES.includes(path)) {
        if (!topBarLeft.querySelector('.top-bar-back-btn')) {
          topBarLeft.innerHTML = `
            <a href="/settings" class="top-bar-back-btn" data-spa-link title="Back to Settings">
              <i class="fa-solid fa-chevron-left"></i>
            </a>`;
        }
      } else {
        topBarLeft.innerHTML = '';
      }
    }
  }

  /* ── Update bottom-nav active state ── */
  function updateNav(path) {
    qsa('.bottom-nav-item').forEach(item => {
      const href = item.getAttribute('href') || item.dataset.href || '';
      const isMoreBtn = item.id === 'moreNavBtn';
      
      let active = false;
      if (isMoreBtn) {
        // Active if path is settings, employees, or any settings sub-page
        active = path === '/employees' || path === '/settings' || path.startsWith('/settings/');
      } else {
        const isDashboard = (path === '/' || path === '/dashboard') && (href === '/' || href === '/dashboard');
        const isExact = (href === path);
        const isOrders = (path.startsWith('/orders') && href === '/orders');
        active = isDashboard || isExact || isOrders;
      }
      
      item.classList.toggle('active', active);
    });
  }

  /* ── Show a loading shimmer while fetching ── */
  function showLoading() {
    const mc = qs('.main-content');
    if (!mc) return;
    mc.innerHTML = `
      <div style="padding:24px;display:flex;flex-direction:column;gap:12px;animation:fadeSlideIn .3s ease">
        ${[1,2,3].map(() => `
          <div style="height:80px;background:linear-gradient(90deg,var(--slate-100) 25%,var(--slate-50) 50%,var(--slate-100) 75%);
               background-size:200% 100%;border-radius:12px;animation:shimmer 1.2s infinite linear"></div>
        `).join('')}
      </div>
    `;
    /* inject shimmer keyframe once */
    if (!$('spa-shimmer-style')) {
      const st = document.createElement('style');
      st.id = 'spa-shimmer-style';
      st.textContent = '@keyframes shimmer{from{background-position:200% 0}to{background-position:-200% 0}}';
      document.head.appendChild(st);
    }
  }

  /* ── Core navigate function ── */
  async function navigate(url, pushToHistory = true) {
    const urlObj = new URL(url, location.origin);
    const path = urlObj.pathname;
    const fullPath = urlObj.pathname + urlObj.search;

    /* Don't re-navigate to same page */
    if (fullPath === location.pathname + location.search && pushToHistory) return;

    /* Close any open layout overlays */
    if (typeof closeMoreDropdown === 'function') closeMoreDropdown();
    if (typeof closeUserSheet === 'function') closeUserSheet();

    showLoading();
    updateNav(path);
    updateTitle(path);
    syncTopBar(path);

    try {
      const res = await fetch(url, {
        headers: { 'X-Requested-With': 'BillPOS-SPA' }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();

      const { content, cssLinks, scripts, inlineScripts } = extractContent(html);

      /* Load CSS first (parallel) */
      await Promise.all(cssLinks.map(ensureCSS));

      /* Inject content */
      const mc = qs('.main-content');
      if (mc) {
        mc.innerHTML = content;
        mc.scrollTop = 0;
        /* Trigger enter animation */
        mc.classList.remove('spa-page-enter');
        void mc.offsetWidth; /* reflow */
        mc.classList.add('spa-page-enter');
        mc.addEventListener('animationend', () => mc.classList.remove('spa-page-enter'), { once: true });
      }

      /* Load scripts sequentially to preserve order */
      for (const src of scripts) {
        /* Skip global scripts already in base (bootstrap, jquery, etc.) */
        if (src.includes('bootstrap') || src.includes('jquery') ||
            src.includes('datatables') || src.includes('sweetalert2') ||
            src.includes('script.js') || src.includes('spa.js')) continue;
        await ensureScript(src);
      }

      if (pushToHistory) {
        history.pushState({ path: fullPath }, '', fullPath);
      }

      /* Re-init page logic for scripts already loaded (second visit) */
      const pageSrc = scripts.find(s => {
        const abs = new URL(s, location.origin).href;
        return !abs.includes('bootstrap') && !abs.includes('jquery') &&
               !abs.includes('datatables') && !abs.includes('sweetalert2') &&
               !abs.includes('script.js') && !abs.includes('spa.js');
      });
      if (pageSrc) {
        const absPageSrc = new URL(pageSrc, location.origin).href;
        if (loadedJS.has(absPageSrc)) {
          reinitPage(path);
        }
      }

      /* Execute inline scripts */
      inlineScripts.forEach(execInline);

    } catch (err) {
      console.error('[SPA] Navigation failed:', err);
      /* Hard fallback — regular navigation */
      location.href = url;
    }
  }

  /* ── Re-initialise page after second visit ──
     Each page's JS registers its own init. We call known entry points.  */
  function reinitPage(path) {
    try {
      if (path === '/' || path === '/dashboard') {
        if (typeof initDashboard === 'function') initDashboard();
      } else if (path === '/products') {
        if (typeof ProductApp !== 'undefined') ProductApp.init();
      } else if (path === '/orders') {
        if (typeof initOrders === 'function') initOrders();
        else {
          if (typeof loadOrders === 'function') loadOrders();
          if (typeof initTypeChips === 'function') initTypeChips();
          if (typeof startLiveClock === 'function') startLiveClock();
        }
      } else if (ORDER_DETAIL_RE.test(path)) {
        if (typeof initOrderDetails === 'function') initOrderDetails();
      } else if (path === '/pos') {
        if (typeof initPOS === 'function') initPOS();
      } else if (path === '/employees') {
        if (typeof loadEmployees === 'function') loadEmployees();
        if (typeof initSearch === 'function') initSearch();
      } else if (path === '/settings' || path.startsWith('/settings/')) {
        /* Settings loads from API — re-fetch for real-time visual sync if needed */
        if (typeof fetch === 'function') {
          fetch('/settings/get-settings').then(r => r.json()).then(res => {
            const s = res.data;
            if (typeof setVal === 'function' && s) {
              if (s.primary_color) applyColor(s.primary_color, null);
            }
          }).catch(() => {});
        }
      }
    } catch (e) {
      console.warn('[SPA] reinit error:', e);
    }
  }

  /* ── Intercept clicks ── */
  function attachNavListeners() {
    /* Regular bottom nav links (anchors) */
    qsa('.bottom-nav-item').forEach(item => {
      const href = item.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('javascript')) return;
      item.addEventListener('click', e => {
        e.preventDefault();
        navigate(href);
      });
    });

    /* ── More dropdown button ── */
    const moreBtn = $('moreNavBtn');
    if (moreBtn) {
      moreBtn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        const dd  = $('moreDropdown');
        const bg  = $('moreDropdownBackdrop');
        const icon = moreBtn.querySelector('i');
        if (!dd || !bg) return;
        const isOpen = dd.classList.contains('open');
        if (isOpen) {
          closeMoreDropdown();
        } else {
          dd.classList.add('open');
          bg.classList.add('open');
          moreBtn.classList.add('active');
          if (icon) {
            icon.dataset.orig = icon.dataset.orig || icon.className;
            icon.className = 'fa-solid fa-xmark';
          }
        }
      });
    }

    /* ── More dropdown backdrop ── */
    const moreBg = $('moreDropdownBackdrop');
    if (moreBg) {
      moreBg.addEventListener('click', closeMoreDropdown);
    }

    /* ── More dropdown items → SPA navigate ── */
    const moreDd = $('moreDropdown');
    if (moreDd) {
      moreDd.querySelectorAll('.more-dropdown-item').forEach(item => {
        item.addEventListener('click', e => {
          const href = item.getAttribute('href');
          if (href && !href.includes('logout') && !href.startsWith('#')) {
            e.preventDefault();
            closeMoreDropdown();
            navigate(href);
          } else {
            closeMoreDropdown();
          }
        });
      });

      /* Swipe-down to dismiss */
      let startY = 0;
      moreDd.addEventListener('touchstart', e => { startY = e.touches[0].clientY; }, { passive: true });
      moreDd.addEventListener('touchmove', e => {
        if (e.touches[0].clientY - startY > 60) closeMoreDropdown();
      }, { passive: true });
    }

    /* User sheet */
    qsa('.user-sheet-item').forEach(item => {
      item.addEventListener('click', e => {
        const href = item.getAttribute('href');
        if (!href || href.includes('logout')) return; 
        e.preventDefault();
        closeUserSheet();
        navigate(href);
      });
    });

    /* Global data-spa-link listener (Delegation) */
    document.addEventListener('click', e => {
      const link = e.target.closest('[data-spa-link]');
      if (link) {
        const href = link.getAttribute('href');
        if (href && !href.startsWith('#')) {
          e.preventDefault();
          navigate(href);
        }
      }
    });
  }

  /* ── close more dropdown helper (internal) ── */
  function closeMoreDropdown() {
    const dd   = $('moreDropdown');
    const bg   = $('moreDropdownBackdrop');
    const btn  = $('moreNavBtn');
    const icon = btn ? btn.querySelector('i') : null;
    if (dd) dd.classList.remove('open');
    if (bg) bg.classList.remove('open');
    if (icon && icon.dataset.orig) icon.className = icon.dataset.orig;
    /* Don't forcibly remove active — updateNav handles nav active states */
  }

  /* Expose globally for any other module */
  window.closeMoreDropdown = closeMoreDropdown;

  /* ── Handle browser back / forward ── */
  window.addEventListener('popstate', e => {
    const path = e.state?.path || location.pathname;
    navigate(path, false);
  });

  /* ── Initial page state into history ── */
  const initFullPath = location.pathname + location.search;
  history.replaceState({ path: initFullPath }, '', initFullPath);

  /* Mark all global CSS as already loaded (base.html injects them) */
  qsa('head link[rel="stylesheet"]').forEach(l => {
    if (l.href) loadedCSS.add(new URL(l.getAttribute('href') || l.href, location.origin).href);
  });
  /* Mark global scripts as already loaded */
  qsa('script[src]').forEach(s => {
    if (s.src) loadedJS.add(new URL(s.getAttribute('src') || s.src, location.origin).href);
  });

  /* ── Boot ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachNavListeners);
  } else {
    attachNavListeners();
  }

  /* Expose for debugging */
  window.__spa = { navigate, loadedCSS, loadedJS };

})();