
// pop up voor uitloggen
document.addEventListener("DOMContentLoaded", () => {
    const logoutForm = document.querySelector("form[action='/logout']");
    if (!logoutForm) return;

    logoutForm.addEventListener("submit", async (e) => {
        e.preventDefault(); // voorkom normale reload
        const res = await fetch("/logout", { method: "POST" });

        if (res.ok) {
            showNotification("Succesvol uitgelogd!");
            setTimeout(() => window.location.href = "/home", 1000);
        }
    });
});

export function showNotification(message) {
    const notif = document.getElementById("notificatie");
    notif.textContent = message;
    notif.classList.remove("opacity-0");

    setTimeout(()=> {
        notif.classList.add("opacity-0");
    }, 1500);
}