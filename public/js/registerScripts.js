import { showNotification } from "./headerScripts.js";



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



