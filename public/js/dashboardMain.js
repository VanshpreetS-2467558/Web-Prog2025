// Dashboard main script
document.addEventListener('DOMContentLoaded', () => {
    // Set user role from data attribute if available
    const userRoleEl = document.getElementById('userRoleData');
    if (userRoleEl) {
        window.userRole = userRoleEl.dataset.role;
    }
    
    // Initialize - show analytics tab by default
    showTab('analytics');
});

window.showTab = function(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content-dashboard').forEach(tab => {
        tab.classList.add('hidden');
    });
    
    // Remove active styling from all buttons
    document.querySelectorAll('.tab-btn-dashboard').forEach(btn => {
        btn.classList.remove('border-purple-500', 'text-purple-500');
        btn.classList.add('border-transparent', 'text-gray-500');
    });
    
    // Show selected tab
    const selectedTab = document.getElementById(tabName + 'Tab');
    if (selectedTab) {
        selectedTab.classList.remove('hidden');
    }
    
    // Add active styling to clicked button
    const clickedBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (clickedBtn) {
        clickedBtn.classList.remove('border-transparent', 'text-gray-500');
        clickedBtn.classList.add('border-purple-500', 'text-purple-500');
    }
    
    // Show/hide recent transactions section
    const recentSection = document.getElementById('recentTransactionsSection');
    if (recentSection) {
        if (tabName === 'analytics') {
            recentSection.classList.remove('hidden');
            
        } else {
            recentSection.classList.add('hidden');
        }
    }
    
    // Load transactions if transactions tab is selected
    if (tabName === 'transactions') {
        if (typeof loadTransactionsTab === 'function') {
            loadTransactionsTab();
        }
        // Scroll naar boven wanneer transacties tab wordt geselecteerd
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

async function loadTransactionsTab() {
    try {
        const response = await fetch('/dashboard/transactions');
        const data = await response.json();
        
        if (data.success) {
            renderTransactionsTab(data.transactions);
        } else {
            document.getElementById('transactionsTabContent').innerHTML = `
                <div class="text-center py-8 text-red-500">
                    <p>Fout bij het laden van transacties: ${data.error}</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading transactions:', error);
        document.getElementById('transactionsTabContent').innerHTML = `
            <div class="text-center py-8 text-red-500">
                <p>Er is een fout opgetreden bij het laden van transacties.</p>
            </div>
        `;
    }
}

function renderTransactionsTab(transactions) {
    const container = document.getElementById('transactionsTabContent');
    
    if (!transactions || transactions.length === 0) {
        container.innerHTML = `
            <div class="border-2 p-6 shadow rounded-xl">
                <h2 class="text-2xl font-bold mb-4">Alle Transacties</h2>
                <div class="text-center py-8 text-gray-500">
                    <p>Nog geen transacties.</p>
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="border-2 p-6 shadow rounded-xl">
            <h2 class="text-2xl font-bold mb-4">Alle Transacties</h2>
            <div class="space-y-4">
                ${transactions.map(trans => {
                    const date = new Date(trans.date);
                    const dateStr = date.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' });
                    const timeStr = date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
                    const eventName = trans.eventName || 'Onbekend event';
                    const stationName = trans.stationName || 'Onbekend station';
                    const items = trans.items || 'Geen items';
                    const isGroepspot = trans.isGroepspot || false;
                    
                    return `
                        <div class="border-2 bg-gray-50 p-4 rounded-lg shadow hover:bg-gray-100 transition-colors cursor-pointer" 
                             onclick="showTransactionDetails(${trans.id}, ${isGroepspot ? 'true' : 'false'})">
                            <div class="flex justify-between items-start mb-2">
                                <div class="flex-1">
                                    <div class="flex items-center gap-2 mb-1">
                                        <p class="font-semibold text-lg">${eventName}</p>
                                        ${isGroepspot ? '<span class="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-semibold">Groepspot</span>' : ''}
                                    </div>
                                    <p class="text-sm text-gray-500">${stationName}</p>
                                    <p class="text-xs text-gray-400 mt-1">${dateStr} om ${timeStr}</p>
                                </div>
                                <p class="font-bold text-red-500 text-lg">-${trans.totalPrice} FestCoins</p>
                            </div>
                            <div class="mt-2 pt-2 border-t border-gray-300">
                                <p class="text-sm text-gray-600">
                                    <strong>Items:</strong> ${items}
                                </p>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

window.loadTransactionsTab = loadTransactionsTab;
window.renderTransactionsTab = renderTransactionsTab;

