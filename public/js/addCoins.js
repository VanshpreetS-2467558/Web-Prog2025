

// functie voor het kopen van FestCoins
document.getElementById("koopform").addEventListener("submit", async (e) => {
    e.preventDefault();
    const buyAmount = parseInt(document.getElementById("buyAmount").value);
    const errorMsg = document.getElementById("errorMsgKoop")

    let res;

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
        document.getElementById("festCoinsSaldo").textContent = result.newAmount;
        document.getElementById("festCoinsHeader").textContent = result.newAmount;
        document.getElementById("festCoinsLimitsell").textContent = "Beschikbaar: " + result.newAmount +  " FestCoins";
        document.getElementById("festCoinsLimitsell2").textContent = "Beschikbaar: " + result.newAmount +  " FestCoins";
        document.getElementById("sellAmount").max = result.newAmount;
        document.getElementById("shareAmount").max = result.newAmount;


    } else{
        errorMsg.textContent = result.error;
    }
});

document.getElementById("verkoopform").addEventListener("submit", async (e) => {
    e.preventDefault();

    const sellAmount = parseInt(document.getElementById("sellAmount").value);
    const errorMsg = document.getElementById("errorMsgVerkoop")

    if(!sellAmount) return errorMsg.textContent = "Geef een waarde in.";
    if(sellAmount <= 0) return errorMsg.textContent = "Geef een waarde groter dan nul in."

    const res = await fetch("/sellAmount", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ sellAmount }),
    });

    const result = await res.json();

    if(result.success){
        showNotification("Succesvol " + sellAmount + " FestCoins teruggestort.");
        document.getElementById("sellAmount").value = "";
        document.getElementById("festCoinsSaldo").textContent = result.newAmount;
        document.getElementById("festCoinsHeader").textContent = result.newAmount;
        document.getElementById("festCoinsLimitsell").textContent = "Beschikbaar: " + result.newAmount +  " FestCoins";
        document.getElementById("festCoinsLimitsell2").textContent = "Beschikbaar: " + result.newAmount +  " FestCoins";
        document.getElementById("shareAmount").max = result.newAmount;
        document.getElementById("sellAmount").max = result.newAmount;

    } else{
        errorMsg.textContent = result.error;
    }

});


document.getElementById("shareform").addEventListener("submit", async (e) => {
    e.preventDefault();

    const shareAmount = parseInt(document.getElementById("shareAmount").value);
    const shareReceiver = parseInt(document.getElementById("shareReceiver").value);
    const errorMsg = document.getElementById("errorMsgShare")

    if( !shareAmount || !shareReceiver) return errorMsg.textContent = "Vul alle velden in!";
    if(shareAmount <= 0) return errorMsg.textContent = "Geef een waarde groter dan nul in."

    const res = await fetch("/shareAmount", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ shareAmount, shareReceiver }),
    });

    const result = await res.json();

    if(result.success){
        showNotification("Succesvol " + shareAmount + " FestCoins gestuurd!");
        document.getElementById("shareAmount").value = "";
        document.getElementById("festCoinsSaldo").textContent = result.newAmount;
        document.getElementById("festCoinsHeader").textContent = result.newAmount;
        document.getElementById("festCoinsLimitsell").textContent = "Beschikbaar: " + result.newAmount +  " FestCoins";
        document.getElementById("festCoinsLimitsell2").textContent = "Beschikbaar: " + result.newAmount +  " FestCoins";
        document.getElementById("shareAmount").max = result.newAmount;
        document.getElementById("sellAmount").max = result.newAmount;
    } else{
        errorMsg.textContent = result.error;
    }

});


// notificatie tonen
function showNotification(message) {
    const notif = document.getElementById("notificatieVerkoop");
    notif.textContent = message;
    notif.classList.remove("opacity-0");

    setTimeout(()=> {
        notif.classList.add("opacity-0");
    }, 1500);
}

