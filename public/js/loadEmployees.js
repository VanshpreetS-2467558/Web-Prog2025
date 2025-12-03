async function loadEmployees() {
    try {
        const tbody = await waitForElement("#employees-tbody");
        const noEmployees = document.getElementById("no-employees");

        const response = await fetch("/employee/listEmployees", {
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
                row.className = "hover:bg-gray-50 transition-colors duration-150";

                row.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${emp.id}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${emp.name}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${emp.eventName}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${emp.stationName}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                        <button 
                            data-id="${emp.id}"
                            data-name="${emp.name}"
                            class="viewPassword px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-xs font-semibold transition-colors duration-200 shadow-sm hover:shadow-md">
                            Bekijk
                        </button>
                        <span class="viewed-password-${emp.id} ml-2 text-sm text-gray-600 hidden"></span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                        <button 
                            data-id="${emp.id}"
                            class="deleteEmployee px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-xs font-semibold transition-colors duration-200 shadow-sm hover:shadow-md">
                            Verwijder
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });

            attachDeleteHandlers();
            attachViewPasswordHandlers();

        } else {
            noEmployees.classList.remove("hidden");
        }
    } catch (err) {
        console.error("Error fetching employees:", err);
    }
}

function attachDeleteHandlers() {
    document.querySelectorAll(".deleteEmployee").forEach(btn => {
        btn.addEventListener("click", async () => {
            const employeeId = Number(btn.dataset.id);

            if (!confirm("Weet je zeker dat je deze werknemer wilt verwijderen?")) return;

            try {
                const res = await fetch("/employee/deleteEmployee", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ employeeId })
                });

                const data = await res.json();

                if (data.success) {
                    // Full page reload after successful deletion
                    window.location.reload();
                } else {
                    alert(data.error || "Verwijderen mislukt.");
                }
            } catch (err) {
                console.error("Delete error:", err);
                alert("Er is een fout opgetreden bij het verwijderen.");
            }
        });
    });
}

function attachViewPasswordHandlers() {
    document.querySelectorAll(".viewPassword").forEach(btn => {
        btn.addEventListener("click", async () => {
            const employeeId = Number(btn.dataset.id);
            const employeeName = btn.dataset.name;
            
            // Check if password is already shown
            const passwordSpan = document.querySelector(`.viewed-password-${employeeId}`);
            if (!passwordSpan.classList.contains("hidden")) {
                // Hide password
                passwordSpan.classList.add("hidden");
                btn.textContent = "Bekijk";
                return;
            }

            // Prompt for organizer password
            const organizerPassword = prompt(`Voer je wachtwoord in om het wachtwoord van ${employeeName} te bekijken:`);
            
            if (!organizerPassword) {
                return; // User cancelled
            }

            try {
                const res = await fetch("/employee/viewEmployeePassword", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ employeeId, organizerPassword })
                });

                const data = await res.json();

                if (data.success) {
                    // Show password
                    passwordSpan.textContent = data.password;
                    passwordSpan.classList.remove("hidden");
                    btn.textContent = "Verberg";
                } else {
                    alert(data.error || "Fout bij ophalen wachtwoord.");
                }
            } catch (err) {
                console.error("View password error:", err);
                alert("Er is een fout opgetreden bij het ophalen van het wachtwoord.");
            }
        });
    });
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
