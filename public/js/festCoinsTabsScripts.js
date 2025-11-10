


// eenvoudige tab-switch logica
const tabs = document.querySelectorAll('.tab-btn');
const contents = document.querySelectorAll('.tab-content');

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('text-purple-500', 'border-b-2', 'border-purple-400'));
        contents.forEach(c => c.classList.add('hidden'));

        tab.classList.add('text-purple-500', 'border-b-2', 'border-purple-400');
        document.getElementById(tab.dataset.tab).classList.remove('hidden');
    });
});

// bedrag invullen
function setAmount(id, amount) {
document.getElementById(id).value = amount.toFixed(2);
}