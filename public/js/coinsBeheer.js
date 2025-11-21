import { showNotification } from "./headerScripts.js";

// hulpfunctie voor display te updaten
function updateFestCoinDisplay(newAmount){
    document.getElementById("festCoinsSaldo").textContent = newAmount;
    document.getElementById("festCoinsHeader").textContent = "FestCoins: " + newAmount;
    document.getElementById("festCoinsLimitsell").textContent = "Beschikbaar: " + newAmount +  " FestCoins";
    document.getElementById("festCoinsLimitsell2").textContent = "Beschikbaar: " + newAmount +  " FestCoins";
    document.getElementById("shareAmount").max = newAmount;
    document.getElementById("sellAmount").max = newAmount;
}

// functie voor het kopen van FestCoins
document.getElementById("koopform").addEventListener("submit", async (e) => {
    e.preventDefault();
    const buyAmount = parseInt(document.getElementById("buyAmount").value);
    const errorMsg = document.getElementById("errorMsgKoop")

    if(!buyAmount) return errorMsg.textContent = "Geef een waarde in.";
    if (buyAmount <= 0) return errorMsg.textContent = "Geef een waarde groter dan nul in.";

    const res = await fetch("/addAmount", {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({ buyAmount }),
                });
    const result = await res.json();

    if(result.success){
        showNotification(`Succesvol ${buyAmount} FestCoins toegevoegd.`);
        document.getElementById("buyAmount").value="";
        updateFestCoinDisplay(result.newAmount);
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
        showNotification(`Succesvol ${sellAmount} FestCoins teruggestort.`);
        document.getElementById("sellAmount").value = "";
        updateFestCoinDisplay(result.newAmount);
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
        showNotification(`Succesvol ${shareAmount} FestCoins gestuurd!`);
        document.getElementById("shareAmount").value = "";
        document.getElementById("shareReceiver").value = "";
        updateFestCoinDisplay(result.newAmount);
    } else{
        errorMsg.textContent = result.error;
    }
});