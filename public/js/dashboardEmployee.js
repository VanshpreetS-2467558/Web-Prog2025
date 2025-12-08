document.addEventListener('DOMContentLoaded', () => {
    const eventSelect = document.getElementById('infoCardsGridEmployee');
    if (!eventSelect) return; // Not an employee dashboard

    // Load initial data
    loadEmployeeDashboardData();

    // Reload data when event selection changes
    eventSelect.addEventListener('change', () => {
        loadEmployeeDashboardData();
    });

    // Auto-refresh every 30 seconds
    setInterval(() => {
        if (document.getElementById('infoCardsGridEmployee')) {
            loadEmployeeDashboardData();
        }
    }, 30000);
});

async function loadEmployeeDashboardData() {
    try {
        const response = await fetch(`/dashboard/employee-data`);
        const result = await response.json();

        if (result.success) {
            updateEmployeeDashboard(result.data);
        } else {
            console.error('Error loading employee dashboard data:', result.error);
        }
    } catch (err) {
        console.error('Error fetching employee dashboard data:', err);
    }
}


function updateEmployeeDashboard(data) {
    updateStationRevenue(data.stationRevenue);
    updateEventTimerEmployee(data.eventTimer);
}

function updateStationRevenue(data) {
    const totalRevenueStationEl = document.getElementById('totalRevenueStation');
    const totalRevenueStationEuroEl = document.getElementById('totalRevenueStationEuro');

    if (totalRevenueStationEl) totalRevenueStationEl.textContent = `${data || 0} FestCoins`;
    if (totalRevenueStationEuroEl) totalRevenueStationEuroEl.textContent = `€${data || 0}`;
}

function updateEventTimerEmployee(eventInfo) {
    const timerEl = document.getElementById('eventTimerEmployee');
    const timeRangeEl = document.getElementById('eventTimeRangeEmployee');

    if (!timerEl || !timeRangeEl) return;

    if (!eventInfo) {
        timerEl.textContent = '-';
        timeRangeEl.textContent = '-';
        return;
    }

    const now = new Date();
    const startDate = new Date(eventInfo.startDate);
    const endDate = new Date(eventInfo.endDate);

    const startDateTime = startDate.toLocaleString('nl-NL', { 
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
    });
    const endDateTime = endDate.toLocaleString('nl-NL', { 
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
    });
    timeRangeEl.textContent = `${startDateTime} tot ${endDateTime}`;

    if (now < startDate) {
        const diff = startDate - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        timerEl.textContent = `Start over ${hours}:${String(minutes).padStart(2,'0')}u`;
    } else if (now >= startDate && now < endDate) {
        const diff = endDate - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        timerEl.textContent = `${hours}:${String(minutes).padStart(2,'0')}u te gaan`;
    } else {
        timerEl.textContent = 'Afgelopen';
    }
}
