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

        // Store lists
        evenementen = data.evenementen || [];
        stations = data.stations || [];

        // Fill first dropdown
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

    // IMPORTANT: use correct field names
    const filtered = stations.filter(st => st.eventId == parseInt(eventId));

    stationSelect.innerHTML = `<option value="">Selecteer een station</option>`;
    filtered.forEach(st => {
        const option = document.createElement("option");
        option.value = st.id;   // station.id
        option.textContent = st.name;
        stationSelect.appendChild(option);
    });

    stationWrapper.classList.remove("hidden");
});

// SUBMIT HANDLER
document.getElementById("registratieform").addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const evenementId = document.getElementById("evenement").value;
    const stationId   = document.getElementById("station").value;

    const errorMsg = document.getElementById("errorMsg");

    if (password !== confirmPassword) {
        errorMsg.textContent = "Wachtwoorden komen niet overeen.";
        return;
    }

    const res = await fetch("/newEmployee", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            name,
            password,
            confirmPassword,
            evenementId,
            stationId
        }),
    });

    const result = await res.json();

    if (result.success) {
        sessionStorage.setItem('showNotification', "Account succesvol aangemaakt!");
        window.location.href = "/home";
    } else {
        errorMsg.textContent = result.error;
    }
});
