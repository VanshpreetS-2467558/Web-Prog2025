


// oogje effect bij wachtwoord 
const toggle = document.getElementById("togglePassword");
toggle.addEventListener('click', ()=>{
    const wachtwoord = document.getElementById("wachtwoord");
    const oogOpen = toggle.querySelector('.oog-open');
    const oogDicht = toggle.querySelector('.oog-dicht')

    const type = wachtwoord.getAttribute('type') === 'password' ? 'text' : 'password';
    wachtwoord.setAttribute('type' , type);
    
    oogOpen.classList.toggle('hidden');
    oogDicht.classList.toggle('hidden');
});

// logging ajax/fetch
document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("wachtwoord").value;
    const errorMsg = document.getElementById("errorMsg");


    const res = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if(data.success) {
        showNotification("succesvol ingelogd!");
        setTimeout(() => window.location.href = "/dashboard", 1000);
    } else {
        errorMsg.textContent = data.error;
        document.getElementById("wachtwoord").value = "";
    }
});

// notificatie tonen bij inloggen
function showNotification(message) {
    const notif = document.getElementById("inlog-notificatie");
    notif.textContent = message;
    notif.classList.remove("opacity-0");

    setTimeout(()=> {
        notif.classList.add("opacity-0");
    }, 1500);
}
