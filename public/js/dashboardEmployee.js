document.addEventListener('DOMContentLoaded', () => {
    loadEmployeeDashboardData();
    setInterval(loadEmployeeDashboardData, 30000);
});

async function loadEmployeeDashboardData() {
    try {
        const response = await fetch('/dashboard/employee-data');
        const result = await response.json();
        if (result.success) {
            updateEmployeeDashboard(result.data);
        } else {
            console.error(result.error);
        }
    } catch(err) {
        console.error(err);
    }
}

function updateEmployeeDashboard(data) {
    updateStationRevenue(data.stationRevenue);
    updateEventTimerEmployee(data.eventTimer);
    updateSalesChart(data.salesToday);
    updatePopularItems(data.popularItems);
}

function updateStationRevenue(amount) {
    document.getElementById('totalRevenueStation').textContent = `${amount || 0} FestCoins`;
    document.getElementById('totalRevenueStationEuro').textContent = `€${amount || 0}`;
}

function updateEventTimerEmployee(eventInfo) {
    const timerEl = document.getElementById('eventTimerEmployee');
    const timeRangeEl = document.getElementById('eventTimeRangeEmployee');

    if (!eventInfo) {
        timerEl.textContent = '-';
        timeRangeEl.textContent = '-';
        return;
    }

    const now = new Date();
    const start = new Date(eventInfo.startDate);
    const end = new Date(eventInfo.endDate);
    timeRangeEl.textContent = `${start.toLocaleString('nl-NL')} tot ${end.toLocaleString('nl-NL')}`;

    if (now < start) {
        const diff = start - now;
        const hours = Math.floor(diff / 1000 / 60 / 60);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        timerEl.textContent = `Start over ${hours}:${String(minutes).padStart(2,'0')}u`;
    } else if (now >= start && now < end) {
        const diff = end - now;
        const hours = Math.floor(diff / 1000 / 60 / 60);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        timerEl.textContent = `${hours}:${String(minutes).padStart(2,'0')}u te gaan`;
    } else {
        timerEl.textContent = 'Afgelopen';
    }
}

function updateSalesChart(salesData) {
    const container = document.getElementById('salesChart');
    const labelsContainer = document.getElementById('salesChartLabels');
    if (!container || !labelsContainer) return;

    container.innerHTML = '';
    labelsContainer.innerHTML = '';

    const maxSales = Math.max(...salesData.map(d => d.sales), 1);

    salesData.forEach((d) => {
        const bar = document.createElement('div');
        bar.className = 'bg-blue-500 w-6';
        bar.style.height = `${(d.sales / maxSales) * 100}%`;
        bar.title = `${d.time}: ${d.sales} FestCoins`;
        container.appendChild(bar);

        const label = document.createElement('span');
        label.className = 'text-sm';
        label.textContent = d.time;
        labelsContainer.appendChild(label);
    });
}

function updatePopularItems(items) {
    const container = document.getElementById('popularItems');
    if (!container) return;

    if (!items || items.length === 0) {
        container.innerHTML = '<p class="text-gray-500">Geen items verkocht</p>';
        return;
    }

    const maxSold = items[0].sold || 1;

    container.innerHTML = items.map(item => {
        const width = (item.sold / maxSold) * 100;
        return `
        <div class="space-y-1">
            <div class="flex justify-between text-sm">
                <span class="font-semibold">${item.name}</span>
                <span class="text-gray-500">${item.sold}x</span>
            </div>
            <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div class="h-full bg-blue-500 transition-all" style="width: ${width}%"></div>
            </div>
            <div class="text-xs font-semibold text-blue-600">€${item.revenue}</div>
        </div>`;
    }).join('');
}
