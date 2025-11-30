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

window.originalLocation = "";
window.openAddEditModel = async function(eventId){
    const errorMsg = document.getElementById("errorMsgGeneral");
    try{
        const res = await fetch(`/findEvent?eventId=${encodeURIComponent(eventId)}`);
        if(!res.ok) throw new Error(`HTTP error: ${res.status}`);
        const result = await res.json();
        if(result.success){
            const event = result.event;
            originalLocation = event.location;
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
        } else return errorMsg.textContent =result.error;
    } catch(err){
        console.error("Fetch error: ", err);
        errorMsg.textContent = "Er is iets misgegaan, probeer het later opnieuw.";
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
    const category = document.getElementById("itemCategory").value;

    if (!name || isNaN(price) || isNaN(stock)) return errorMsg.textContent = "Alle velden zijn verplicht.";

    try {
        const res = await fetch("/addItem", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sectionId, name, price, stock, category})
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
    const errorMsg = document.getElementById("errorMsgDelete");
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
            errorMsg.textContent = "Fout bij verwijderen: " + result.error;
        }
    } catch(err){
        console.error(err);
        errorMsg.textContent = "Er is iets misgegaan bij het verwijderen, probeer het later opnieuw.";
    }
}

window.deleteItem = async function(id, eventId) {
    if(!confirm("Weet je zeker dat je dit Item wilt verwijderen?")) return;
    const errorMsg = document.getElementById(`errorMsgItem-${eventId}`);

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
            errorMsg.textContent = "Fout bij verwijderen: " + result.error;
        }
    } catch(err){
        console.error(err);
        errorMsg.textContent = "Er is iets misgegaan, kon item niet verwijderen.";
    }
}

window.deleteStation = async function(id, eventId) {
    if(!confirm("Weet je zeker dat je dit Item wilt verwijderen?")) return;
    const errorMsg = document.getElementById(`errorMsgStation-${eventId}`);

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
            errorMsg.textContent = "Fout bij verwijderen: " + result.error;
        }
    } catch(err){
        console.error(err);
        errorMsg.textContent = "Er is iets misgegaan.";
    }
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

// checkt welke event open moet blijven bij reload
const openEventId = sessionStorage.getItem('openEventId');
if(openEventId){
    window.openEventDetail(openEventId);
    sessionStorage.removeItem('openEventId');
}

//datum werking , kan geen verleden datum keizen en beginDatum < endDatum
window.addEventListener("DOMContentLoaded", () => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    const forms = [
        { startDate: "startDate", startTime: "startTime", endDate: "endDate", endTime: "endTime" },
        { startDate: "newStartDate", startTime: "NewStartTime", endDate: "newEndDate", endTime: "NewEndTime" }
    ];

    forms.forEach(f => {
        const sDate = document.getElementById(f.startDate);
        const sTime = document.getElementById(f.startTime);
        const eDate = document.getElementById(f.endDate);
        const eTime = document.getElementById(f.endTime);

        if(!sDate || !sTime || !eDate || !eTime) return;

        sDate.setAttribute("min", todayStr);
        eDate.setAttribute("min", todayStr);

        function updateEndConstraints() {
            if(!sDate.value || !sTime.value) return;

            const startDT = new Date(`${sDate.value}T${sTime.value}`);
            let endDT = new Date(`${eDate.value || sDate.value}T${eTime.value || sTime.value}`);

            // Als eind < start of gelijk → zet eind = start + 1 minuut
            if(endDT <= startDT) {
                endDT = new Date(startDT.getTime() + 60000); // +1 minuut
                eDate.value = endDT.toISOString().split("T")[0];
                eTime.value = endDT.toTimeString().slice(0,5);
            }

            eDate.setAttribute("min", sDate.value);

            // Als zelfde dag → eindtijd > starttijd
            if(eDate.value === sDate.value) {
                eTime.setAttribute("min", new Date(startDT.getTime() + 60000).toTimeString().slice(0,5));
            } else {
                eTime.removeAttribute("min");
            }
        }

        sDate.addEventListener("change", updateEndConstraints);
        sTime.addEventListener("change", updateEndConstraints);
        eDate.addEventListener("change", updateEndConstraints);
        eTime.addEventListener("change", updateEndConstraints);
    });

    // Extra check bij submit
    ["eventAanmaakForm", "editEventForm"].forEach(id => {
        const form = document.getElementById(id);
        if(!form) return;
        form.addEventListener("submit", e => {
            const sDate = form.querySelector('input[type="date"][id*="start"]');
            const sTime = form.querySelector('input[type="time"][id*="start"]');
            const eDate = form.querySelector('input[type="date"][id*="end"]');
            const eTime = form.querySelector('input[type="time"][id*="end"]');

            const startDT = new Date(`${sDate.value}T${sTime.value}`);
            const endDT = new Date(`${eDate.value}T${eTime.value}`);

            if(endDT <= startDT) {
                e.preventDefault();
                alert("De eindtijd moet strikt na de starttijd liggen.");
            }
        });
    });
});


