function setupPhotonAutocomplete(inputId, suggestionsId) {
    const input = document.getElementById(inputId);
    const suggestionsList = document.getElementById(suggestionsId);
    let selectedLocation = null;

    // Enter niet submitten als er nog geen selectie is
    input.addEventListener("keydown", e => {
        if(e.key === "Enter" && !selectedLocation) e.preventDefault();
    });

    input.addEventListener("input", async () => {
        const query = input.value;
        if(!query) {
            suggestionsList.innerHTML = "";
            suggestionsList.classList.add("hidden");
            selectedLocation = null;
            return;
        }

        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`);
        const data = await res.json();

        suggestionsList.innerHTML = "";
        if(!data.features.length) {
            suggestionsList.classList.add("hidden");
            return;
        }

        data.features.forEach(f => {
            const li = document.createElement("li");
            li.classList.add("p-2", "hover:bg-gray-200", "cursor-pointer");

            // Formaat: Land, Stad / Plek
            const props = f.properties;
            li.textContent = `${props.country || ""}, ${props.city || props.name}`;

            li.addEventListener("click", () => {
                input.value = li.textContent;
                selectedLocation = f;
                suggestionsList.classList.add("hidden");
            });

            suggestionsList.appendChild(li);
        });

        suggestionsList.classList.remove("hidden");
    });

    return () => selectedLocation; // functie om de gekozen locatie op te halen
}

const getSelectedCreate = setupPhotonAutocomplete("location", "suggestionsCreate");
const getSelectedEdit = setupPhotonAutocomplete("newLocation", "suggestionsEdit");

// Aanmaak form submit
document.getElementById("eventAanmaakForm").addEventListener("submit", e => {
    if(!getSelectedCreate()) {
        e.preventDefault();
        alert("Kies een locatie uit de lijst!");
    }
});

// Bewerken form submit
document.getElementById("editEventForm").addEventListener("submit", e => {
    if(!getSelectedEdit()) {
        e.preventDefault();
        alert("Kies een locatie uit de lijst!");
    }
});
