// Bezoeker totale uitgaven script
window.showEventDetails = async function(eventId, eventName) {
    try {
        const response = await fetch(`/dashboard/event/${eventId}/details`);
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('eventDetailsTitle').textContent = eventName;
            
            // All content in one column, stacked vertically
            const eventInfo = data.details.eventInfo || {};
            const startDate = eventInfo.startDate ? new Date(eventInfo.startDate) : null;
            const endDate = eventInfo.endDate ? new Date(eventInfo.endDate) : null;
            const startDateStr = startDate ? startDate.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + startDate.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }) : 'Onbekend';
            const endDateStr = endDate ? endDate.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + endDate.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }) : 'Onbekend';
            
            let content = `
                <div class="mb-6">
                    <h4 class="text-lg font-semibold mb-2 text-gray-700">Event Informatie</h4>
                    <p class="text-xl font-bold text-gray-800">${eventName}</p>
                    ${eventInfo.description ? `<p class="text-sm text-gray-600 mt-2">${eventInfo.description}</p>` : ''}
                    ${eventInfo.location ? `<p class="text-sm text-gray-700 mt-2"><strong>📍 Locatie:</strong> ${eventInfo.location}</p>` : ''}
                    <div class="mt-2 text-sm text-gray-600">
                        <p><strong>Start:</strong> ${startDateStr}</p>
                        <p><strong>Einde:</strong> ${endDateStr}</p>
                    </div>
                </div>
                
                <div class="mb-6 p-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg">
                    <h4 class="text-lg font-semibold mb-2 text-gray-700">Totaal uitgegeven</h4>
                    <p class="text-3xl font-bold text-purple-600">${data.details.total} FestCoins</p>
                </div>
                
                <div class="mb-6">
                    <h4 class="text-lg font-semibold mb-3 text-gray-700">Uitgaven per categorie</h4>
                    <div class="space-y-2">
            `;
            
            if (data.details.categoryBreakdown && data.details.categoryBreakdown.length > 0) {
                data.details.categoryBreakdown.forEach(cat => {
                    content += `
                        <div class="flex justify-between items-center bg-gray-50 p-3 rounded border border-purple-200">
                            <span class="font-medium">${cat.category}</span>
                            <span class="font-bold text-purple-600">${cat.total} FestCoins</span>
                        </div>
                    `;
                });
            } else {
                content += `<p class="text-gray-500 text-sm">Geen categorie data beschikbaar</p>`;
            }
            
            content += `</div></div>`;
            
            // Transactions section
            content += `
                <div class="mb-4">
                    <h4 class="text-lg font-semibold mb-3 text-gray-700">Transacties</h4>
                    <div class="space-y-2 max-h-60 overflow-y-auto border-2 border-gray-300 rounded-lg p-3">
            `;
            
            if (data.details.transactions && data.details.transactions.length > 0) {
                data.details.transactions.forEach(trans => {
                    const date = new Date(trans.date);
                    const dateStr = date.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' });
                    const timeStr = date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
                    
                    content += `
                        <div class="border rounded p-2 bg-gray-50 hover:bg-gray-100 transition-colors">
                            <div class="flex justify-between items-center">
                                <div class="flex-1 min-w-0">
                                    <p class="font-medium text-xs truncate">${trans.items || 'Items'}</p>
                                    <p class="text-xs text-gray-500">${dateStr} om ${timeStr}</p>
                                </div>
                                <p class="font-bold text-purple-600 text-sm ml-2">${trans.totalPrice} FestCoins</p>
                            </div>
                        </div>
                    `;
                });
            } else {
                content += `<p class="text-gray-500 text-sm">Geen transacties beschikbaar</p>`;
            }
            
            content += `</div></div>`;
            
            // Update content
            document.getElementById('eventDetailsContent').innerHTML = content;
            document.getElementById('eventDetailsModal').classList.remove('hidden');
        } else {
            alert('Kon event details niet laden: ' + data.error);
        }
    } catch (error) {
        console.error('Error loading event details:', error);
        alert('Er is een fout opgetreden bij het laden van de event details.');
    }
}

function closeEventDetails() {
    const modal = document.getElementById('eventDetailsModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Make closeEventDetails available globally
window.closeEventDetails = closeEventDetails;

// Draw pie chart
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('categoryChart');
    if (!canvas) return;
    
    // Get category data from data attribute
    const categoryDataEl = document.getElementById('categoryData');
    if (!categoryDataEl) return;
    
    const categoryData = JSON.parse(categoryDataEl.textContent || '[]');
    const totalSpending = categoryData.reduce((sum, cat) => sum + (cat.total || 0), 0);
    
    if (totalSpending === 0) return;
    
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 80;
    
    const colors = {
        'Drank': '#8B5CF6',
        'Eten': '#F59E0B',
        'Others': '#10B981'
    };
    
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
});
