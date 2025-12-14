
// Item list data script
(function() {
    // Get data from data attributes
    const userData = document.getElementById('userData');
    const eventData = document.getElementById('eventData');
    
    if (userData) {
        window.user = {
            festCoins: parseInt(userData.dataset.festcoins) || 0,
            id: parseInt(userData.dataset.id) || 0
        };
    }
    
    if (eventData) {
        window.eventId = parseInt(eventData.dataset.eventid) || null;
        window.eventEndDate = eventData.dataset.eventenddate || null;
    }
})();

