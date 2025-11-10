

// voor openen/sluiten van faq kolom
function toggle(btn) {
    const content = btn.nextElementSibling;
    const isOpen = content.classList.contains('open');

    // Sluit andere envetueel open kolommen van faq
    document.querySelectorAll('.accordion-content').forEach(c => {
      c.style.maxHeight = null;
      c.classList.remove('open');
      c.previousElementSibling.querySelector('span').classList.remove('rotate-180');
    });

    // Open huidige (als hij nog niet open was)
    if (!isOpen) {
      content.style.maxHeight = content.scrollHeight + 'px';
      content.classList.add('open');
      btn.querySelector('span').classList.add('rotate-180');
    }
}