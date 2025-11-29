
// register employee 
document.getElementById("registratieform").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("name").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const errorMsg = document.getElementById("errorMsg");

    if (!(password === confirmPassword)){
        console.log("test" + password, + confirmPassword);
        errorMsg.textContent = "Wachtwoorden komen niet overeen.";
    } else {
        const res = await fetch("/newEmployee", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({name, password, confirmPassword}),
        });
    }

    const result = await res.json();

    if(result.success){
        sessionStorage.setItem('showNotification', "Account succesvol aangemaakt!");
    } else{
        errorMsg.textContent = result.error;
    }
});