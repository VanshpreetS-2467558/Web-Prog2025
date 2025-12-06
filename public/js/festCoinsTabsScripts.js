


// eenvoudige tab-switch logica
const tabs = document.querySelectorAll('.tab-btn');
const contents = document.querySelectorAll('.tab-content');

// Get tab from URL parameter or default to 'buy'
function getTabFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') || 'buy';
}

// Set active tab based on URL parameter
function setActiveTab(tabName) {
    tabs.forEach(t => {
        t.classList.remove('text-purple-500', 'border-b-2', 'border-purple-400');
        t.classList.add('text-gray-500');
    });
    contents.forEach(c => c.classList.add('hidden'));

    const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
    const activeContent = document.getElementById(tabName);
    
    if(activeTab && activeContent) {
        activeTab.classList.remove('text-gray-500');
        activeTab.classList.add('text-purple-500', 'border-b-2', 'border-purple-400');
        activeContent.classList.remove('hidden');
    }
}

// Initialize tab on page load
document.addEventListener('DOMContentLoaded', () => {
    const initialTab = getTabFromURL();
    setActiveTab(initialTab);
});

// Tab click handler - update URL and show tab
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        setActiveTab(tabName);
        
        // Update URL without page reload
        const url = new URL(window.location);
        url.searchParams.set('tab', tabName);
        window.history.pushState({}, '', url);
    });
});

// bedrag invullen
function setAmount(id, amount) {
document.getElementById(id).value = amount.toFixed(2);
}

document.addEventListener("DOMContentLoaded", () => {
    window.openScanField = function() {
        document.getElementById('scanField').classList.remove('hidden');
    }

    window.closeScanField = function() {
        document.getElementById('scanField').classList.add('hidden');
    }
});
