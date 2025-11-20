


async function updateFestCoins() {
    const res = await fetch('/api/festCoins');
    const data = await res.json();
    document.querySelectorAll('.festCoins').forEach(el => el.textContent = data.festCoins);
}

updateFestCoins();