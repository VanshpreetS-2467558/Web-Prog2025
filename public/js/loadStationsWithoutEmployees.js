// loadStationsZonderWerknemers.js
async function fetchStationsWithoutEmployees() {
  try {
    // Fetch stations without employees
    const res = await fetch("/employee/getStationsWithoutEmployees", {
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
  const tbody = document.getElementById("stations-tbody");
  if (!tbody) return;
  
  tbody.innerHTML = "";

  if (!stations.length) {
    document.getElementById("no-stations").classList.remove("hidden");
    return;
  } else {
    document.getElementById("no-stations").classList.add("hidden");
  }

  stations.forEach(station => {
    const tr = document.createElement("tr");
    tr.className = "hover:bg-gray-50 transition-colors duration-150";

    tr.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${station.eventName}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${station.name}</td>
    `;

    tbody.appendChild(tr);
  });
}

// Run on page load
document.addEventListener("DOMContentLoaded", fetchStationsWithoutEmployees);
