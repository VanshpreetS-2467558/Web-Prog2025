
// register ajax/fetch 
document.getElementById("registratieform").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = Object.fromEntries(new FormData(form));
    data.keepLoggedIn = document.getElementById("keepLoggedIn").checked;
    const errorMsg = document.getElementById("errorMsg");

    const res = await fetch("/register", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data),
    });

    const result = await res.json();

    if(result.success){
        sessionStorage.setItem('showNotification', "Account succesvol aangemaakt!");
        window.location.replace("/dashboard");
    } else{
        errorMsg.textContent = result.error;
    }
});




