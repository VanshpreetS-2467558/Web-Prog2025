async function loadEmployees() {
    try {
        const tbody = await waitForElement("#employees-table tbody");
        const noEmployees = document.getElementById("no-employees");

        const response = await fetch("/listEmployees", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({})
        });

        const data = await response.json();
        tbody.innerHTML = ""; // Clear previous rows

        if (data.success && data.employees && data.employees.length > 0) {
            noEmployees.classList.add("hidden");

            data.employees.forEach(emp => {
                const row = document.createElement("tr");
                row.className = "bg-white hover:bg-gray-50";
                row.innerHTML = `
                    <td class="px-6 py-3 text-sm text-gray-700">${emp.id}</td>
                    <td class="px-6 py-3 text-sm text-gray-700">${emp.name}</td>
                    <td class="px-6 py-3 text-sm text-gray-700">${emp.eventName}</td>
                    <td class="px-6 py-3 text-sm text-gray-700">${emp.stationName}</td>
                `;
                tbody.appendChild(row);
            });
        } else {
            noEmployees.classList.remove("hidden");
        }
    } catch (err) {
        console.error("Error fetching employees:", err);
    }
}

// Utility: wait for element to appear in DOM
function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const el = document.querySelector(selector);
        if (el) return resolve(el);

        const observer = new MutationObserver(() => {
            const el = document.querySelector(selector);
            if (el) {
                observer.disconnect();
                resolve(el);
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });

        setTimeout(() => {
            observer.disconnect();
            reject(new Error("Element not found: " + selector));
        }, timeout);
    });
}

window.addEventListener("DOMContentLoaded", loadEmployees);
