// Modal elements
const showButton = document.getElementById("showFormWerknemer");
const closeButton = document.getElementById("closeFormWerknemer");
const modal = document.getElementById("nieuweWerknemerForm");
const mainContent = document.getElementById("mainContent");

// Show modal
showButton.addEventListener("click", () => {
    modal.classList.remove("hidden");
    mainContent.classList.add("blur-sm");
});

// Close modal
closeButton.addEventListener("click", () => {
    modal.classList.add("hidden");
    mainContent.classList.remove("blur-sm");
});

// Close modal when clicking outside the form
modal.addEventListener("click", (e) => {
    if (e.target === modal) {
        modal.classList.add("hidden");
        mainContent.classList.remove("blur-sm");
    }
});

// Data arrays (empty before load)
let evenementen = [];
let stations = [];

// Run when page loads
window.addEventListener("DOMContentLoaded", async () => {
    await loadEventData();
});

// Fetch evenementen + stations from backend
async function loadEventData() {
    try {
        const res = await fetch("/getEventData", {
            method: "POST",
            headers: { "Content-Type": "application/json" }
        });

        const data = await res.json();

        if (!data.success) {
            console.error("Kon events niet laden:", data.error);
            return;
        }

        evenementen = data.evenementen || [];
        stations = data.stations || [];

        fillEvenementDropdown();

    } catch (err) {
        console.error("Fout bij ophalen eventData:", err);
    }
}

// Fill evenementen dropdown
function fillEvenementDropdown() {
    const evenementSelect = document.getElementById("evenement");
    evenementSelect.innerHTML = `<option value="">Selecteer een evenement</option>`;
    evenementen.forEach(ev => {
        const option = document.createElement("option");
        option.value = ev.id;
        option.textContent = ev.name;
        evenementSelect.appendChild(option);
    });
}

// Dropdown elements
const stationWrapper = document.getElementById("stationWrapper");
const stationSelect  = document.getElementById("station");

// Filter stations when event is selected
document.getElementById("evenement").addEventListener("change", () => {
    const eventId = document.getElementById("evenement").value;

    if (!eventId) {
        stationWrapper.classList.add("hidden");
        stationSelect.innerHTML = `<option value="">Selecteer een station</option>`;
        return;
    }

    const filtered = stations.filter(st => st.eventId == parseInt(eventId));

    stationSelect.innerHTML = `<option value="">Selecteer een station</option>`;
    filtered.forEach(st => {
        const option = document.createElement("option");
        option.value = st.id;
        option.textContent = st.name;
        stationSelect.appendChild(option);
    });

    stationWrapper.classList.remove("hidden");
});

// Form submit handler
document.getElementById("registratieform").addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    const eventId = document.getElementById("evenement").value;
    const stationId = document.getElementById("station").value;

    const errorMsg = document.getElementById("errorMsg");

    if (password !== confirmPassword) {
        errorMsg.textContent = "Wachtwoorden komen niet overeen.";
        return;
    }

    try {
        const res = await fetch("/newEmployee", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ name, password, confirmPassword, eventId, stationId }),
        });

        const result = await res.json();

        if (result.success) {
            sessionStorage.setItem('showNotification', "Account succesvol aangemaakt!");
            window.location.href = "/werknemers";
        } else {
            errorMsg.textContent = result.error;
        }
    } catch (err) {
        errorMsg.textContent = "Fout bij aanmaken account. Probeer opnieuw.";
        console.error(err);
    }
});
