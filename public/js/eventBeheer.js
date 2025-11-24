import {showNotification} from "./headerScripts.js";


document.getElementById("eventAanmaakForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    
    // data ophalen
    const form = e.target;
    const data = Object.fromEntries(new FormData(form));

    // datum en tijd samenvoegen in data
    data.startDate = `${data.startDate}T${data.startTime}`;
    data.endDate = `${data.endDate}T${data.endTime}`;
    delete data.startTime; 
    delete data.endTime;

    try{
        const res = await fetch("/createEvent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data) 
        });
        const result = await res.json();

        if(result.success){
            showNotification("Evenement succesvol aangemaakt!");
            form.reset();
            document.getElementById('EventAanmaakTab').classList.add('hidden');
            setTimeout(() => { ////////////////////////////////////////////////////////////////////// ajax ofzo want moet tegoei reloaden
                window.location.reload();
            }, 500);
        } else{
            alert("Fout bij aanmaken: " + result.error);
        }
    } catch (err){
        console.error("Fetch error: ", err);
        alert("Er is iets misgegaan, probeer het later opnieuw.");
    }
});


window.openAddLocationModel = function(eventId) {
    document.getElementById("eventIdInput").value = eventId;
    document.getElementById("addLocationSection").classList.remove("hidden");
};

window.openAddItemModel = function(sectionId) {
    document.getElementById("sectionIdInput").value = sectionId;
    document.getElementById("addItemForm").classList.remove("hidden");
};


// Locatie form
document.getElementById("addLocationForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const errorMsg = document.getElementById("errorMsgAddLoc");
    const eventId = document.getElementById("eventIdInput").value;
    const name = document.getElementById("locationName").value;

    if (!name) return errorMsg.textContent = "Geef een locatie naam!";

    try {
        const res = await fetch("/addLocation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ eventId, name })
        });
        const result = await res.json();

        if (result.success) {
            document.getElementById("addLocationForm").reset();
            document.getElementById("addLocationSection").classList.add("hidden");
            showNotification("Locatie succesvol toegevoegd!");
        } else {
            errorMsg.textContent = result.error;
        }
    } catch (err) {
        console.error(err);
        errorMsg.textContent = "Er is iets misgegaan.";
    }
});

// Item form
document.getElementById("itemForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const errorMsg = document.getElementById("errorMsgAddItem");
    const sectionId = document.getElementById("sectionIdInput").value;
    const name = document.getElementById("itemName").value;
    const price = parseInt(document.getElementById("itemPrice").value);
    const stock = parseInt(document.getElementById("itemStock").value);

    if (!name || isNaN(price) || isNaN(stock)) return errorMsg.textContent = "Alle velden zijn verplicht.";

    try {
        const res = await fetch("/addItem", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sectionId, name, price, stock })
        });
        const result = await res.json();

        if (result.success) {
            document.getElementById("itemForm").reset();
            document.getElementById("addItemForm").classList.add("hidden");
            showNotification("Item succesvol toegevoegd!");
            setTimeout(() => window.location.reload(), 500);
        } else {
            errorMsg.textContent = result.error;
        }
    } catch(err) {
        console.error(err);
        errorMsg.textContent = "Er is iets misgegaan.";
    }
});


