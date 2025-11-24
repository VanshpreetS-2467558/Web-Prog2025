
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
        sessionStorage.setItem('showNotification', "succesvol ingelogd!");
        window.location.href
        window.location.replace("/dashboard");
    } else {
        errorMsg.textContent = data.error;
        document.getElementById("wachtwoord").value = "";
    }
});



