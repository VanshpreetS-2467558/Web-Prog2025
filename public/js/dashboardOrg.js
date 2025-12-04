// Dashboard JavaScript for organizers
document.addEventListener('DOMContentLoaded', () => {
    const eventSelect = document.getElementById('eventSelect');
    if (!eventSelect) return; // Not an organizer dashboard

    // Load initial data
    loadDashboardData();

    // Reload data when event selection changes
    eventSelect.addEventListener('change', () => {
        loadDashboardData();
    });

    // Auto-refresh every 30 seconds
    setInterval(() => {
        if (document.getElementById('eventSelect')) {
            loadDashboardData();
        }
    }, 30000);

    // PDF export button
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', () => {
            exportToPdf();
        });
    }
});

function exportToPdf() {
    const eventSelect = document.getElementById('eventSelect');
    const eventId = eventSelect ? eventSelect.value : null;
    
    // Build URL with eventId parameter
    let url = '/dashboard/export-pdf';
    if (eventId) {
        url += `?eventId=${eventId}`;
    }
    
    // Open in new window to trigger download
    window.open(url, '_blank');
}

async function loadDashboardData() {
    const eventSelect = document.getElementById('eventSelect');
    const eventId = eventSelect ? eventSelect.value : null;

    try {
        const params = new URLSearchParams();
        if (eventId) params.append('eventId', eventId);

        const response = await fetch(`/dashboard/data?${params.toString()}`);
        const result = await response.json();

        if (result.success) {
            updateDashboard(result.data);
        } else {
            console.error('Error loading dashboard data:', result.error);
        }
    } catch (err) {
        console.error('Error fetching dashboard data:', err);
    }
}

function updateDashboard(data) {
    // Update general info cards
    updateGeneralInfo(data);
    
    // Update visitors chart
    updateVisitorsChart(data.visitorsPerHour);
    
    // Update popular items
    updatePopularItems(data.popularItems);
    
    // Update event timer
    updateEventTimer(data.eventInfo);
}

function updateGeneralInfo(data) {
    // Total revenue
    const totalRevenueEl = document.getElementById('totalRevenue');
    const totalRevenueEuroEl = document.getElementById('totalRevenueEuro');
    if (totalRevenueEl) {
        totalRevenueEl.textContent = `${data.totalRevenue} FestCoins`;
    }
    if (totalRevenueEuroEl) {
        // Assuming 1 FestCoin = 1 Euro (adjust if different)
        totalRevenueEuroEl.textContent = `€${data.totalRevenue}`;
    }

    // Total visitors
    const totalVisitorsEl = document.getElementById('totalVisitors');
    if (totalVisitorsEl) {
        totalVisitorsEl.textContent = data.totalVisitors.toLocaleString();
    }

    // Visitors today
    const visitorsTodayEl = document.getElementById('visitorsToday');
    if (visitorsTodayEl) {
        visitorsTodayEl.textContent = data.visitorsToday.toLocaleString();
    }
}

function updateVisitorsChart(visitorsPerHour) {
    const chartContainer = document.getElementById('visitorsChart');
    const chartLabels = document.getElementById('visitorsChartLabels');
    
    if (!chartContainer || !chartLabels) return;

    // Create a map of existing data
    const dataMap = {};
    if (visitorsPerHour && visitorsPerHour.length > 0) {
        visitorsPerHour.forEach(v => {
            dataMap[v.hour] = v.count;
        });
    }

    // Find max count for scaling
    const counts = Object.values(dataMap);
    const maxCount = counts.length > 0 ? Math.max(...counts, 1) : 1;

    // Generate hours from 00:00 to 23:00
    const allHours = Array.from({ length: 24 }, (_, i) => {
        const hour = String(i).padStart(2, '0');
        return `${hour}:00`;
    });

    // Build chart HTML
    chartContainer.innerHTML = '';
    chartLabels.innerHTML = '';

    allHours.forEach((hour, index) => {
        const count = dataMap[hour] || 0;
        const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
        
        const bar = document.createElement('div');
        bar.className = 'bg-blue-500 flex-1 min-w-[8px] rounded-t transition-all hover:bg-blue-600';
        bar.style.height = `${Math.max(height, 2)}%`;
        bar.title = `${hour}: ${count} bezoekers`;
        chartContainer.appendChild(bar);

        // Show label every 3 hours to avoid clutter
        if (index % 3 === 0) {
            const label = document.createElement('span');
            label.className = 'text-xs';
            label.textContent = hour.split(':')[0];
            chartLabels.appendChild(label);
        } else {
            const spacer = document.createElement('span');
            spacer.className = 'text-xs';
            chartLabels.appendChild(spacer);
        }
    });
}

function updatePopularItems(popularItems) {
    const container = document.getElementById('popularItems');
    if (!container) return;

    if (!popularItems || popularItems.length === 0) {
        container.innerHTML = '<p class="text-gray-500">Geen items verkocht</p>';
        return;
    }

    const maxSold = popularItems[0]?.sold || 1;

    container.innerHTML = popularItems.map(item => {
        const widthPercent = (item.sold / maxSold) * 100;
        return `
            <div class="space-y-1">
                <div class="flex justify-between text-sm">
                    <span class="font-semibold">${item.itemName}</span>
                    <span class="text-gray-500">${item.sold}x</span>
                </div>
                <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div class="h-full bg-blue-500 transition-all" style="width: ${widthPercent}%"></div>
                </div>
                <div class="text-xs font-semibold text-blue-600">${item.revenue} FestCoins</div>
            </div>
        `;
    }).join('');
}

function updateEventTimer(eventInfo) {
    const timerEl = document.getElementById('eventTimer');
    const timeRangeEl = document.getElementById('eventTimeRange');
    const timerCard = document.getElementById('eventTimerCard');
    const eventSelect = document.getElementById('eventSelect');
    const infoCardsGrid = document.getElementById('infoCardsGrid');
    
    // Check if a specific event is selected
    const eventId = eventSelect ? eventSelect.value : null;
    const isSpecificEventSelected = eventId && eventId !== '';
    
    // Show/hide timer card based on selection and update grid layout
    if (timerCard && infoCardsGrid) {
        if (isSpecificEventSelected && eventInfo) {
            timerCard.classList.remove('hidden');
            // Use 4 columns when timer is visible
            infoCardsGrid.className = 'grid md:grid-cols-4 gap-6 mb-8';
        } else {
            timerCard.classList.add('hidden');
            // Use 3 columns when timer is hidden
            infoCardsGrid.className = 'grid md:grid-cols-3 gap-6 mb-8';
            if (timerEl) timerEl.textContent = '-';
            if (timeRangeEl) timeRangeEl.textContent = '-';
            return;
        }
    }
    
    if (!timerEl || !timeRangeEl || !eventInfo) {
        if (timerEl) timerEl.textContent = '-';
        if (timeRangeEl) timeRangeEl.textContent = '-';
        return;
    }

    const now = new Date();
    const startDate = new Date(eventInfo.startDate);
    const endDate = new Date(eventInfo.endDate);

    // Format date and time range (showing both date and time)
    const startDateTime = startDate.toLocaleString('nl-NL', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    const endDateTime = endDate.toLocaleString('nl-NL', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    timeRangeEl.textContent = `${startDateTime} tot ${endDateTime}`;

    // Calculate time remaining
    if (now < startDate) {
        // Event hasn't started
        const diff = startDate - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        timerEl.textContent = `Start over ${hours}:${String(minutes).padStart(2, '0')}u`;
    } else if (now >= startDate && now < endDate) {
        // Event is live
        const diff = endDate - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        timerEl.textContent = `${hours}:${String(minutes).padStart(2, '0')}u te gaan`;
    } else {
        // Event has ended
        timerEl.textContent = 'Afgelopen';
    }
}

