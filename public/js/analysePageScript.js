// General Analysis Page Script
document.addEventListener('DOMContentLoaded', () => {
    // Check if mobile and show warning
    checkMobileDevice();
    
    // Load analysis data
    loadAnalysisData();
});

// Check if device is mobile and show warning
function checkMobileDevice() {
    const mobileWarning = document.getElementById('mobileWarning');
    if (!mobileWarning) return;
    
    // Check screen width (desktop should be >= 1024px)
    const isMobile = window.innerWidth < 1024;
    
    if (isMobile) {
        mobileWarning.classList.remove('hidden');
        // Hide content area
        const contentArea = document.getElementById('contentArea');
        if (contentArea) {
            contentArea.classList.add('hidden');
        }
    } else {
        mobileWarning.classList.add('hidden');
    }
    
    // Listen for resize events
    window.addEventListener('resize', () => {
        const isMobileNow = window.innerWidth < 1024;
        if (isMobileNow && !mobileWarning.classList.contains('hidden')) {
            mobileWarning.classList.remove('hidden');
            const contentArea = document.getElementById('contentArea');
            if (contentArea) {
                contentArea.classList.add('hidden');
            }
        } else if (!isMobileNow) {
            mobileWarning.classList.add('hidden');
            const contentArea = document.getElementById('contentArea');
            if (contentArea) {
                contentArea.classList.remove('hidden');
            }
        }
    });
}

// Chart instances storage
let charts = {
    citiesChart: null,
    categoryChart: null,
    categoryQuantityChart: null,
    topItemsChart: null
};

// Load analysis data from API
async function loadAnalysisData() {
    const loadingState = document.getElementById('loadingState');
    const errorState = document.getElementById('errorState');
    const errorMessage = document.getElementById('errorMessage');
    const contentArea = document.getElementById('contentArea');
    
    try {
        const response = await fetch('/analyse/algemene-analyse/data');
        const result = await response.json();
        
        if (result.success) {
            // Hide loading, show content
            if (loadingState) loadingState.classList.add('hidden');
            if (errorState) errorState.classList.add('hidden');
            if (contentArea) contentArea.classList.remove('hidden');
            
            // Update all sections
            updateSummaryCards(result.data.summary);
            updateCitiesChart(result.data.topCities);
            updateCategoryChart(result.data.categoryRevenue);
            updateCategoryQuantityChart(result.data.categoryQuantity);
            updateTopItemsChart(result.data.topItems);
            updateCategoryStatistics(result.data.categoryStats);
            updateTopItemsPerCategory(result.data.topItemsPerCategory);
            updateCitiesList(result.data.allCities);
        } else {
            // Show error
            if (loadingState) loadingState.classList.add('hidden');
            if (errorState) {
                errorState.classList.remove('hidden');
                if (errorMessage) {
                    errorMessage.textContent = result.error || 'Er is een fout opgetreden bij het laden van de data.';
                }
            }
        }
    } catch (err) {
        console.error('Error loading analysis data:', err);
        if (loadingState) loadingState.classList.add('hidden');
        if (errorState) {
            errorState.classList.remove('hidden');
            if (errorMessage) {
                errorMessage.textContent = 'Er is een fout opgetreden bij het laden van de data.';
            }
        }
    }
}

// Update summary cards
function updateSummaryCards(summary) {
    const totalVisitorsEl = document.getElementById('totalVisitors');
    const totalRevenueEl = document.getElementById('totalRevenue');
    const totalItemsSoldEl = document.getElementById('totalItemsSold');
    const eventsCountEl = document.getElementById('eventsCount');
    
    if (totalVisitorsEl) {
        totalVisitorsEl.textContent = summary.totalVisitors.toLocaleString('nl-NL');
    }
    if (totalRevenueEl) {
        totalRevenueEl.textContent = `€${summary.totalRevenue.toLocaleString('nl-NL')}`;
    }
    if (totalItemsSoldEl) {
        totalItemsSoldEl.textContent = summary.totalItemsSold.toLocaleString('nl-NL');
    }
    if (eventsCountEl) {
        eventsCountEl.textContent = summary.eventsCount.toLocaleString('nl-NL');
    }
}

// Update cities chart (bar chart)
function updateCitiesChart(citiesData) {
    const canvas = document.getElementById('citiesChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart if it exists
    if (charts.citiesChart) {
        charts.citiesChart.destroy();
    }
    
    const labels = citiesData.map(c => c.city || 'Onbekend');
    const data = citiesData.map(c => c.visitorCount || 0);
    
    charts.citiesChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Aantal Bezoekers',
                data: data,
                backgroundColor: 'rgba(34, 197, 94, 0.7)',
                borderColor: 'rgba(34, 197, 94, 1)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            aspectRatio: 1.5,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.parsed.y.toLocaleString('nl-NL')} bezoekers`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString('nl-NL');
                        }
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });
}

// Update category revenue chart (pie chart)
function updateCategoryChart(categoryData) {
    const canvas = document.getElementById('categoryChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart if it exists
    if (charts.categoryChart) {
        charts.categoryChart.destroy();
    }
    
    const labels = categoryData.map(c => c.category || 'Onbekend');
    const data = categoryData.map(c => c.revenue || 0);
    
    // Color scheme for categories
    const colors = {
        'Drank': 'rgba(59, 130, 246, 0.7)',
        'Eten': 'rgba(249, 115, 22, 0.7)',
        'Others': 'rgba(139, 92, 246, 0.7)',
        'Onbekend': 'rgba(107, 114, 128, 0.7)'
    };
    
    const backgroundColors = labels.map(label => colors[label] || colors['Onbekend']);
    const borderColors = labels.map(label => backgroundColors[labels.indexOf(label)].replace('0.7', '1'));
    
    charts.categoryChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 2
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
                            return `${label}: €${value.toLocaleString('nl-NL')} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Update category quantity chart (bar chart)
function updateCategoryQuantityChart(categoryData) {
    const canvas = document.getElementById('categoryQuantityChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart if it exists
    if (charts.categoryQuantityChart) {
        charts.categoryQuantityChart.destroy();
    }
    
    const labels = categoryData.map(c => c.category || 'Onbekend');
    const data = categoryData.map(c => c.quantity || 0);
    
    // Color scheme for categories
    const colors = {
        'Drank': 'rgba(59, 130, 246, 0.7)',
        'Eten': 'rgba(249, 115, 22, 0.7)',
        'Others': 'rgba(139, 92, 246, 0.7)',
        'Onbekend': 'rgba(107, 114, 128, 0.7)'
    };
    
    const backgroundColors = labels.map(label => colors[label] || colors['Onbekend']);
    const borderColors = labels.map(label => backgroundColors[labels.indexOf(label)].replace('0.7', '1'));
    
    charts.categoryQuantityChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Aantal Verkocht',
                data: data,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.parsed.y.toLocaleString('nl-NL')} items`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString('nl-NL');
                        }
                    }
                }
            }
        }
    });
}

// Update top items chart (line chart)
function updateTopItemsChart(itemsData) {
    const canvas = document.getElementById('topItemsChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart if it exists
    if (charts.topItemsChart) {
        charts.topItemsChart.destroy();
    }
    
    const labels = itemsData.map(i => i.itemName || 'Onbekend');
    const soldData = itemsData.map(i => i.sold || 0);
    const revenueData = itemsData.map(i => i.revenue || 0);
    
    charts.topItemsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Aantal Verkocht',
                    data: soldData,
                    borderColor: 'rgba(239, 68, 68, 1)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4,
                    yAxisID: 'y'
                },
                {
                    label: 'Omzet (€)',
                    data: revenueData,
                    borderColor: 'rgba(34, 197, 94, 1)',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    tension: 0.4,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            if (context.datasetIndex === 0) {
                                return `Verkocht: ${context.parsed.y.toLocaleString('nl-NL')}x`;
                            } else {
                                return `Omzet: €${context.parsed.y.toLocaleString('nl-NL')}`;
                            }
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString('nl-NL');
                        }
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    beginAtZero: true,
                    grid: {
                        drawOnChartArea: false
                    },
                    ticks: {
                        callback: function(value) {
                            return `€${value.toLocaleString('nl-NL')}`;
                        }
                    }
                }
            }
        }
    });
}

// Update category statistics cards
function updateCategoryStatistics(categoryStats) {
    const container = document.getElementById('categoriesContainer');
    if (!container) return;
    
    if (!categoryStats || categoryStats.length === 0) {
        container.innerHTML = '<p class="text-gray-500 col-span-full text-center">Geen categorie data beschikbaar</p>';
        return;
    }
    
    const colors = {
        'Drank': 'bg-blue-100 border-blue-300 text-blue-800',
        'Eten': 'bg-orange-100 border-orange-300 text-orange-800',
        'Others': 'bg-purple-100 border-purple-300 text-purple-800',
        'Onbekend': 'bg-gray-100 border-gray-300 text-gray-800'
    };
    
    container.innerHTML = categoryStats.map(cat => {
        const colorClass = colors[cat.category] || colors['Onbekend'];
        return `
            <div class="border-2 rounded-lg p-4 ${colorClass}">
                <h3 class="text-xl font-bold mb-3">${cat.category || 'Onbekend'}</h3>
                <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                        <span>Unieke Items:</span>
                        <span class="font-semibold">${cat.uniqueItems || 0}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Totaal Verkocht:</span>
                        <span class="font-semibold">${(cat.totalSold || 0).toLocaleString('nl-NL')}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Totale Omzet:</span>
                        <span class="font-semibold">€${(cat.totalRevenue || 0).toLocaleString('nl-NL')}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Gem. Prijs:</span>
                        <span class="font-semibold">€${Math.round(cat.avgPrice || 0).toLocaleString('nl-NL')}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Transacties:</span>
                        <span class="font-semibold">${(cat.transactionCount || 0).toLocaleString('nl-NL')}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Update top items per category
function updateTopItemsPerCategory(topItemsPerCategory) {
    const container = document.getElementById('topItemsContainer');
    if (!container) return;
    
    if (!topItemsPerCategory || Object.keys(topItemsPerCategory).length === 0) {
        container.innerHTML = '<p class="text-gray-500 col-span-full text-center">Geen items data beschikbaar</p>';
        return;
    }
    
    const categoryColors = {
        'Drank': {
            bg: 'bg-blue-50',
            border: 'border-blue-200',
            text: 'text-blue-900',
            accent: 'bg-blue-500'
        },
        'Eten': {
            bg: 'bg-orange-50',
            border: 'border-orange-200',
            text: 'text-orange-900',
            accent: 'bg-orange-500'
        },
        'Others': {
            bg: 'bg-purple-50',
            border: 'border-purple-200',
            text: 'text-purple-900',
            accent: 'bg-purple-500'
        },
        'Onbekend': {
            bg: 'bg-gray-50',
            border: 'border-gray-200',
            text: 'text-gray-900',
            accent: 'bg-gray-500'
        }
    };
    
    container.innerHTML = Object.entries(topItemsPerCategory).map(([category, items]) => {
        const colors = categoryColors[category] || categoryColors['Onbekend'];
        
        if (!items || items.length === 0) {
            return `
                <div class="border-2 ${colors.border} rounded-lg p-4 ${colors.bg}">
                    <h3 class="text-lg font-bold mb-3 ${colors.text}">${category}</h3>
                    <p class="text-sm ${colors.text} opacity-70">Geen items verkocht</p>
                </div>
            `;
        }
        
        const maxSold = items[0]?.sold || 1;
        
        return `
            <div class="border-2 ${colors.border} rounded-lg p-4 ${colors.bg}">
                <h3 class="text-lg font-bold mb-3 ${colors.text}">${category}</h3>
                <div class="space-y-3">
                    ${items.map(item => {
                        const widthPercent = ((item.sold || 0) / maxSold) * 100;
                        return `
                            <div class="space-y-1">
                                <div class="flex justify-between text-sm ${colors.text}">
                                    <span class="font-semibold">${item.itemName || 'Onbekend'}</span>
                                    <span class="opacity-70">${(item.sold || 0).toLocaleString('nl-NL')}x</span>
                                </div>
                                <div class="h-2 bg-white rounded-full overflow-hidden border ${colors.border}">
                                    <div class="h-full ${colors.accent} transition-all" style="width: ${widthPercent}%"></div>
                                </div>
                                <div class="text-xs font-semibold ${colors.text} opacity-80">€${(item.revenue || 0).toLocaleString('nl-NL')}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }).join('');
}

// Update cities list
function updateCitiesList(citiesData) {
    const container = document.getElementById('citiesContainer');
    if (!container) return;
    
    if (!citiesData || citiesData.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center">Geen stad data beschikbaar</p>';
        return;
    }
    
    container.innerHTML = citiesData.map((city, index) => {
        const rank = index + 1;
        let rankColor = 'bg-gray-500';
        let rankText = 'text-white';
        
        if (rank === 1) {
            rankColor = 'bg-yellow-500';
        } else if (rank === 2) {
            rankColor = 'bg-gray-400';
        } else if (rank === 3) {
            rankColor = 'bg-orange-600';
        }
        
        return `
            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                <div class="flex items-center space-x-4">
                    <div class="w-10 h-10 ${rankColor} ${rankText} rounded-full flex items-center justify-center font-bold text-lg">
                        ${rank}
                    </div>
                    <div>
                        <h3 class="font-bold text-lg text-gray-800">${city.city || 'Onbekend'}</h3>
                        <p class="text-sm text-gray-600">${(city.eventCount || 0)} evenement${(city.eventCount || 0) !== 1 ? 'en' : ''}</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="font-semibold text-gray-800">${(city.visitorCount || 0).toLocaleString('nl-NL')} bezoekers</p>
                    <p class="text-sm text-gray-600">€${(city.totalRevenue || 0).toLocaleString('nl-NL')} omzet</p>
                </div>
            </div>
        `;
    }).join('');
}

