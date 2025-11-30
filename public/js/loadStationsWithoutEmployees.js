// loadStationsZonderWerknemers.js
async function fetchStationsWithoutEmployees() {
  try {
    // Fetch stations without employees
    const res = await fetch("/getStationsWithoutEmployees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();
    if (!data.success) throw new Error(data.error);

    const stations = data.stations;

    renderStations(stations);
  } catch (err) {
    console.error("Error loading stations without employees:", err);
  }
}

function renderStations(stations) {
  const tbody = document.querySelector("#stations-table tbody");
  tbody.innerHTML = "";

  if (!stations.length) {
    document.getElementById("no-stations").classList.remove("hidden");
    return;
  } else {
    document.getElementById("no-stations").classList.add("hidden");
  }

  stations.forEach(station => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td class="px-6 py-3 text-sm text-gray-700">${station.eventName}</td>
      <td class="px-6 py-3 text-sm text-gray-700">${station.name}</td>
    `;

    tbody.appendChild(tr);
  });
}

// Run on page load
document.addEventListener("DOMContentLoaded", fetchStationsWithoutEmployees);
