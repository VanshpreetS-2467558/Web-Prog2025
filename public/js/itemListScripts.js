document.addEventListener('DOMContentLoaded', () => {
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  let activeOrder = JSON.parse(localStorage.getItem('activeOrder')) || null;
  let currentStation = localStorage.getItem('currentStation') || null;

  function saveCart(){ localStorage.setItem('cart', JSON.stringify(cart)); }
  function saveActiveOrder(){ localStorage.setItem('activeOrder', JSON.stringify(activeOrder)); }

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

  window.addToCartItem = function(item){
    if(activeOrder && !activeOrder.scanned){
      alert("Je hebt een lopende bestelling! Nieuwe items toevoegen is niet toegestaan.");
      return;
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
      const res = await fetch("/transactions/transaction",{
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
});