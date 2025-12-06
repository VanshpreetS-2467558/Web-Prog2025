import { showNotification } from "./headerScripts.js";

// hulpfunctie voor display te updaten
function updateFestCoinDisplay(newAmount){
    document.getElementById("festCoinsSaldo").textContent = newAmount;
    document.getElementById("festCoinsHeader").textContent = "FestCoins: " + newAmount;
    document.getElementById("festCoinsLimitsell").textContent = "Beschikbaar: " + newAmount +  " FestCoins";
    document.getElementById("festCoinsLimitsell2").textContent = "Beschikbaar: " + newAmount +  " FestCoins";
    document.getElementById("shareAmount").max = newAmount;
    document.getElementById("sellAmount").max = newAmount;
}

// functie voor het kopen van FestCoins
document.getElementById("koopform").addEventListener("submit", async (e) => {
    e.preventDefault();
    const buyAmount = parseInt(document.getElementById("buyAmount").value);
    const errorMsg = document.getElementById("errorMsgKoop")

    if(!buyAmount) return errorMsg.textContent = "Geef een waarde in.";
    if (buyAmount <= 0) return errorMsg.textContent = "Geef een waarde groter dan nul in.";

    const res = await fetch("/coins/addAmount", {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({ buyAmount }),
                });
    const result = await res.json();

    if(result.success){
        sessionStorage.setItem('showNotification', `Succesvol ${buyAmount} FestCoins toegevoegd.`);
        document.getElementById("buyAmount").value="";
        updateFestCoinDisplay(result.newAmount);
        // Refresh page to update transactions
        window.location.reload();
    } else{
        errorMsg.textContent = result.error;
    }
});

document.getElementById("verkoopform").addEventListener("submit", async (e) => {
    e.preventDefault();

    const sellAmount = parseInt(document.getElementById("sellAmount").value);
    const errorMsg = document.getElementById("errorMsgVerkoop")

    if(!sellAmount) return errorMsg.textContent = "Geef een waarde in.";
    if(sellAmount <= 0) return errorMsg.textContent = "Geef een waarde groter dan nul in."

    const res = await fetch("/coins/sellAmount", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ sellAmount }),
    });
    const result = await res.json();

    if(result.success){
        sessionStorage.setItem('showNotification', `Succesvol ${sellAmount} FestCoins teruggestort.`);
        document.getElementById("sellAmount").value = "";
        updateFestCoinDisplay(result.newAmount);
        // Refresh page to update transactions
        window.location.reload();
    } else{
        errorMsg.textContent = result.error;
    }
});

// Wait for DOM to be ready before adding event listener
document.addEventListener('DOMContentLoaded', () => {
    const shareForm = document.getElementById("shareform");
    if (shareForm) {
        shareForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const shareAmount = parseInt(document.getElementById("shareAmount").value);
            const shareReceiver = parseInt(document.getElementById("shareReceiver").value);
            const errorMsg = document.getElementById("errorMsgShare")

            if( !shareAmount || !shareReceiver) return errorMsg.textContent = "Vul alle velden in!";
            if(shareAmount <= 0) return errorMsg.textContent = "Geef een waarde groter dan nul in."

            const res = await fetch("/coins/shareAmount", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({ shareAmount, shareReceiver }),
            });
            const result = await res.json();

            if(result.success){
                sessionStorage.setItem('showNotification', `Succesvol ${shareAmount} FestCoins gestuurd!`);
                document.getElementById("shareAmount").value = "";
                document.getElementById("shareReceiver").value = "";
                updateFestCoinDisplay(result.newAmount);
                // Refresh page to update transactions
                window.location.reload();
            } else{
                errorMsg.textContent = result.error;
            }
        });
    }
});

// Load all transactions
async function loadAllTransactions() {
    try {
        const res = await fetch("/coins/festcoins-transactions");
        const data = await res.json();
        if (data.success && data.transactions) {
            renderAllTransactions(data.transactions);
        } else {
            const container = document.getElementById("allTransactionsList");
            if (container) {
                container.innerHTML = '<p class="text-gray-500 text-center py-4">Geen transacties gevonden</p>';
            }
        }
    } catch (err) {
        console.error('Error loading all transactions:', err);
        const container = document.getElementById("allTransactionsList");
        if (container) {
            container.innerHTML = '<p class="text-red-500 text-center py-4">Fout bij het laden van transacties</p>';
        }
    }
}

function openAllTransactions() {
    const popup = document.getElementById('allTransactionsPopup');
    if (popup) {
        popup.classList.remove('hidden');
        loadAllTransactions();
    }
}

window.openAllTransactions = openAllTransactions;

function renderAllTransactions(transactions) {
    const container = document.getElementById("allTransactionsList");
    if (!container) return;

    if (transactions.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-4">Geen transacties gevonden</p>';
        return;
    }

    container.innerHTML = transactions.map(transaction => {
        let icon, label;
        if (transaction.type === 'buy') {
            icon = 'fa-arrow-down-left text-green-500';
            label = 'FestCoins gekocht';
        } else if (transaction.type === 'sell') {
            icon = 'fa-arrow-up-right text-red-500';
            label = 'FestCoins verkocht';
        } else if (transaction.type === 'send') {
            icon = 'fa-paper-plane text-blue-500';
            label = 'FestCoins gestuurd';
        } else if (transaction.type === 'receive') {
            icon = 'fa-inbox text-green-500';
            label = 'FestCoins ontvangen';
        } else if (transaction.type === 'groepspot') {
            icon = 'fa-users text-purple-500';
            label = 'Groepspot bijdrage';
        } else if (transaction.type === 'reward') {
            icon = 'fa-star text-yellow-500';
            label = transaction.description || 'FestSpark BONUS';
        } else {
            icon = 'fa-question text-gray-500';
            label = transaction.description || 'Onbekende transactie';
        }

        const date = new Date(transaction.createdAt).toLocaleString('nl-NL');
        const relatedUserInfo = (transaction.type === 'send' || transaction.type === 'receive') && transaction.relatedUserName
            ? `<p class="text-xs text-blue-600 font-medium">${transaction.type === 'send' ? 'Naar' : 'Van'}: ${transaction.relatedUserName}</p>`
            : '';
        
        return `
            <div class="flex justify-between items-center p-3 bg-gray-100 rounded-lg">
                <div class="flex items-center gap-3">
                    <i class="fa-solid ${icon}"></i>
                    <div>
                        <p class="font-medium">${label}</p>
                        ${relatedUserInfo}
                        <p class="text-sm text-gray-500">${date}</p>
                        ${transaction.description ? `<p class="text-xs text-gray-400">${transaction.description}</p>` : ''}
                    </div>
                </div>
                <div class="text-right">
                    <p class="font-semibold ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}">
                        ${transaction.amount > 0 ? '+' : ''}${transaction.amount} FestCoins
                    </p>
                </div>
            </div>
        `;
    }).join('');
}

window.openAllTransactions = function() {
    const popup = document.getElementById('allTransactionsPopup');
    if(popup) {
        popup.classList.remove('hidden');
        loadAllTransactions();
    } else {
        console.error('Popup element not found');
    }
}

window.closeAllTransactions = function() {
    document.getElementById('allTransactionsPopup').classList.add('hidden');
}

// Load transactions on page load
document.addEventListener('DOMContentLoaded', () => {
    // Load initial transactions
    loadInitialTransactions();
});

async function loadInitialTransactions() {
    try {
        // Update FestCoins
        const festRes = await fetch('/list/user/festcoins');
        const festData = await festRes.json();
        if(festData.success){
            updateFestCoinDisplay(festData.festCoins);
        }

        // Update transactions
        const transRes = await fetch('/list/user/transactions');
        const transData = await transRes.json();
        if(transData.success){
            updateTransactionsDisplay(transData.transactions);
        }
    } catch(err){
        console.error('Error loading wallet data:', err);
    }
}

function updateTransactionsDisplay(transactions){
    const container = document.getElementById('transactionsList');
    if(!container) return;

    if(transactions.length === 0){
        container.innerHTML = '<p class="text-gray-500 text-center py-4">Geen transacties gevonden</p>';
        return;
    }

    container.innerHTML = transactions.map(transaction => {
        let icon, label;
        if(transaction.type === 'buy'){
            icon = 'fa-arrow-down-left text-green-500';
            label = 'FestCoins gekocht';
        } else if(transaction.type === 'sell'){
            icon = 'fa-arrow-up-right text-red-500';
            label = 'FestCoins verkocht';
        } else if(transaction.type === 'send'){
            icon = 'fa-paper-plane text-blue-500';
            label = 'FestCoins gestuurd';
        } else if(transaction.type === 'receive'){
            icon = 'fa-inbox text-green-500';
            label = 'FestCoins ontvangen';
        } else if(transaction.type === 'groepspot'){
            icon = 'fa-users text-purple-500';
            label = 'Groepspot bijdrage';
        } else if(transaction.type === 'reward'){
            icon = 'fa-star text-yellow-500';
            label = transaction.description || 'FestSpark BONUS';
        } else {
            icon = 'fa-question text-gray-500';
            label = transaction.description || 'Onbekende transactie';
        }

        const date = new Date(transaction.createdAt).toLocaleString('nl-NL');
        return `
            <div class="flex justify-between items-center p-3 bg-gray-100 rounded-lg">
                <div class="flex items-center gap-3">
                    <i class="fa-solid ${icon}"></i>
                    <div>
                        <p class="font-medium">${label}</p>
                        <p class="text-sm text-gray-500">${date}</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="font-semibold ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}">
                        ${transaction.amount > 0 ? '+' : ''}${transaction.amount} FestCoins
                    </p>
                </div>
            </div>
        `;
    }).join('');
}