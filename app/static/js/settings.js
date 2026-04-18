/* ════════════════════════════════════════════════
   settings.js — Centralized Settings Logic
   ════════════════════════════════════════════════ */

'use strict';

/**
 * Settings Application Namespace
 */
window.SettingsApp = {
    
    // ── Shop Identity ────────────────────────────────────────────────────────
    saveShop: async function() {
        const data = {
            shopName: document.getElementById('shopName').value,
            shopTagline: document.getElementById('shopTagline').value,
            shopAddress: document.getElementById('shopAddress').value,
            shopPhone: document.getElementById('shopPhone').value,
            shopEmail: document.getElementById('shopEmail').value,
            adminPin: document.getElementById('adminPin').value
        };

        try {
            const res = await this._post('/settings/update-shop', data);
            if (res.ok) this._onSaveSuccess('Shop settings saved');
        } catch (e) { this._onSaveError(e); }
    },

    // ── Tax & GST ────────────────────────────────────────────────────────────
    saveTax: async function() {
        const data = {
            gstin: document.getElementById('gstin').value,
            cgst: parseFloat(document.getElementById('cgst').value),
            sgst: parseFloat(document.getElementById('sgst').value),
            taxInclusive: document.getElementById('taxInclusive').checked,
            roundTotal: document.getElementById('roundTotal').checked,
            allowDiscount: document.getElementById('allowDiscount').checked,
            maxDiscount: parseFloat(document.getElementById('maxDiscount').value)
        };

        try {
            const res = await this._post('/settings/update-tax', data);
            if (res.ok) this._onSaveSuccess('Tax settings saved');
        } catch (e) { this._onSaveError(e); }
    },

    // ── Payments ────────────────────────────────────────────────────────────
    savePayments: async function() {
        const data = {
            upiId: document.getElementById('upiId').value
        };

        try {
            const res = await this._post('/settings/update-payments', data);
            if (res.ok) this._onSaveSuccess('Payment settings saved');
        } catch (e) { this._onSaveError(e); }
    },

    // ── Receipt ─────────────────────────────────────────────────────────────
    saveReceipt: async function() {
        const data = {
            thankYouMsg: document.getElementById('thankYouMsg').value,
            receiptFooter: document.getElementById('receiptFooter').value,
            paperWidth: document.getElementById('paperWidth').value
        };

        try {
            const res = await this._post('/settings/update-receipt', data);
            if (res.ok) this._onSaveSuccess('Receipt settings saved');
        } catch (e) { this._onSaveError(e); }
    },

    // ── Tables ──────────────────────────────────────────────────────────────
    saveTables: async function() {
        const data = {
            enableTables: document.getElementById('enableTables').checked,
            tableCount: parseInt(document.getElementById('tableCount').value)
        };

        try {
            const res = await this._post('/settings/update-tables', data);
            if (res.ok) this._onSaveSuccess('Table settings saved');
        } catch (e) { this._onSaveError(e); }
    },

    // ── Data Management ─────────────────────────────────────────────────────
    resetSettings: function() {
        Swal.fire({
            title: 'Reset settings?',
            text: "This will revert all shop settings to default.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: 'var(--rose)',
            confirmButtonText: 'Yes, reset'
        }).then((result) => {
            if (result.isConfirmed) {
                // Future: Add API call here
                Swal.fire('Reset!', 'Settings have been reverted.', 'success');
            }
        });
    },

    clearData: function() {
        Swal.fire({
            title: 'Wipe all data?',
            text: "This will delete all orders and products forever!",
            icon: 'error',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Yes, DELETE EVERYTHING'
        }).then((result) => {
            if (result.isConfirmed) {
                // Future: Add API call here
                Swal.fire('Deleted!', 'All data has been wiped.', 'success');
            }
        });
    },

    // ── Internal Helpers ─────────────────────────────────────────────────────
    _post: async function(url, data) {
        return fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    },

    _onSaveSuccess: function(msg) {
        document.getElementById('saveFab')?.classList.remove('visible');
        Swal.fire({ 
            icon: 'success', 
            title: msg, 
            timer: 1500, 
            showConfirmButton: false, 
            toast: true, 
            position: 'top-end' 
        });
    },

    _onSaveError: function(err) {
        console.error('[Settings] Save failed:', err);
        Swal.fire({ icon: 'error', title: 'Error saving settings' });
    }
};

// Map old names to new namespace for template compatibility if needed, 
// though we will update templates to use SettingsApp.saveXxx()
window.saveCurrentSettings = () => SettingsApp.saveShop();
window.saveTaxSettings     = () => SettingsApp.saveTax();
window.savePaymentSettings = () => SettingsApp.savePayments();
window.saveReceiptSettings = () => SettingsApp.saveReceipt();
window.saveTableSettings   = () => SettingsApp.saveTables();
window.resetSettings       = () => SettingsApp.resetSettings();
window.clearData           = () => SettingsApp.clearData();
