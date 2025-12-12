
export function showNotification(message) {
    const notif = document.getElementById("notificatie");
    notif.textContent = message;
    notif.classList.remove("opacity-0");

    setTimeout(()=> {
        notif.classList.add("opacity-0");
    }, 1500);
}


window.addEventListener('DOMContentLoaded', () => {
    const msg = sessionStorage.getItem('showNotification');
    if(msg){
        showNotification(msg);
        sessionStorage.removeItem('showNotification');
    }

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) { 
        logoutBtn.addEventListener("submit", async (e) => {
            e.preventDefault();
            const res = await fetch("/auth/logout", { method: "POST" });
            if (res.ok) {
                sessionStorage.setItem('showNotification', "succesvol uitgelogd!");
                window.location.href = "/home";
            }
        });
    }

    // Fix dropdown menu on mobile - ensure touch events work
    // Wait a bit for custom elements to be registered
    setTimeout(() => {
        const dropdown = document.querySelector('el-dropdown');
        if (dropdown) {
            const dropdownButton = dropdown.querySelector('button');
            if (dropdownButton) {
                // Make button clickable on mobile by ensuring it has proper touch handling
                dropdownButton.style.cursor = 'pointer';
                dropdownButton.style.touchAction = 'manipulation'; // Prevents double-tap zoom
                
                // Add explicit click handler for mobile compatibility
                dropdownButton.addEventListener('click', function(e) {
                    // Force the dropdown to toggle by dispatching a proper click event
                    if (!dropdown.open) {
                        dropdown.open = true;
                    }
                }, true);

                // Also handle touch events for better mobile support
                let touchStartTime = 0;
                dropdownButton.addEventListener('touchstart', function(e) {
                    touchStartTime = Date.now();
                }, { passive: true });

                dropdownButton.addEventListener('touchend', function(e) {
                    const touchDuration = Date.now() - touchStartTime;
                    // Only trigger if it was a quick tap (not a swipe)
                    if (touchDuration < 300) {
                        e.preventDefault();
                        this.click();
                    }
                }, { passive: false });
            }
        }
    }, 100);
});