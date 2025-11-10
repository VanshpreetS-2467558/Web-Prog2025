



// register ajax/fetch 
document.getElementById("registratieform").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = Object.fromEntries(new FormData(form));
    const errorMsg = document.getElementById("errorMsg");

    const res = await fetch("/register", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data),
    });

    const result = await res.json();

    if(result.success){
        showNotification("Account succesvol aangemaakt!");
        setTimeout(() => window.location.href = "/dashboard", 1000);
    } else{
        errorMsg.textContent = result.error;
    }
});


// notificatie tonen bij inloggen
function showNotification(message) {
    const notif = document.getElementById("register-notificatie");
    notif.textContent = message;
    notif.classList.remove("opacity-0");

    setTimeout(()=> {
        notif.classList.add("opacity-0");
    }, 1500);
}
