// Dashboard Scripts for real-time updates and interactions

let dashboardUpdateInterval = null;

// Initialize dashboard updates
document.addEventListener('DOMContentLoaded', () => {
    // Start polling for updates every 5 seconds
    dashboardUpdateInterval = setInterval(updateDashboardData, 5000);
    
    // Also update FestCoins every 3 seconds (more frequent for balance)
    setInterval(updateDashboardFestCoins, 3000);
    
    // Initial update
    updateDashboardData();
    updateDashboardFestCoins();
    
    // Close modals when clicking outside
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-backdrop')) {
            closeAllModals();
        }
    });
});

// Update dashboard data
async function updateDashboardData() {
    try {
        // Only update if we're on analytics tab
        const analyticsTab = document.getElementById('analyticsTab');
        if (!analyticsTab || analyticsTab.classList.contains('hidden')) {
            return;
        }
        
        const response = await fetch('/dashboard/data');
        const data = await response.json();
        
        if (data.success) {
            updateCategorySpending(data.categorySpending);
            updateEventSpending(data.eventSpending);
            updateRecentTransactions(data.recentTransactions);
            updateTodaySpending(data.todaySpending);
            updateTotalSpending(data.totalSpending);
        }
        
        // Also update FestCoins balance
        updateDashboardFestCoins();
    } catch (error) {
        console.error('Error updating dashboard:', error);
    }
}

// Update FestCoins balance in dashboard
async function updateDashboardFestCoins() {
    try {
        const response = await fetch('/user/festcoins');
        const data = await response.json();
        if (data.success) {
            const festCoinsDisplay = document.getElementById('dashboardFestCoinsDisplay');
            if (festCoinsDisplay) {
                festCoinsDisplay.textContent = data.festCoins;
            }
        }
    } catch (error) {
        console.error('Error updating dashboard FestCoins:', error);
    }
}

// Update category spending
function updateCategorySpending(categorySpending) {
    const categoryData = categorySpending || [];
    const totalSpending = categoryData.reduce((sum, cat) => sum + (cat.total || 0), 0);
    
    if (totalSpending === 0) return;
    
    // Update pie chart
    const canvas = document.getElementById('categoryChart');
    if (canvas) {
        drawPieChart(canvas, categoryData, totalSpending);
    }
    
    // Update legend
    const legendContainer = document.querySelector('#categoryLegend');
    if (legendContainer) {
        const colors = {
            'Drank': '#8B5CF6',
            'Eten': '#F59E0B',
            'Others': '#10B981'
        };
        
        legendContainer.innerHTML = categoryData.map(cat => {
            const percentage = Math.round((cat.total / totalSpending) * 100);
            return `
                <li class="flex justify-between items-center bg-gray-50 p-3 border border-purple-500 rounded">
                    <div class="flex items-center gap-2">
                        <div class="w-4 h-4 rounded-full" style="background-color: ${colors[cat.category] || '#6B7280'}"></div>
                        <span>${cat.category}</span>
                    </div>
                    <div class="text-right">
                        <span class="font-semibold">${cat.total} FestCoins</span>
                        <span class="text-sm text-gray-500 ml-2">(${percentage}%)</span>
                    </div>
                </li>
            `;
        }).join('');
    }
}

// Draw pie chart
function drawPieChart(canvas, categoryData, totalSpending) {
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 80;
    
    const colors = {
        'Drank': '#8B5CF6',
        'Eten': '#F59E0B',
        'Others': '#10B981'
    };
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    let currentAngle = -Math.PI / 2; // Start at top
    
    categoryData.forEach(cat => {
        if (cat.total === 0) return;
        
        const sliceAngle = (cat.total / totalSpending) * 2 * Math.PI;
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
        ctx.closePath();
        ctx.fillStyle = colors[cat.category] || '#6B7280';
        ctx.fill();
        
        // Add label
        const labelAngle = currentAngle + sliceAngle / 2;
        const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
        const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
        const percentage = Math.round((cat.total / totalSpending) * 100);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(percentage + '%', labelX, labelY);
        
        currentAngle += sliceAngle;
    });
}

// Update event spending (list only, no chart)
function updateEventSpending(eventSpending) {
    const eventData = eventSpending || [];
    const container = document.querySelector('#eventSpendingContainer');
    
    if (!container) return;
    
    if (eventData.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <p>Nog geen uitgaven bij evenementen.</p>
            </div>
        `;
        return;
    }
    
    // Create list (no chart)
    const maxSpending = Math.max(...eventData.map(e => e.total), 1);
    
    container.innerHTML = `
        <div class="space-y-3" id="eventList">
            ${eventData.map(event => {
                const barWidth = (event.total / maxSpending) * 100;
                const lastVisit = event.lastVisit ? new Date(event.lastVisit) : null;
                const lastVisitStr = lastVisit ? lastVisit.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
                return `
                    <div class="event-card cursor-pointer hover:bg-gray-50 p-3 border border-purple-500 rounded transition-colors" 
                         data-event-id="${event.eventId}"
                         onclick="showEventDetails(${event.eventId}, '${event.eventName.replace(/'/g, "\\'")}')">
                        <div class="flex justify-between items-center mb-2">
                            <div>
                                <h3 class="font-semibold text-gray-800">${event.eventName}</h3>
                                ${lastVisitStr ? `<p class="text-xs text-gray-500">Laatste bezoek: ${lastVisitStr}</p>` : ''}
                            </div>
                            <span class="font-bold text-purple-600">${event.total} FestCoins</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="bg-purple-500 h-2 rounded-full transition-all duration-300" 
                                 style="width: ${barWidth}%"></div>
                        </div>
                        <p class="text-xs text-gray-500 mt-1">${event.transactionCount} transactie(s)</p>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// Draw event bar chart
function drawEventChart(eventData) {
    const canvas = document.getElementById('eventChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const maxSpending = Math.max(...eventData.map(e => e.total), 1);
    const barWidth = canvas.width / (eventData.length * 1.5);
    const barSpacing = barWidth * 0.5;
    const maxBarHeight = canvas.height - 60;
    const startX = 40;
    const startY = canvas.height - 40;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw bars
    eventData.forEach((event, index) => {
        const x = startX + index * (barWidth + barSpacing);
        const barHeight = (event.total / maxSpending) * maxBarHeight;
        const y = startY - barHeight;
        
        // Draw bar
        ctx.fillStyle = '#8B5CF6';
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // Draw value on top
        ctx.fillStyle = '#1F2937';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(event.total, x + barWidth / 2, y - 5);
        
        // Draw event name (truncated)
        ctx.fillStyle = '#6B7280';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        const eventName = event.eventName.length > 15 ? event.eventName.substring(0, 12) + '...' : event.eventName;
        ctx.fillText(eventName, x + barWidth / 2, startY + 15);
    });
    
    // Draw Y-axis
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(startX - 10, 0);
    ctx.lineTo(startX - 10, startY);
    ctx.lineTo(canvas.width, startY);
    ctx.stroke();
}

// Update recent transactions
function updateRecentTransactions(transactions) {
    const transactionData = transactions || [];
    const container = document.getElementById('recentTransactionsList');
    
    if (!container) return;
    
    if (transactionData.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <p>Nog geen transacties.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = transactionData.map(trans => {
        const date = new Date(trans.date);
        const dateStr = date.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit' });
        const timeStr = date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
        const items = trans.items ? trans.items.split(' | ').slice(0, 2).join(', ') : 'Items';
        const eventName = trans.eventName || 'Onbekend event';
        const stationName = trans.stationName || 'Onbekend station';
        
        return `
            <div class="flex justify-between items-center border-2 bg-gray-50 p-4 rounded shadow">
                <div>
                    <p class="font-semibold">
                        ${items}${trans.items && trans.items.split(' | ').length > 2 ? '...' : ''}
                    </p>
                    <p class="text-sm text-gray-500">
                        ${eventName} • ${stationName} • ${dateStr} ${timeStr}
                    </p>
                </div>
                <p class="font-bold text-red-500">
                    -${trans.totalPrice} FestCoins
                </p>
            </div>
        `;
    }).join('');
}

// Update today spending
function updateTodaySpending(todaySpending) {
    const todaySpendingEl = document.getElementById('todaySpendingDisplay');
    if (todaySpendingEl) {
        todaySpendingEl.textContent = todaySpending || 0;
    }
}

// Update total spending
function updateTotalSpending(totalSpending) {
    const totalSpendingEl = document.getElementById('totalSpendingDisplay');
    if (totalSpendingEl) {
        totalSpendingEl.textContent = totalSpending || 0;
    }
}

// Close all modals
function closeAllModals() {
    document.getElementById('eventDetailsModal')?.classList.add('hidden');
    document.getElementById('allTransactionsModal')?.classList.add('hidden');
    document.querySelectorAll('.transaction-detail-modal').forEach(modal => modal.remove());
}

// Show transaction details (for transactions tab)
window.showTransactionDetails = async function(transactionId, isGroepspot = false) {
    try {
        const response = await fetch(`/dashboard/transaction/${transactionId}/details`);
        const data = await response.json();
        
        if (data.success && data.transaction) {
            const trans = data.transaction;
            const date = new Date(trans.date);
            const dateStr = date.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' });
            const timeStr = date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
            
            let content = '';
            
            if (trans.isGroepspot && trans.groepspotDetails) {
                const gs = trans.groepspotDetails;
                
                content = `
                    <div class="mb-4">
                        <p class="text-sm text-gray-500">Event</p>
                        <p class="font-semibold text-lg">${gs.eventName || 'Onbekend'}</p>
                        ${gs.eventLocation ? `<p class="text-sm text-gray-600 mt-1">📍 ${gs.eventLocation}</p>` : ''}
                    </div>
                    <div class="mb-4">
                        <p class="text-sm text-gray-500">Station</p>
                        <p class="font-semibold">${gs.stationName || 'Onbekend'}</p>
                    </div>
                    <div class="mb-4">
                        <p class="text-sm text-gray-500">Datum & Tijd</p>
                        <p class="font-semibold">${dateStr} om ${timeStr}</p>
                    </div>
                    <div class="mb-4 p-4 bg-purple-50 rounded-lg">
                        <p class="text-sm text-gray-500 mb-1">Totale Prijs</p>
                        <p class="font-bold text-2xl text-red-500">${gs.totalAmount} FestCoins</p>
                    </div>
                    <div class="mb-4">
                        <p class="text-sm text-gray-500 mb-2">Jouw Bijdrage</p>
                        <p class="font-semibold text-lg">${gs.creatorContribution || 0} FestCoins</p>
                    </div>
                    <div class="mb-4">
                        <p class="text-sm text-gray-500 mb-2">Alle Bijdragen</p>
                        <div class="space-y-2 max-h-40 overflow-y-auto">
                            ${gs.contributions && gs.contributions.length > 0 ? gs.contributions.map(contrib => {
                                const contribDate = new Date(contrib.createdAt);
                                const contribDateStr = contribDate.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit' });
                                const contribTimeStr = contribDate.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
                                return `
                                    <div class="flex justify-between items-center bg-gray-50 p-2 rounded">
                                        <div>
                                            <p class="font-medium">${contrib.contributorName || 'Onbekend'}</p>
                                            <p class="text-xs text-gray-500">${contribDateStr} om ${contribTimeStr}</p>
                                        </div>
                                        <p class="font-semibold text-purple-600">${contrib.amount} FestCoins</p>
                                    </div>
                                `;
                            }).join('') : '<p class="text-gray-500 text-sm">Geen andere bijdragen</p>'}
                        </div>
                    </div>
                    <div class="mb-4">
                        <p class="text-sm text-gray-500 mb-2">Items</p>
                        <div class="space-y-2">
                            ${gs.items && gs.items.length > 0 ? gs.items.map(item => `
                                <div class="flex justify-between items-center bg-gray-50 p-2 rounded">
                                    <div>
                                        <p class="font-semibold">${item.itemName}</p>
                                    </div>
                                    <div class="text-right">
                                        <p class="font-semibold">${item.quantity}x</p>
                                        <p class="text-sm text-gray-600">${item.itemPrice * item.quantity} FestCoins</p>
                                    </div>
                                </div>
                            `).join('') : '<p class="text-gray-500 text-sm">Geen items</p>'}
                        </div>
                    </div>
                `;
            } else {
                let itemsHtml = '';
                if (trans.items && trans.items.length > 0) {
                    itemsHtml = '<div class="space-y-2 mt-2">';
                    trans.items.forEach(item => {
                        itemsHtml += `
                            <div class="flex justify-between items-center bg-gray-50 p-2 rounded">
                                <div>
                                    <p class="font-semibold">${item.itemName}</p>
                                    <p class="text-xs text-gray-500">${item.category || ''} • ${item.stationName || ''}</p>
                                </div>
                                <div class="text-right">
                                    <p class="font-semibold">${item.quantity}x</p>
                                    <p class="text-sm text-gray-600">${item.itemPrice * item.quantity} FestCoins</p>
                                </div>
                            </div>
                        `;
                    });
                    itemsHtml += '</div>';
                }
                
                content = `
                    <div class="mb-4">
                        <p class="text-sm text-gray-500">Event</p>
                        <p class="font-semibold text-lg">${trans.eventName || 'Onbekend'}</p>
                        ${trans.eventLocation ? `<p class="text-sm text-gray-600 mt-1">📍 ${trans.eventLocation}</p>` : ''}
                    </div>
                    <div class="mb-4">
                        <p class="text-sm text-gray-500">Datum & Tijd</p>
                        <p class="font-semibold">${dateStr} om ${timeStr}</p>
                    </div>
                    <div class="mb-4">
                        <p class="text-sm text-gray-500">Totaal</p>
                        <p class="font-bold text-2xl text-red-500">${trans.totalPrice} FestCoins</p>
                    </div>
                    <div class="mb-4">
                        <p class="text-sm text-gray-500 mb-2">Items</p>
                        ${itemsHtml || '<p class="text-gray-500">Geen items beschikbaar</p>'}
                    </div>
                `;
            }
            
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center modal-backdrop transaction-detail-modal';
            modal.innerHTML = `
                <div class="bg-white rounded-2xl p-6 max-w-2xl w-full mx-4 shadow-xl max-h-[85vh] flex flex-col relative">
                    <div class="flex justify-between items-center mb-4 sticky top-0 bg-white pb-2 border-b z-10">
                        <h3 class="text-2xl font-bold text-gray-800">Transactie Details</h3>
                        <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">&times;</button>
                    </div>
                    <div class="overflow-y-auto flex-1">
                        ${content}
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        } else {
            alert('Kon transactie details niet laden: ' + (data.error || 'Onbekende fout'));
        }
    } catch (error) {
        console.error('Error loading transaction details:', error);
        alert('Er is een fout opgetreden bij het laden van de transactie details.');
    }
};

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (dashboardUpdateInterval) {
        clearInterval(dashboardUpdateInterval);
    }
});

