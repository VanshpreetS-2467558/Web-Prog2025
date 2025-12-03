let categoryChart = null;

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    loadAnalysisData();
    
    // Date filter form handler
    document.getElementById('dateFilterForm').addEventListener('submit', (e) => {
        e.preventDefault();
        loadAnalysisData();
    });
    
    // Reset filter button
    document.getElementById('resetFilter').addEventListener('click', () => {
        document.getElementById('startDate').value = '';
        document.getElementById('endDate').value = '';
        loadAnalysisData();
    });
});

async function loadAnalysisData() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    try {
        const response = await fetch(`/transactions/analysis/data?${params.toString()}`);
        const data = await response.json();
        
        if (data.success) {
            updateStatistics(data);
            updateChart(data.categoryBreakdown);
            updateTopItems(data.topItems || []);
            updateTopStations(data.topStations || []);
        } else {
            console.error('Error loading analysis data:', data.error);
            alert('Er is een fout opgetreden bij het laden van de gegevens.');
        }
    } catch (err) {
        console.error('Error fetching analysis data:', err);
        alert('Er is een fout opgetreden bij het laden van de gegevens.');
    }
}

function updateStatistics(data) {
    document.getElementById('totalItems').textContent = data.totalItems || 0;
    document.getElementById('totalSpent').textContent = `${data.totalSpent || 0} FestCoins`;
}

function updateChart(categoryBreakdown) {
    const ctx = document.getElementById('categoryChart');
    
    // Destroy existing chart if it exists
    if (categoryChart) {
        categoryChart.destroy();
    }
    
    // Prepare data for chart
    const categories = Object.keys(categoryBreakdown || {});
    const quantities = Object.values(categoryBreakdown || {});
    
    // Generate colors for each category
    const colors = generateColors(categories.length);
    
    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categories,
            datasets: [{
                label: 'Aantal items',
                data: quantities,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${label}: ${value} items (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function generateColors(count) {
    const baseColors = [
        'rgba(59, 130, 246, 0.8)',   // blue
        'rgba(16, 185, 129, 0.8)',  // green
        'rgba(245, 158, 11, 0.8)',  // yellow
        'rgba(239, 68, 68, 0.8)',    // red
        'rgba(139, 92, 246, 0.8)',  // purple
        'rgba(236, 72, 153, 0.8)',   // pink
        'rgba(20, 184, 166, 0.8)',   // teal
        'rgba(251, 146, 60, 0.8)',  // orange
    ];
    
    const colors = [];
    for (let i = 0; i < count; i++) {
        colors.push(baseColors[i % baseColors.length]);
    }
    
    return colors;
}

function updateTopItems(topItems) {
    const container = document.getElementById('topItemsList');
    
    if (!topItems || topItems.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-4">Geen items gevonden voor deze periode.</p>';
        return;
    }
    
    container.innerHTML = topItems.map((item, index) => {
        const rank = index + 1;
        const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
        
        return `
            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div class="flex items-center gap-4 flex-1">
                    <span class="text-2xl font-bold text-gray-400 w-8">${rankEmoji}</span>
                    <div class="flex-1">
                        <h3 class="font-semibold text-lg">${item.itemName || 'Onbekend item'}</h3>
                        <p class="text-sm text-gray-500">${item.totalQuantity || 0} ${item.totalQuantity === 1 ? 'item' : 'items'}</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-xl font-bold bg-gradientkleurBR bg-clip-text text-transparent">${item.totalSpent || 0} FestCoins</p>
                </div>
            </div>
        `;
    }).join('');
}

function updateTopStations(topStations) {
    const container = document.getElementById('topStationsList');
    
    if (!topStations || topStations.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-4">Geen stations gevonden voor deze periode.</p>';
        return;
    }
    
    container.innerHTML = topStations.map((station, index) => {
        const rank = index + 1;
        const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
        
        return `
            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div class="flex items-center gap-4 flex-1">
                    <span class="text-2xl font-bold text-gray-400 w-8">${rankEmoji}</span>
                    <div class="flex-1">
                        <h3 class="font-semibold text-lg">${station.stationName || 'Onbekend Station'}</h3>
                        <p class="text-sm text-gray-500">${station.totalQuantity || 0} ${station.totalQuantity === 1 ? 'item' : 'items'}</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-xl font-bold bg-gradientkleurBR bg-clip-text text-transparent">${station.totalSpent || 0} FestCoins</p>
                </div>
            </div>
        `;
    }).join('');
}

