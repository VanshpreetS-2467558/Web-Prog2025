// Points system script
let currentPoints = 0;
const maxPoints = 100;

// Initialize points from data attribute
document.addEventListener('DOMContentLoaded', () => {
    const pointsData = document.getElementById('pointsData');
    if (pointsData) {
        currentPoints = parseInt(pointsData.dataset.points) || 0;
    }
    updateStarFill(currentPoints);
    
    // Poll for points updates every 3 seconds
    setInterval(async () => {
        try {
            const response = await fetch('/dashboard/points');
            const data = await response.json();
            if (data.success && data.points.currentPoints !== currentPoints) {
                const oldPoints = currentPoints;
                currentPoints = data.points.currentPoints;
                
                // Animate points change
                if (currentPoints > oldPoints) {
                    showNotification(`+${currentPoints - oldPoints} punten verdiend! ⭐`, 'success');
                }
                
                updateStarFill(currentPoints);
            }
        } catch (error) {
            console.error('Error fetching points:', error);
        }
    }, 3000);
});

// Update star fill based on points
function updateStarFill(points) {
    const percentage = Math.min(100, (points / maxPoints) * 100);
    const starFilled = document.getElementById('starFilled');
    
    if (starFilled) {
        // Create clip path based on percentage
        const clipY = 100 - percentage;
        starFilled.style.clipPath = `polygon(0% ${clipY}%, 100% ${clipY}%, 100% 100%, 0% 100%)`;
        
        // Show sparkles when full
        const sparkleContainer = document.getElementById('sparkleContainer');
        if (points >= maxPoints && sparkleContainer) {
            sparkleContainer.classList.remove('hidden');
        } else if (sparkleContainer) {
            sparkleContainer.classList.add('hidden');
        }
    }
    
    // Update progress bar
    const progressBar = document.getElementById('pointsProgressBar');
    if (progressBar) {
        progressBar.style.width = `${percentage}%`;
    }
    
    // Update points display
    const currentPointsEl = document.getElementById('currentPoints');
    const pointsNeededEl = document.getElementById('pointsNeeded');
    if (currentPointsEl) currentPointsEl.textContent = points;
    if (pointsNeededEl) pointsNeededEl.textContent = Math.max(0, maxPoints - points);
    
    // Show/hide claim button
    const claimBtn = document.getElementById('claimRewardBtn');
    if (claimBtn) {
        if (points >= maxPoints) {
            claimBtn.classList.remove('hidden');
        } else {
            claimBtn.classList.add('hidden');
        }
    }
}

// Claim reward
window.claimPointsReward = async function() {
    if (currentPoints < maxPoints) {
        alert('Je hebt nog niet genoeg punten! Je hebt 100 punten nodig.');
        return;
    }
    
    if (!confirm('Weet je zeker dat je je beloning wilt claimen? Je krijgt 10 FestCoins gratis!')) {
        return;
    }
    
    try {
        const response = await fetch('/dashboard/points/claim', {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Update points
            currentPoints = data.newPoints;
            updateStarFill(currentPoints);
            
            // Show success message
            showNotification(`🎉 Gefeliciteerd! Je hebt 10 FestCoins gekregen! 🎉`, 'success');
            
            // Update FestCoins display dynamically (header and dashboard)
            fetch('/user/festcoins')
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        // Update header
                        const festCoinsHeader = document.getElementById('festCoinsHeader');
                        if (festCoinsHeader) {
                            festCoinsHeader.textContent = `FestCoins: ${data.festCoins}`;
                        }
                        // Update dashboard FestCoins display
                        const dashboardFestCoinsDisplay = document.getElementById('dashboardFestCoinsDisplay');
                        if (dashboardFestCoinsDisplay) {
                            dashboardFestCoinsDisplay.textContent = data.festCoins;
                        }
                    }
                })
                .catch(err => console.error('Error updating FestCoins:', err));
            
            // Update stats
            const totalRewardsEl = document.querySelector('#totalRewardsStat');
            if (totalRewardsEl) {
                totalRewardsEl.textContent = `${data.totalRewardsClaimed}x`;
            }
        } else {
            alert('Fout: ' + data.error);
        }
    } catch (error) {
        console.error('Error claiming reward:', error);
        alert('Er is een fout opgetreden bij het claimen van je beloning.');
    }
}

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notificatie');
    if (notification) {
        notification.textContent = message;
        notification.className = `fixed top-16 right-4 px-4 py-3 rounded-lg shadow-lg z-50 transition-opacity duration-500 ${
            type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`;
        notification.classList.remove('opacity-0', 'pointer-events-none');
        
        setTimeout(() => {
            notification.classList.add('opacity-0', 'pointer-events-none');
        }, 5000);
    }
}

