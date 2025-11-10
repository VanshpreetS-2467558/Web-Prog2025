
// pop up voor uitloggen
document.addEventListener("DOMContentLoaded", () => {
    const logoutForm = document.querySelector("form[action='/logout']");
    if (!logoutForm) return;

    logoutForm.addEventListener("submit", async (e) => {
        e.preventDefault(); // voorkom normale reload
        const res = await fetch("/logout", { method: "POST" });

        if (res.ok) {
            const notif = document.getElementById("uitlog-notificatie");
            notif.textContent = "Succesvol uitgelogd!"
            notif.classList.remove("opacity-0");
            setTimeout(() => {
                notif.classList.add("opacity-0");
                window.location.href = "/home";
            }, 400);
        }
    });
});