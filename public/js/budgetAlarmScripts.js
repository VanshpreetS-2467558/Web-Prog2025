

// Load alarms on page load
document.addEventListener('DOMContentLoaded', () => {
    loadAlarms();
});

// Load all alarms from server
async function loadAlarms() {
    try {
        const response = await fetch('/budget-alarms');
        const data = await response.json();
        
        if (data.success) {
            renderAlarms(data.alarms);
        } else {
            console.error('Error loading alarms:', data.error);
        }
    } catch (error) {
        console.error('Error fetching alarms:', error);
    }
}

// Render alarms list
function renderAlarms(alarms) {
    const alarmsList = document.getElementById('alarmsList');
    
    if (!alarms || alarms.length === 0) {
        alarmsList.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <p class="text-lg">Nog geen budget alarms ingesteld.</p>
                <p class="text-sm mt-2">Voeg hierboven een alarm toe om te beginnen!</p>
            </div>
        `;
        return;
    }

    alarmsList.innerHTML = alarms.map(alarm => {
        const percentage = alarm.currentSpending > 0 
            ? Math.min(100, (alarm.currentSpending / alarm.budgetLimit) * 100) 
            : 0;
        const isExceeded = alarm.currentSpending > alarm.budgetLimit;
        const exceededAmount = isExceeded ? alarm.currentSpending - alarm.budgetLimit : 0;

        return `
            <div class="alarm-card border rounded-lg p-4 hover:shadow-md transition-shadow" data-alarm-id="${alarm.id}">
                <div class="flex items-center justify-between">
                    <div class="flex-1">
                        <div class="flex items-center gap-3 mb-2">
                            <h4 class="text-lg font-semibold text-gray-800">${alarm.category}</h4>
                            <span class="px-3 py-1 rounded-full text-xs font-semibold ${alarm.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}">
                                ${alarm.isActive ? 'Actief' : 'Inactief'}
                            </span>
                        </div>
                        <div class="space-y-1">
                            <p class="text-sm text-gray-600">
                                Budget: <span class="font-semibold text-gray-800">${alarm.budgetLimit} FestCoins</span>
                            </p>
                            <p class="text-sm text-gray-600">
                                Huidige uitgaven: <span class="font-semibold ${isExceeded ? 'text-red-600' : 'text-gray-800'}">
                                    ${alarm.currentSpending} FestCoins
                                </span>
                            </p>
                            <div class="mt-2">
                                <div class="w-full bg-gray-200 rounded-full h-2">
                                    <div class="bg-purple-500 h-2 rounded-full transition-all duration-300" 
                                         style="width: ${percentage}%"></div>
                                </div>
                                <p class="text-xs text-gray-500 mt-1">${Math.round(percentage)}% van budget gebruikt</p>
                            </div>
                            ${isExceeded ? `
                                <p class="text-sm font-semibold text-red-600 mt-2">
                                    ⚠️ Budget overschreden met ${exceededAmount} FestCoins
                                </p>
                            ` : ''}
                        </div>
                    </div>
                    <div class="flex flex-col gap-2 ml-4">
                        <button onclick="toggleAlarm(${alarm.id})" 
                                class="px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${alarm.isActive ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' : 'bg-green-100 text-green-800 hover:bg-green-200'}">
                            ${alarm.isActive ? 'Deactiveren' : 'Activeren'}
                        </button>
                        <button onclick="editAlarm(${alarm.id}, '${alarm.category}', ${alarm.budgetLimit})" 
                                class="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-semibold hover:bg-blue-200 transition-colors">
                            Bewerken
                        </button>
                        <button onclick="deleteAlarm(${alarm.id})" 
                                class="px-4 py-2 bg-red-100 text-red-800 rounded-lg text-sm font-semibold hover:bg-red-200 transition-colors">
                            Verwijderen
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Add new alarm
document.getElementById('addAlarmForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const category = formData.get('category');
    const budgetLimit = parseInt(formData.get('budgetLimit'));

    if (!category || !budgetLimit || budgetLimit < 0) {
        alert('Vul alle velden correct in.');
        return;
    }

    try {
        const response = await fetch('/budget-alarms', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ category, budgetLimit, isUpdate: false })
        });

        const data = await response.json();
        
        if (data.success) {
            e.target.reset();
            await loadAlarms();
            sessionStorage.setItem('showNotification', data.updated 
                ? "Bestaand budget alarm bijgewerkt!" 
                : "Budget alarm succesvol toegevoegd!"
            );
            window.location.reload();
        } else {
            alert('Fout: ' + (data.error || 'Onbekende fout'));
        }
    } catch (error) {
        console.error('Error adding alarm:', error);
        alert('Er is een fout opgetreden bij het toevoegen van het alarm.');
    }

});

// Edit alarm
window.editAlarm = function(alarmId, category, budgetLimit) {
    document.getElementById('editAlarmId').value = alarmId;
    document.getElementById('editAlarmCategory').value = category;
    document.getElementById('editAlarmBudgetLimit').value = budgetLimit;
    document.getElementById('editModal').classList.remove('hidden');
};

// Close edit modal
window.closeEditModal = function() {
    document.getElementById('editModal').classList.add('hidden');
    document.getElementById('editAlarmForm').reset();
};

// Submit edit form
document.getElementById('editAlarmForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const alarmId = parseInt(document.getElementById('editAlarmId').value);
    const category = document.getElementById('editAlarmCategory').value;
    const budgetLimit = parseInt(document.getElementById('editAlarmBudgetLimit').value);

    if (!budgetLimit || budgetLimit < 0) {
        alert('Vul een geldig budget limiet in.');
        return;
    }

    try {
        const response = await fetch('/budget-alarms', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ category, budgetLimit, isUpdate: true })
        });

        const data = await response.json();
        
        if (data.success) {
            closeEditModal();
            // Force reload all alarms to ensure no duplicates
            await loadAlarms();
            if (data.wasReset) {
                sessionStorage.setItem('showNotification', "Budget alarm bijgewerkt! Uitgaven zijn gereset naar 0.");
                window.location.reload();
            } else {
                sessionStorage.setItem('showNotification', "Budget alarm succesvol bijgewerkt!");
                window.location.reload();
            }
        } else {
            alert('Fout: ' + data.error);
        }
    } catch (error) {
        console.error('Error updating alarm:', error);
        alert('Er is een fout opgetreden bij het bijwerken van het alarm.');
    }
});

// Toggle alarm active status
window.toggleAlarm = async function(alarmId) {
    try {
        const response = await fetch(`/budget-alarms/${alarmId}/toggle`, {
            method: 'POST'
        });

        const data = await response.json();
        
        if (data.success) {
            // Force reload all alarms
            await loadAlarms();
            sessionStorage.setItem('showNotification', `Alarm ${data.isActive ? 'geactiveerd' : 'gedeactiveerd'}!`);
            window.location.reload();
        } else {
            alert('Fout: ' + data.error);
        }
    } catch (error) {
        console.error('Error toggling alarm:', error);
        alert('Er is een fout opgetreden bij het wijzigen van het alarm.');
    }
};

// Delete alarm
window.deleteAlarm = async function(alarmId) {
    if (!confirm('Weet je zeker dat je dit budget alarm wilt verwijderen?')) {
        return;
    }

    try {
        const response = await fetch(`/budget-alarms/${alarmId}`, {
            method: 'DELETE'
        });

        const data = await response.json();
        
        if (data.success) {
            // Force reload all alarms to ensure deleted alarm is removed
            await loadAlarms();
            sessionStorage.setItem('showNotification', 'Budget alarm succesvol verwijderd!');
            window.location.reload();
        } else {
            alert('Fout: ' + data.error);
        }
    } catch (error) {
        console.error('Error deleting alarm:', error);
        alert('Er is een fout opgetreden bij het verwijderen van het alarm.');
    }
};



// Auto-refresh alarms every 10 seconds to update spending
setInterval(() => {
    loadAlarms();
}, 10000);

