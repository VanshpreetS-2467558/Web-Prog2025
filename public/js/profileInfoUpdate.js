import { showNotification } from "./headerScripts.js";

// functie voor het kopen van FestCoins
document.getElementById("profileInfoUpdater").addEventListener("submit", async (e) => {
    console.log("test")
    e.preventDefault();
    const name = document.getElementById("name").value;
    const res = await fetch("/nameChange", {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({ name }),
                });
    const result = await res.json();

    if(result.success){
        showNotification(`Naam succesvol veranderd`);
        document.getElementById("name").value=name;
    } else{
        errorMsg.textContent = result.error;
    }
});