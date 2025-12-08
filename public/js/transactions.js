// Transactions JavaScript for dashboard
document.addEventListener('DOMContentLoaded', () => {
    const recentTransactionsContainer = document.getElementById('recentTransactions');
    const viewAllBtn = document.getElementById('viewAllTransactionsBtn');
    const modal = document.getElementById('allTransactionsModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const allTransactionsList = document.getElementById('allTransactionsList');

    if (!recentTransactionsContainer) return; // Not on dashboard

    // Load recent transactions
    loadRecentTransactions();

    // Open modal when button is clicked
    if (viewAllBtn) {
        viewAllBtn.addEventListener('click', () => {
            loadAllTransactions();
            modal.classList.remove('hidden');
        });
    }

    // Close modal
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
        });
    }

    // Close modal when clicking outside
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });
    }

    // Auto-refresh recent transactions every 30 seconds
    setInterval(loadRecentTransactions, 30000);
});

async function loadRecentTransactions() {
    const container = document.getElementById('recentTransactions');
    if (!container) return;

    try {
        const eventSelect = document.getElementById('eventSelect');
        const params = new URLSearchParams();
        if (eventSelect && eventSelect.value) {
            params.append('eventId', eventSelect.value);
        }

        const response = await fetch(`/transactions/recent?${params.toString()}`);
        const result = await response.json();

        if (result.success) {
            renderRecentTransactions(result.transactions);
        } else {
            container.innerHTML = '<p class="text-red-500">Fout bij laden van transacties</p>';
        }
    } catch (err) {
        console.error('Error loading recent transactions:', err);
        const container = document.getElementById('recentTransactions');
        if (container) {
            container.innerHTML = '<p class="text-red-500">Fout bij laden van transacties</p>';
        }
    }
}

function renderRecentTransactions(transactions) {
    const container = document.getElementById('recentTransactions');
    if (!container) return;

    if (!transactions || transactions.length === 0) {
        container.innerHTML = '<p class="text-gray-500">Geen transacties gevonden</p>';
        return;
    }

    // Check if user is organizer (eventSelect only exists for organizers)
    const isOrganizer = (window.userRole === 'organisator' || window.userRole === 'employee');


    container.innerHTML = transactions.map(t => {
        const date = new Date(t.date);
        const time = date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
        // For organizers, show positive numbers (revenue). For others, show negative (expense)
        const amount = isOrganizer ? t.totalPrice : -t.totalPrice;
        const colorClass = isOrganizer ? 'text-green-500' : 'text-red-500';
        // Items now includes quantity: "Item Name (2x), Another Item (1x)"
        const itemsString = t.items || t.itemName || 'Transactie';
        // Split by comma and format with proper spacing
        const itemsArray = itemsString.split(',').map(item => item.trim());
        const itemsFormatted = itemsArray.length > 1 
            ? itemsArray.map(item => `<span class="inline-block mr-2">${item}</span>`).join('')
            : itemsString;
        
        return `
            <div class="flex justify-between items-center border-2 bg-gray-50 p-4 rounded shadow">
                <div class="flex-1">
                    <div class="font-semibold ${itemsArray.length > 1 ? 'flex flex-wrap gap-2' : ''}">${itemsFormatted}</div>
                    <p class="text-sm text-gray-500 mt-1">${t.stationName || 'Onbekend Station'} • ${time}</p>
                </div>
                <p class="font-bold ${colorClass} ml-4">
                    ${amount} FestCoins
                </p>
            </div>
        `;
    }).join('');
}

async function loadAllTransactions() {
    const container = document.getElementById('allTransactionsList');
    if (!container) return;

    container.innerHTML = '<p class="text-gray-500">Laden...</p>';

    try {
        const eventSelect = document.getElementById('eventSelect');
        const params = new URLSearchParams();
        if (eventSelect && eventSelect.value) {
            params.append('eventId', eventSelect.value);
        }

        const response = await fetch(`/transactions/all?${params.toString()}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();

        if (result.success) {
            renderAllTransactions(result.transactions);
        } else {
            console.error('API error:', result.error);
            container.innerHTML = `<p class="text-red-500">Fout bij laden van transacties: ${result.error || 'Onbekende fout'}</p>`;
        }
    } catch (err) {
        console.error('Error loading all transactions:', err);
        container.innerHTML = `<p class="text-red-500">Fout bij laden van transacties: ${err.message}</p>`;
    }
}

function renderAllTransactions(transactions) {
    const container = document.getElementById('allTransactionsList');
    if (!container) return;

    if (!transactions || transactions.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-8">Geen transacties gevonden</p>';
        return;
    }

    // Check if user is organizer (eventSelect only exists for organizers)
    const isOrganizer = (window.userRole === 'organisator' || window.userRole === 'employee');


    container.innerHTML = transactions.map(t => {
        const date = new Date(t.date);
        const dateStr = date.toLocaleDateString('nl-NL', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        const time = date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
        // For organizers, show positive numbers (revenue). For others, show negative (expense)
        const amount = isOrganizer ? t.totalPrice : -t.totalPrice;
        const colorClass = isOrganizer ? 'text-green-500' : 'text-red-500';
        const itemsString = t.items || t.itemName || 'Transactie';
        // Split by comma and format with proper spacing
        const itemsArray = itemsString.split(',').map(item => item.trim());
        const itemsFormatted = itemsArray.length > 1 
            ? itemsArray.map(item => `<span class="inline-block mr-2 mb-1">${item}</span>`).join('')
            : itemsString;
        
        return `
            <div class="flex justify-between items-center border-2 bg-gray-50 p-4 rounded shadow hover:bg-gray-100 transition-colors">
                <div class="flex-1">
                    <div class="font-semibold ${itemsArray.length > 1 ? 'flex flex-wrap gap-2' : ''}">${itemsFormatted}</div>
                    <p class="text-sm text-gray-500 mt-1">${t.stationName || 'Onbekend Station'}</p>
                    <p class="text-xs text-gray-400 mt-1">${dateStr} om ${time}</p>
                </div>
                <div class="text-right ml-4">
                    <p class="font-bold ${colorClass} text-lg">
                        ${amount} FestCoins
                    </p>
                </div>
            </div>
        `;
    }).join('');
}

// Reload when event selection changes (for organizers)
document.addEventListener('change', (e) => {
    if (e.target.id === 'eventSelect') {
        loadRecentTransactions();
    }
});
