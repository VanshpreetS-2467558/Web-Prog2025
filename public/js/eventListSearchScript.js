const searchInput = document.getElementById("searchInput");
const eventCards = document.querySelectorAll(".eventCard");

searchInput.addEventListener("input", () => {
    const term = searchInput.value.toLowerCase();
    eventCards.forEach(card => {
        const name = card.querySelector("h3").textContent.toLowerCase();
        const location = card.querySelector(".text-gray-500 > div:first-child").textContent.toLowerCase();
        if(name.includes(term) || location.includes(term)) {
            card.style.display = "block";
        } else {
            card.style.display = "none";
        }
    });
});