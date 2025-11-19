
// 
document.getElementById("koopform").addEventListener("submit", async (e) => {
    e.preventDefault();
    const buyAmount = document.getElementById("buyAmount").value;
    const errorMsg = document.getElementById("errorMsg")

    let res;
    console.log("button pressed.")
    if (buyAmount){
        if (buyAmount > 0){
            res = await fetch("/addAmount", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ buyAmount }),
            });
        }
        else {
            return errorMsg.textContent = "Geef een waarde groter dan nul in.";
        }
    }
    else {
        return errorMsg.textContent = "Geef een waarde in.";
    }


    const result = await res.json();

    if(result.success){
        showNotification("Succesvol " + buyAmount + " festcoins toegevoegd.");
        document.getElementById("buyAmount").value="";
    } else{
        errorMsg.textContent = result.error;
    }
});

// notificatie tonen
function showNotification(message) {
    const notif = document.getElementById("register-notificatie");
    notif.textContent = message;
    notif.classList.remove("opacity-0");

    setTimeout(()=> {
        notif.classList.add("opacity-0");
    }, 1500);
}