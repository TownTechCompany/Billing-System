document.addEventListener('DOMContentLoaded', () => {
    loadChart();
});

function loadChart() {
    $.ajax({
        url: '/orders/analytics',
        type: 'GET',
        dataType: 'json',
        success: function(d) {
            const ctx = $('#revenueChart')[0].getContext('2d');
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: d.labels,
                    datasets: [{
                        label: 'Revenue (₹)',
                        data: d.data,
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99,102,241,0.08)',
                        borderWidth: 2.5,
                        pointBackgroundColor: '#6366f1',
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { display: false }, ticks: { font: { family: 'DM Sans', size: 11 }, color: '#94a3b8' } },
                        y: { grid: { color: 'rgba(226,232,240,0.6)' }, ticks: { font: { family: 'DM Sans', size: 11 }, color: '#94a3b8', callback: v => '₹' + v } }
                    }
                }
            });
        },
        error: function(xhr, status, e) {
            console.error('Chart load failed', e);
        }
    });
}

function applyDateFilter() {
    const s = $('#startDate').val();
    const e = $('#endDate').val();
    if (s && e) window.location.href = `/?start_date=${s}&end_date=${e}`;
}

function clearFilter() {
    window.location.href = '/';
}
