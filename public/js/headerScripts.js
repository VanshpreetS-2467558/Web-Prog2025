
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
});