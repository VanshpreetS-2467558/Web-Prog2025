import {showNotification} from "./headerScripts.js";


document.getElementById("eventAanmaakForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    
    // data ophalen
    const form = e.target;
    const data = Object.fromEntries(new FormData(form));
    const errorMsgEvent = document.getElementById("errorMsgEvent");

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
            sessionStorage.setItem('showNotification', "Evenement succesvol aangemaakt!");
            form.reset();
            document.getElementById('EventAanmaakTab').classList.add('hidden');
            window.location.reload();
        } else{
            errorMsgEvent.textContent = result.error;
        }
    } catch (err){
        console.error("Fetch error: ", err);
        errorMsgEvent.textContent = "Er is iets misgegaan, probeer het later opnieuw.";
    }
});

function setInputValue(id, value) {
  const element = document.getElementById(id);
  if(element) element.value = value || "";
}


window.openAddEditModel = async function(eventId){
    const errorMsg = document.getElementById("errorMsgEditBtn");
    try{
        const res = await fetch(`/findEvent?eventId=${encodeURIComponent(eventId)}`);
        if(!res.ok) throw new Error(`HTTP error: ${res.status}`);
        const result = await res.json();
        if(result.success){
            const event = result.event;

            setInputValue("eventIdInput", event.id);
            setInputValue("newName", event.name);
            setInputValue("newLocation", event.location);
            setInputValue("newDescription", event.description);
            const start = new Date(event.startDate);
            const end = new Date(event.endDate);
            if(!isNaN(start)) {
            setInputValue("newStartDate", start.toISOString().slice(0,10));
            setInputValue("NewStartTime", start.toTimeString().slice(0,5));
            }
            if(!isNaN(end)) {
            setInputValue("newEndDate", end.toISOString().slice(0,10));
            setInputValue("NewEndTime", end.toTimeString().slice(0,5));
            }
            document.getElementById("editInfoEvent").classList.remove("hidden");
        } else return alert(result.error);
    } catch(err){
        console.error("Fetch error: ", err);
        errorMsg.textContent = "Er is iets misgegaan, probeer het later opnieuw."
    }
}

window.openAddLocationModel = function(eventId) {
    document.getElementById("eventIdInput").value = eventId;
    document.getElementById("addLocationSection").classList.remove("hidden");
};


window.openAddItemModel = function(sectionId, eventId) {
    document.getElementById("sectionIdInput").value = sectionId;
    document.getElementById("eventIdInput").value = eventId;
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
            sessionStorage.setItem('showNotification', "Locatie succesvol toegevoegd!");
            sessionStorage.setItem('openEventId', eventId);
            window.location.reload();
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
    const eventId = document.getElementById("eventIdInput").value;
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
            sessionStorage.setItem('showNotification', "Item succesvol toegevoegd!");
            sessionStorage.setItem('openEventId', eventId);
            window.location.reload();
        } else {
            errorMsg.textContent = result.error;
        }
    } catch(err) {
        console.error(err);
        errorMsg.textContent = "Er is iets misgegaan.";
    }
});



window.openEventDetail = function(id) {
  document.getElementById("eventListView").classList.add("hidden");
  document.getElementById("eventDetailView").classList.remove("hidden");

  document.querySelectorAll(".eventDetailContent").forEach(el => el.classList.add("hidden"));
  const detail = document.getElementById(`eventDetail-${id}`);
  if(detail) detail.classList.remove("hidden");
}

window.closeEventDetail = function() {
  document.getElementById("eventDetailView").classList.add("hidden");
  document.getElementById("eventListView").classList.remove("hidden");

  document.querySelectorAll(".eventDetailContent").forEach(el => el.classList.add("hidden"));
}

window.deleteEvent = async function(id) {
    if(!confirm("Weet je zeker dat je dit evenement wilt verwijderen?")) return;

    try{
        const res = await fetch("/deleteEvent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }) 
        });
        const result = await res.json();
        if(result.success){
            sessionStorage.setItem('showNotification', "Evenement verwijderd!");
            closeEventDetail();
            const eventDiv = document.querySelector(`#eventDetail-${id}`);
            if(eventDiv) eventDiv.remove();
            window.location.reload();
        } else {
            alert("Fout bij verwijderen: " + result.error);
        }
    } catch(err){
        console.error(err);
        alert("Er is iets misgegaan.");
    }
}

window.deleteItem = async function(id, eventId) {
    if(!confirm("Weet je zeker dat je dit Item wilt verwijderen?")) return;

    try{
        const res = await fetch("/deleteItem", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }) 
        });
        const result = await res.json();
        if(result.success){
            sessionStorage.setItem('showNotification', "Item verwijderd!");
            sessionStorage.setItem('openEventId', eventId);
            const itemDiv = document.getElementById(`item-${id}`);
            if(itemDiv) itemDiv.remove();
            window.location.reload();
        } else {
            alert("Fout bij verwijderen: " + result.error);
        }
    } catch(err){
        console.error(err);
        alert("Er is iets misgegaan.");
    }
}


window.deleteStation = async function(id, eventId) {
    if(!confirm("Weet je zeker dat je dit Item wilt verwijderen?")) return;

    try{
        const res = await fetch("/deleteStation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }) 
        });
        const result = await res.json();
        if(result.success){
            sessionStorage.setItem('showNotification', "Locatie verwijderd!");
            sessionStorage.setItem('openEventId', eventId);
            const stationDiv = document.getElementById(`station-${id}`);
            if(stationDiv) stationDiv.remove();
            window.location.reload();
        } else {
            alert("Fout bij verwijderen: " + result.error);
        }
    } catch(err){
        console.error(err);
        alert("Er is iets misgegaan.");
    }
}



// checkt welke event open moet blijven bij reload
const openEventId = sessionStorage.getItem('openEventId');
if(openEventId){
    window.openEventDetail(openEventId);
    sessionStorage.removeItem('openEventId');
}

// info event edit form
document.getElementById("editEventForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const errorMsg = document.getElementById("errorMsgEditForm");
    const eventId = document.getElementById("eventIdInput").value;
    try{
        const res = await fetch(`/findEvent?eventId=${encodeURIComponent(eventId)}`);
        const result = await res.json();
        const currentEvent = result.event;

        const updatedFields = {};

        const name = document.getElementById("newName").value;
        if(name !== currentEvent.name) updatedFields.name = name;
        const location = document.getElementById("newLocation").value;
        if(location !== currentEvent.location) updatedFields.location = location;

        const description = document.getElementById("newDescription").value;
        if(description !== currentEvent.description) updatedFields.description = description;

        const startDate = document.getElementById("newStartDate").value;
        const startTime = document.getElementById("NewStartTime").value;
        const start = `${startDate}T${startTime}`;
        if(start !== currentEvent.startDate) updatedFields.startDate = start;

        const endDate = document.getElementById("newEndDate").value;
        const endTime = document.getElementById("NewEndTime").value;
        const end = `${endDate}T${endTime}`;
        if(end !== currentEvent.endDate) updatedFields.endDate = end;
        
        if(Object.keys(updatedFields).length === 0){
            showNotification("Er zijn geen wijzigingen aangebracht.");
            return;
        }

        const res2 = await fetch("/updateEventDetails", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ eventId, updatedFields  }) 
        });
        const resultUpdate = await res2.json();
        if(resultUpdate.success){
            sessionStorage.setItem('showNotification', "Event succesvol bijgewerkt!");
            sessionStorage.setItem('openEventId', eventId);
            document.getElementById("editInfoEvent").classList.add("hidden");
            window.location.reload();
        } else {
            errorMsg.textContent = resultUpdate.error;
        }
    } catch(err){
        console.error(err);
        errorMsg.textContent = "Er is iets misgegaan, probeer het later opnieuw.";

    }
});
