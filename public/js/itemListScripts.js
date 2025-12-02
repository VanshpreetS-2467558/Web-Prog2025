document.addEventListener('DOMContentLoaded', () => {
  // Request notification permission on page load
  if('Notification' in window && Notification.permission === 'default'){
    Notification.requestPermission();
  }

  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  let activeOrder = JSON.parse(localStorage.getItem('activeOrder')) || null;
  let currentStation = localStorage.getItem('currentStation') || null;
  let currentGroepspot = JSON.parse(localStorage.getItem('currentGroepspot')) || null;
  let groepspotPollInterval = null;
  let festCoinsPollInterval = null;
  let heartbeatInterval = null;
  let stockUpdateInterval = null;

  function saveCart(){ localStorage.setItem('cart', JSON.stringify(cart)); }
  function saveActiveOrder(){ localStorage.setItem('activeOrder', JSON.stringify(activeOrder)); }
  function saveGroepspot(){ 
    if(currentGroepspot) localStorage.setItem('currentGroepspot', JSON.stringify(currentGroepspot));
    else localStorage.removeItem('currentGroepspot');
  }

  function renderCart(){
    const cartItems = document.getElementById('cartItems');
    const emptyMsg = document.getElementById('emptyCartMsg');
    const cartButtons = document.getElementById('cartButtons');
    const qrButtonContainer = document.getElementById('qrButtonContainer');

    if(!cart || cart.length===0){
      cartItems.classList.add('hidden');
      emptyMsg.classList.remove('hidden');
      cartButtons.classList.add('hidden');
    } else {
      cartItems.innerHTML = cart.map(item => `
        <div class="flex justify-between items-center bg-gray-100 p-2 rounded">
          <div class="flex-1">
            <p class="font-medium">${item.name}</p>
            <p class="text-xs text-gray-500">${item.sectionName || ''}</p>
          </div>
          <div class="flex items-center gap-3">
            <button class="px-2 py-1 border rounded text-sm" onclick="removeFromCart(${item.id})">-</button>
            <span class="font-medium w-8 text-center">${item.quantity}x</span>
            <button class="px-2 py-1 bg-blue-500 text-white rounded text-sm" onclick='addToCartItem(${JSON.stringify(item)})'>+</button>
            <p class="font-semibold text-right bg-gradientkleurBR bg-clip-text text-transparent">${item.price * item.quantity} FestCoins</p>
          </div>
        </div>
      `).join('');
      cartItems.classList.remove('hidden');
      emptyMsg.classList.add('hidden');
      if(!activeOrder) cartButtons.classList.remove('hidden');
    }

    if(activeOrder){
      qrButtonContainer.classList.remove('hidden');
      cartButtons.classList.add('hidden');
    } else {
      qrButtonContainer.classList.add('hidden');
    }

    updateCartTotals();
  }

  function updateCartTotals(){
    const totalPrice = cart.reduce((sum,i)=>sum+i.price*i.quantity,0);
    const totalItems = cart.reduce((sum,i)=>sum+i.quantity,0);

    const orderBtn = document.getElementById('orderBtn');
    const groupBtn = document.getElementById('groupPotBtn');
    if(orderBtn) orderBtn.textContent = `Bestel (${totalPrice} FestCoins)`;
    if(groupBtn) groupBtn.textContent = `Groepspot (${totalItems} items)`;
  }

  function updateGroupDialog(){
    const totalPrice = cart.reduce((sum,i)=>sum+i.price*i.quantity,0);
    const totalItems = cart.reduce((sum,i)=>sum+i.quantity,0);
    const groupTotal = document.getElementById('groupTotal');
    const groupItems = document.getElementById('groupItems');
    if(groupTotal) groupTotal.textContent = `${totalPrice} FestCoins`;
    if(groupItems) groupItems.textContent = `${totalItems} items`;
  }

  function generateQRCode(qrCode, containerId){
    const container = document.getElementById(containerId);
    if(!container) return;
    container.innerHTML = '';
    
    if(typeof QRCode !== 'undefined'){
      try {
        new QRCode(container, {
          text: qrCode,
          width: 192,
          height: 192,
          colorDark: "#000000",
          colorLight: "#ffffff",
          correctLevel: QRCode.CorrectLevel.H
        });
      } catch(error){
        console.error('QR Code generation error:', error);
        container.innerHTML = `<div class="text-center p-4"><p class="text-xs text-gray-600 break-all">${qrCode}</p></div>`;
      }
    } else {
      // Fallback: show QR code as text
      container.innerHTML = `<div class="text-center p-4"><p class="text-xs text-gray-600 break-all">${qrCode}</p></div>`;
    }
  }

  async function updateGroepspotStatus(){
    if(!currentGroepspot || !currentGroepspot.id) return;

    try {
      const res = await fetch(`/groepspot/${currentGroepspot.id}`);
      const data = await res.json();
      if(data.success && data.groepspot){
        currentGroepspot.remainingAmount = data.groepspot.remainingAmount;
        currentGroepspot.status = data.groepspot.status;
        saveGroepspot();
        updateGroepspotUI();
      }
    } catch(err){
      console.error('Error updating groepspot status:', err);
    }
  }

  function updateGroepspotUI(){
    if(!currentGroepspot) return;

    const remainingEl = document.getElementById('groupRemaining');
    const finalizeBtn = document.getElementById('finalizeGroupBtn');
    
    if(remainingEl){
      remainingEl.textContent = `${currentGroepspot.remainingAmount} FestCoins`;
    }

    if(finalizeBtn){
      if(currentGroepspot.remainingAmount === 0 && currentGroepspot.status === 'pending'){
        finalizeBtn.disabled = false;
        finalizeBtn.classList.remove('bg-gray-300');
        finalizeBtn.classList.add('bg-green-500', 'hover:bg-green-600', 'text-white');
        finalizeBtn.textContent = 'Bestellen!';
      } else {
        finalizeBtn.disabled = true;
        finalizeBtn.classList.remove('bg-green-500', 'hover:bg-green-600', 'text-white');
        finalizeBtn.classList.add('bg-gray-300');
        finalizeBtn.textContent = 'Wachten op vrienden...';
      }
    }
  }

  window.openGroup = async function(){
    if(cart.length === 0){
      alert("Winkelwagen is leeg!");
      return;
    }

    const totalPrice = cart.reduce((sum,i)=>sum+i.price*i.quantity,0);
    const totalItems = cart.reduce((sum,i)=>sum+i.quantity,0);

    updateGroupDialog();

    try {
      const res = await fetch('/groepspot/create', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          items: cart,
          eventId: typeof eventId !== 'undefined' ? eventId : null
        })
      });

      const data = await res.json();
      if(!data.success){
        alert("Groepspot aanmaken mislukt: " + data.error);
        return;
      }

      currentGroepspot = {
        id: data.groepspotId,
        qrCode: data.qrCode,
        totalAmount: data.totalAmount,
        remainingAmount: data.remainingAmount,
        status: 'pending'
      };
      saveGroepspot();

      // Generate QR code
      generateQRCode(data.qrCode, 'qrCodeContainer');

      // Update UI
      updateGroepspotUI();

      // Show dialog
      document.getElementById('groupDialog').classList.remove('hidden');

      // Start polling for updates
      if(groepspotPollInterval) clearInterval(groepspotPollInterval);
      groepspotPollInterval = setInterval(updateGroepspotStatus, 2000);

    } catch(err){
      console.error(err);
      alert("Groepspot aanmaken mislukt: internal error");
    }
  }

  window.closeGroupDialog = function(){
    document.getElementById('groupDialog').classList.add('hidden');
    if(groepspotPollInterval){
      clearInterval(groepspotPollInterval);
      groepspotPollInterval = null;
    }
  }

  window.addCreatorContribution = async function(){
    if(!currentGroepspot) return;

    const input = document.getElementById('creatorContribution');
    const amount = parseInt(input.value) || 0;

    if(amount <= 0){
      alert("Voer een geldig bedrag in");
      return;
    }

    if(amount > currentGroepspot.remainingAmount){
      alert(`Maximum bijdrage is ${currentGroepspot.remainingAmount} FestCoins`);
      return;
    }

    try {
      const res = await fetch('/groepspot/creator-contribute', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          groepspotId: currentGroepspot.id,
          amount: amount
        })
      });

      const data = await res.json();
      if(!data.success){
        alert("Bijdrage mislukt: " + data.error);
        return;
      }

      currentGroepspot.remainingAmount = data.remainingAmount;
      saveGroepspot();
      updateGroepspotUI();
      input.value = 0;
      
      // Update user festCoins from response
      if(data.newAmount !== undefined){
        user.festCoins = data.newAmount;
      }
      
      // Show current contribution
      showCreatorContribution();

    } catch(err){
      console.error(err);
      alert("Bijdrage mislukt: internal error");
    }
  }

  window.finalizeGroepspot = async function(){
    if(!currentGroepspot) return;

    if(currentGroepspot.remainingAmount > 0){
      alert("Nog niet volledig betaald!");
      return;
    }

    if(!confirm("Weet je zeker dat je wilt bestellen? Dit zal FestCoins afschrijven van alle bijdragers.")){
      return;
    }

    try {
      const res = await fetch('/groepspot/finalize', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          groepspotId: currentGroepspot.id
        })
      });

      const data = await res.json();
      if(!data.success){
        alert("Bestellen mislukt: " + data.error);
        return;
      }

      // Check and show budget notifications
      if(data.budgetExceeded && data.budgetAlarms && data.budgetAlarms.length > 0){
        showBudgetNotifications(data.budgetAlarms);
      }

      alert("Bestelling gelukt! De FestCoins zijn afgeschreven van alle bijdragers.");

      // Create active order (same as normal order)
      try {
        const itemsRes = await fetch(`/groepspot/items/${currentGroepspot.id}`);
        const itemsData = await itemsRes.json();
        if(itemsData.success){
          // Create active order from groepspot items
          activeOrder = { 
            items: itemsData.items.map(i => ({
              id: i.id,
              name: i.name,
              price: i.price,
              quantity: i.quantity,
              sectionName: ''
            })), 
            scanned: false,
            isGroepspot: true,
            groepspotId: currentGroepspot.id
          };
          saveActiveOrder();
        }
      } catch(err){
        console.error('Error creating active order:', err);
      }

      // Clear groepspot
      currentGroepspot = null;
      saveGroepspot();
      cart = [];
      saveCart();

      // Stop polling
      if(groepspotPollInterval){
        clearInterval(groepspotPollInterval);
        groepspotPollInterval = null;
      }

      // Close dialog
      document.getElementById('groupDialog').classList.add('hidden');

      // Update UI
      renderCart();
      updateCartTotals();
      updateGroupDialog();
      
      // Update user festCoins
      if(data.newAmount !== undefined){
        user.festCoins = data.newAmount;
        updateFestCoinsDisplay();
      }

      // Update item stocks
      updateItemStocks();

    } catch(err){
      console.error(err);
      alert("Bestellen mislukt: internal error");
    }
  }

  async function showCreatorContribution(){
    if(!currentGroepspot) return;
    
    try {
      const res = await fetch(`/groepspot/${currentGroepspot.id}`);
      const data = await res.json();
      if(data.success && data.groepspot.contributions){
        const creatorContrib = data.groepspot.contributions.find(c => c.contributorId === user.id);
        if(creatorContrib){
          document.getElementById('currentContribution').classList.remove('hidden');
          document.getElementById('currentContributionAmount').textContent = creatorContrib.amount;
          currentGroepspot.contributionId = creatorContrib.id;
          saveGroepspot();
        } else {
          document.getElementById('currentContribution').classList.add('hidden');
        }
      }
    } catch(err){
      console.error('Error loading contribution:', err);
    }
  }

  window.updateCreatorContribution = async function(){
    if(!currentGroepspot || !currentGroepspot.contributionId) return;
    
    const input = document.getElementById('creatorContribution');
    const newAmount = parseInt(input.value) || 0;
    
    if(newAmount < 0){
      alert("Bijdrage kan niet negatief zijn");
      return;
    }
    
    try {
      const res = await fetch('/groepspot/update-contribution', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          contributionId: currentGroepspot.contributionId,
          newAmount: newAmount
        })
      });
      
      const data = await res.json();
      if(!data.success){
        alert("Bijdrage wijzigen mislukt: " + data.error);
        return;
      }
      
      currentGroepspot.remainingAmount = data.remainingAmount;
      saveGroepspot();
      updateGroepspotUI();
      input.value = 0;
      
      if(data.newAmount !== undefined){
        user.festCoins = data.newAmount;
        updateFestCoinsDisplay();
      }
      
      showCreatorContribution();
    } catch(err){
      console.error(err);
      alert("Bijdrage wijzigen mislukt: internal error");
    }
  }

  window.deleteCreatorContribution = async function(){
    if(!currentGroepspot || !currentGroepspot.contributionId) return;
    
    if(!confirm("Weet je zeker dat je je bijdrage wilt verwijderen?")){
      return;
    }
    
    try {
      const res = await fetch('/groepspot/delete-contribution', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          contributionId: currentGroepspot.contributionId
        })
      });
      
      const data = await res.json();
      if(!data.success){
        alert("Bijdrage verwijderen mislukt: " + data.error);
        return;
      }
      
      currentGroepspot.remainingAmount = data.remainingAmount;
      currentGroepspot.contributionId = null;
      saveGroepspot();
      updateGroepspotUI();
      
      if(data.newAmount !== undefined){
        user.festCoins = data.newAmount;
        updateFestCoinsDisplay();
      }
      
      document.getElementById('currentContribution').classList.add('hidden');
    } catch(err){
      console.error(err);
      alert("Bijdrage verwijderen mislukt: internal error");
    }
  }

  // Initialize groepspot if exists
  if(currentGroepspot && currentGroepspot.id){
    generateQRCode(currentGroepspot.qrCode, 'qrCodeContainer');
    updateGroepspotUI();
    showCreatorContribution();
    groepspotPollInterval = setInterval(updateGroepspotStatus, 2000);
  }

  window.addToCartItem = function(item){
    if(activeOrder && !activeOrder.scanned){
      alert("Je hebt een lopende bestelling! Nieuwe items toevoegen is niet toegestaan.");
      return;
    }

    // Check if item is out of stock
    const itemCard = document.querySelector(`[data-item-id="${item.id}"]`);
    if(itemCard){
      const stockEl = itemCard.querySelector('[data-stock]');
      if(stockEl && stockEl.textContent.includes('Out of stock')){
        alert("Dit item is niet meer op voorraad!");
        return;
      }
    }

    const currentTotal = cart.reduce((sum,i)=>sum+i.price*i.quantity,0);
    if(currentTotal + item.price > user.festCoins){
      alert("Niet genoeg saldo!");
      return;
    }

    const existing = cart.find(i=>i.id===item.id);
    if(existing) existing.quantity++;
    else cart.push({...item, quantity:1});

    saveCart();
    renderCart();
    updateGroupDialog();
  }

  window.removeFromCart = function(id){
    const idx = cart.findIndex(i=>i.id===id);
    if(idx===-1) return;
    cart[idx].quantity--;
    if(cart[idx].quantity<=0) cart.splice(idx,1);
    saveCart();
    renderCart();
    updateGroupDialog();
  }

  window.openOrderPopup = function(){
    const orderItems = document.getElementById('orderItems');
    orderItems.innerHTML = cart.map(i=>`<p>${i.name} x${i.quantity} - ${i.price*i.quantity} FestCoins</p>`).join('');
    document.getElementById('orderTotal').textContent = cart.reduce((sum,i)=>sum+i.price*i.quantity,0) + ' FestCoins';
    document.getElementById('bestelDialog').classList.remove('hidden');
  }

  window.placeOrder = async function(){
    if(cart.length===0) return;

    const itemsDict = {};
    cart.forEach(i=>itemsDict[i.id]=i.quantity);

    try{
      const res = await fetch("/transaction",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({items:itemsDict})
      });
      const data = await res.json();
      if(!data.success){ alert("Bestelling mislukt: "+data.error); return; }

      activeOrder = { items:[...cart], scanned:false };
      saveActiveOrder();

      cart = [];
      localStorage.removeItem('cart');

      // Update user festCoins
      if(data.newAmount !== undefined){
        user.festCoins = data.newAmount;
        updateFestCoinsDisplay();
      }

      // Update item stocks
      updateItemStocks();

      // Check and show budget notifications
      if(data.budgetExceeded && data.budgetAlarms && data.budgetAlarms.length > 0){
        showBudgetNotifications(data.budgetAlarms);
      }

      alert("Bestelling gelukt! Gebruik QR-knop om af te handelen (devmode).");

      renderCart();
      updateCartTotals();
      updateGroupDialog();
      document.getElementById('bestelDialog').classList.add('hidden');
    } catch(err){
      console.error(err);
      alert("Bestelling mislukt: internal error");
    }
  }

  // Request notification permission on page load
  if('Notification' in window && Notification.permission === 'default'){
    Notification.requestPermission();
  }

  // Show budget notifications
  function showBudgetNotifications(alarms){
    alarms.forEach(alarm => {
      const message = `⚠️ Budget limiet bereikt voor ${alarm.category}!\n\n` +
                     `Budget: ${alarm.budgetLimit} FestCoins\n` +
                     `Huidige uitgaven: ${alarm.newSpending} FestCoins\n` +
                     `Je hebt ${alarm.newSpending - alarm.budgetLimit} FestCoins te veel uitgegeven.\n\n` +
                     `Overweeg om meer FestCoins bij te kopen.`;
      
      // Browser notification
      if('Notification' in window && Notification.permission === 'granted'){
        new Notification('Budget Alarm - ' + alarm.category, {
          body: `Je budget limiet voor ${alarm.category} is overschreden. Overweeg om meer FestCoins bij te kopen.`,
          icon: '/assets/favicon.ico',
          tag: 'budget-alarm-' + alarm.category
        });
      } else if('Notification' in window && Notification.permission === 'default'){
        Notification.requestPermission().then(permission => {
          if(permission === 'granted'){
            new Notification('Budget Alarm - ' + alarm.category, {
              body: `Je budget limiet voor ${alarm.category} is overschreden. Overweeg om meer FestCoins bij te kopen.`,
              icon: '/assets/favicon.ico',
              tag: 'budget-alarm-' + alarm.category
            });
          }
        });
      }
      
      // In-app notification
      showNotification(message, 'warning');
    });
  }

  // Show notification helper
  function showNotification(message, type = 'info'){
    const notification = document.getElementById('notificatie');
    if(notification){
      notification.textContent = message;
      notification.className = `fixed top-16 right-4 px-4 py-3 rounded-lg shadow-lg z-50 transition-opacity duration-500 ${
        type === 'warning' ? 'bg-yellow-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'
      } text-white`;
      notification.classList.remove('opacity-0', 'pointer-events-none');
      
      setTimeout(() => {
        notification.classList.add('opacity-0', 'pointer-events-none');
      }, 5000);
    }
  }

  window.openQRActiveOrder = function(){
    if(!activeOrder) return;
    document.getElementById('qrOrderItems').innerHTML = activeOrder.items.map(i=>`${i.name} x${i.quantity}`).join('<br>');
    document.getElementById('qrOrderTotal').textContent = activeOrder.items.reduce((sum,i)=>sum+i.price*i.quantity,0) + ' FestCoins';
    document.getElementById('qrDialog').classList.remove('hidden');
  }

  window.handleActiveOrder = function(){
    if(!activeOrder) return;
    activeOrder.scanned = true;
    saveActiveOrder();
    activeOrder = null;
    localStorage.removeItem('activeOrder');
    renderCart();
    updateCartTotals();
    updateGroupDialog();
    alert("Bestelling afgehandeld! Je kan nu weer items toevoegen.");
    document.getElementById('qrDialog').classList.add('hidden');
  }

  // Setup event listeners for groepspot buttons (using event delegation)
  document.addEventListener('click', (e) => {
    if(e.target.id === 'addCreatorContribution'){
      window.addCreatorContribution();
    } else if(e.target.id === 'finalizeGroupBtn'){
      window.finalizeGroepspot();
    }
  });

  // Tabs
  document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      const clicked = btn.dataset.tab;

      // Reset cart bij station-wissel (met bevestiging)
      if (cart.length > 0 && clicked !== currentStation) {
        const confirmReset = confirm("Je gaat naar een ander station. Winkelmandje leegmaken?");
        if (!confirmReset) return;

        cart = [];
        saveCart();
        renderCart();
        updateGroupDialog();
      }

      // Station opslaan
      currentStation = clicked;
      localStorage.setItem('currentStation', clicked);


      // JUISTE TAB-STYLING
      document.querySelectorAll('[data-tab]').forEach(b => {
        b.classList.remove('bg-blue-500', 'text-white');
        b.classList.add('bg-gray-300', 'text-black');
      });

      btn.classList.remove('bg-gray-300', 'text-black');
      btn.classList.add('bg-blue-500', 'text-white');

      // Content tonen
      document.querySelectorAll('[data-tab-content]').forEach(c => c.classList.add('hidden'));
      const content = document.querySelector(`[data-tab-content="${clicked}"]`);
      if (content) content.classList.remove('hidden');
    });
  });
  
  renderCart();
  updateCartTotals();
  updateGroupDialog();

  // Start dynamic updates
  startDynamicUpdates();
});

// Dynamic updates
function startDynamicUpdates(){
  // Update FestCoins every 3 seconds
  festCoinsPollInterval = setInterval(async () => {
    try {
      const res = await fetch('/user/festcoins');
      const data = await res.json();
      if(data.success){
        user.festCoins = data.festCoins;
        updateFestCoinsDisplay();
      }
    } catch(err){
      console.error('Error updating festCoins:', err);
    }
  }, 3000);

  // Heartbeat every 30 seconds
  if(typeof eventId !== 'undefined'){
    heartbeatInterval = setInterval(async () => {
      try {
        await fetch(`/events/${eventId}/heartbeat`, { method: 'POST' });
      } catch(err){
        console.error('Error sending heartbeat:', err);
      }
    }, 30000);
  }

  // Update item stock every 5 seconds
  stockUpdateInterval = setInterval(() => {
    updateItemStocks();
  }, 5000);

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if(festCoinsPollInterval) clearInterval(festCoinsPollInterval);
    if(heartbeatInterval) clearInterval(heartbeatInterval);
    if(stockUpdateInterval) clearInterval(stockUpdateInterval);
  });
}

function updateFestCoinsDisplay(){
  const eventFestCoins = document.getElementById('eventFestCoins');
  const festCoinsHeader = document.getElementById('festCoinsHeader');
  const festCoinsSaldo = document.getElementById('festCoinsSaldo');
  
  if(eventFestCoins) eventFestCoins.textContent = user.festCoins;
  if(festCoinsHeader) festCoinsHeader.textContent = `FestCoins: ${user.festCoins}`;
  if(festCoinsSaldo) festCoinsSaldo.textContent = user.festCoins;
}

async function updateItemStocks(){
  // Get all item elements
  const itemCards = document.querySelectorAll('[data-item-id]');
  itemCards.forEach(async (card) => {
    const itemId = card.getAttribute('data-item-id');
    try {
      const res = await fetch(`/items/${itemId}/stock`);
      const data = await res.json();
      if(data.success){
        const stockEl = card.querySelector('[data-stock]');
        const addButton = card.querySelector('button');
        if(stockEl){
          if(data.stock === 0){
            stockEl.textContent = 'Out of stock';
            stockEl.className = 'px-2 py-1 text-xs font-medium rounded bg-gray-500 text-white';
            // Disable add button
            if(addButton){
              addButton.disabled = true;
              addButton.className = 'flex items-center px-3 py-1 bg-gray-400 text-white rounded cursor-not-allowed';
              addButton.textContent = 'Out of stock';
            }
          } else {
            stockEl.textContent = `${data.stock} op voorraad`;
            stockEl.className = `px-2 py-1 text-xs font-medium rounded ${data.stock > 50 ? 'bg-green-700 text-white' : 'bg-red-100 text-red-700'}`;
            // Enable add button if it was disabled
            if(addButton && addButton.disabled){
              addButton.disabled = false;
              addButton.className = 'flex items-center px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600';
              addButton.textContent = '+ Toevoegen';
            }
          }
        }
      }
    } catch(err){
      console.error(`Error updating stock for item ${itemId}:`, err);
    }
  });
}