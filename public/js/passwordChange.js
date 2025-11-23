import { showNotification } from "./headerScripts.js";

// functie voor het kopen van FestCoins
document.getElementById("passwordChange").addEventListener("submit", async (e) => {
    e.preventDefault();
    const password = document.getElementById("password").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if(newPassword != confirmPassword) return errorMsg.textContent = "Wachtwoorden komen niet overeen.";
    if(!(isStrongPassword(newPassword))) return errorMsg.textContent = "Wachtwoord is niet sterk genoeg.";

    const res = await fetch("/passwordChange", {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({ password, newPassword, confirmPassword }),
                });
    const result = await res.json();

    if(result.success){
        showNotification(`Wachtwoord succesvol veranderd`);
        document.getElementById("password").value="";
        document.getElementById("newPassword").value="";
        document.getElementById("confirmPassword").value="";
    } else{
        errorMsg.textContent = result.error;
    }
});

// backend password check in frontend
function isStrongPassword(password){
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/.test(password);
}