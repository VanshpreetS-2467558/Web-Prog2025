import { showNotification } from "./headerScripts.js";

document.getElementById("deleteAccountBtn").addEventListener("click", async (e) => {
    e.preventDefault();
    const confirmDelete = confirm("Weet je het zeker? Deze actie kan niet ongedaan worden gemaakt.");

    // delete account if confirm button is pressed
    if (confirmDelete) {
        const res = await fetch("/deleteAccount", {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                });
        const result = await res.json();

        // check if deletion was successfull
        if (!result.success) alert(result.error);
        else {
            alert("Account successvol verwijderd.");
            window.location.href = "/home";
        }
    }
});