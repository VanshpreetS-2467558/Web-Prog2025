const searchInput = document.getElementById("searchInput");
const eventCards = document.querySelectorAll(".eventCard");

searchInput.addEventListener("input", () => {
    const term = searchInput.value.toLowerCase();
    eventCards.forEach(card => {
        const name = card.querySelector("h3").textContent.toLowerCase();
        const location = card.querySelector(".text-gray-500 > div:first-child").textContent.toLowerCase();
        if(name.includes(term) || location.includes(term)) {
            card.style.display = "block";
        } else {
            card.style.display = "none";
        }
    });
});

// Update visitor counts dynamically
let visitorCountInterval = null;

document.addEventListener('DOMContentLoaded', () => {
    // Update visitor counts every 10 seconds
    visitorCountInterval = setInterval(() => {
        updateVisitorCounts();
    }, 10000);
    
    // Initial update
    updateVisitorCounts();
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        if(visitorCountInterval) clearInterval(visitorCountInterval);
    });
});

async function updateVisitorCounts(){
    const eventCards = document.querySelectorAll('.eventCard');
    eventCards.forEach(async (card) => {
        const href = card.getAttribute('href');
        if(href){
            const eventId = href.split('/').pop();
            try {
                const res = await fetch(`/list/events/${eventId}/visitors`);
                const data = await res.json();
                if(data.success){
                    const countEl = card.querySelector('[data-visitor-count]');
                    if(countEl){
                        countEl.textContent = `${data.count} bezoekers`;
                    }
                }
            } catch(err){
                console.error(`Error updating visitor count for event ${eventId}:`, err);
            }
        }
    });
}