

// functie voor het kopen van FestCoins
document.getElementById("forgotPassword").addEventListener("submit", async (e) => {
    e.preventDefault();
    console.log("test");
    const email = document.getElementById("email").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const errorMsgPass = document.getElementById("errorMsgPass");

    if(!newPassword || !confirmPassword || !email) return errorMsgPass.textContent = "Vul alle velden in!";
    if(newPassword != confirmPassword) return errorMsgPass.textContent = "Wachtwoorden komen niet overeen.";
    if(!(isStrongPassword(newPassword))) return errorMsgPass.textContent = "Wachtwoord is niet sterk genoeg.";

    const res = await fetch("/auth/resetWachtwoord", {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({ email, newPassword, confirmPassword }),
                });
    const result = await res.json();

    if(result.success){
        sessionStorage.setItem('showNotification', "Wachtwoord succesvol veranderd");
        window.location.href = "/home";
    } else{
        errorMsgPass.textContent = result.error;
    }
});

// backend password check in frontend
function isStrongPassword(password){
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/.test(password);
}