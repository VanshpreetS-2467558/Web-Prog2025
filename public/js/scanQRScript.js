const video = document.getElementById("video");
const output = document.getElementById("output");
let scannedQRCode = null;
let lastScannedCode = null;
let scanCooldown = false;

navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
    .then(stream => {
        video.srcObject = stream;
        video.play();
        requestAnimationFrame(scan);
    })
    .catch(err => {
        output.textContent = "Geen toegang tot camera: " + err;
    });

const canvas = document.createElement("canvas");
const context = canvas.getContext("2d");

function scan() {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code) {
            // Check if it's a groepspot QR code
            if (code.data.startsWith('GROEPSPOT_')) {
                if (code.data !== lastScannedCode && !scanCooldown) {
                    lastScannedCode = code.data;
                    scannedQRCode = code.data;
                    output.textContent = "Groepspot gevonden!";
                    handleGroepspotScan(code.data);
                    scanCooldown = true;
                    setTimeout(() => {
                        scanCooldown = false;
                        lastScannedCode = null;
                    }, 3000);
                }
            } else if (code.data.startsWith('ORDER_')) {
                // Handle order QR code
                if (code.data !== lastScannedCode && !scanCooldown) {
                    lastScannedCode = code.data;
                    output.textContent = "Bestelling gevonden!";
                    handleOrderScan(code.data);
                    scanCooldown = true;
                    setTimeout(() => {
                        scanCooldown = false;
                        lastScannedCode = null;
                    }, 3000);
                }
            } else {
                output.textContent = "Gescand: " + code.data;
            }
        } else {
            output.textContent = "Klaar om te scannen...";
        }
    }
    requestAnimationFrame(scan);
}

async function handleGroepspotScan(qrCode) {
    try {
        // Get groepspot info to show remaining amount
        const response = await fetch(`/groepspot/qr/${encodeURIComponent(qrCode)}`);
        const data = await response.json();
        
        if (data.success && data.groepspot) {
            if (data.groepspot.status !== 'pending') {
                alert("Deze groepspot is al afgehandeld.");
                return;
            }
            
            // Show contribution popup
            document.getElementById('contributionRemaining').textContent = `${data.groepspot.remainingAmount} FestCoins`;
            document.getElementById('contributionMax').textContent = `Maximum: ${data.groepspot.remainingAmount} FestCoins`;
            document.getElementById('contributionAmount').max = data.groepspot.remainingAmount;
            document.getElementById('contributionAmount').value = '';
            document.getElementById('contributionPopup').classList.remove('hidden');
            document.getElementById('scanField').classList.add('hidden');
        } else {
            alert("Groepspot niet gevonden of ongeldig.");
        }
    } catch (err) {
        console.error(err);
        alert("Fout bij ophalen groepspot informatie.");
    }
}

async function handleOrderScan(qrCode) {
    try {
        const response = await fetch(`/order/qr/${encodeURIComponent(qrCode)}`);
        const data = await response.json();
        
        if (data.success && data.order) {
            // Show order popup with items
            showOrderPopup(data.order);
        } else {
            alert(data.error || "Bestelling niet gevonden of ongeldig.");
        }
    } catch (err) {
        console.error(err);
        alert("Fout bij ophalen bestelling informatie.");
    }
}

function showOrderPopup(order) {
    const popup = document.getElementById('transactionPopup');
    if (!popup) {
        console.error('Transaction popup not found');
        return;
    }
    
    // Make sure popup is hidden first
    popup.classList.add('hidden');
    
    // Update items list
    const itemsList = document.getElementById('orderItemsList');
    if (itemsList) {
        if(order.items && order.items.length > 0) {
            itemsList.innerHTML = order.items.map(item => 
                `<li>${item.quantity}x ${item.itemName}</li>`
            ).join('');
        } else {
            itemsList.innerHTML = '<li>Geen items gevonden</li>';
        }
    } else {
        console.error('Order items list not found');
    }
    
    // Remove old event listeners and add new one
    const confirmBtn = document.getElementById('confirmBtn');
    if (confirmBtn) {
        // Clone button to remove old listeners
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        
        newConfirmBtn.addEventListener('click', async () => {
            try {
                const response = await fetch(`/order/${order.transactionId}/handle`, {
                    method: 'POST'
                });
                const data = await response.json();
                
                if (data.success) {
                    popup.classList.add('hidden');
                    const scanField = document.getElementById('scanField');
                    if(scanField) scanField.classList.remove('hidden');
                    output.textContent = "Bestelling afgehandeld! Je kan verder scannen.";
                } else {
                    alert('Fout: ' + (data.error || 'Kon bestelling niet afhandelen'));
                }
            } catch (err) {
                console.error(err);
                alert('Er is een fout opgetreden bij het afhandelen van de bestelling.');
            }
        });
    } else {
        console.error('Confirm button not found');
    }
    
    // Show popup only after everything is set up
    popup.classList.remove('hidden');
    const scanField = document.getElementById('scanField');
    if(scanField) scanField.classList.add('hidden');
}

window.submitContribution = async function() {
    const amount = parseInt(document.getElementById('contributionAmount').value) || 0;
    const maxAmount = parseInt(document.getElementById('contributionAmount').max) || 0;
    
    if (amount <= 0) {
        alert("Voer een geldig bedrag in");
        return;
    }
    
    if (amount > maxAmount) {
        alert(`Maximum bijdrage is ${maxAmount} FestCoins`);
        return;
    }
    
    if (!scannedQRCode) {
        alert("Geen QR-code gescand");
        return;
    }
    
    try {
        const res = await fetch('/groepspot/contribute', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                qrCode: scannedQRCode,
                amount: amount
            })
        });
        
        const data = await res.json();
        if (!data.success) {
            alert("Bijdrage mislukt: " + data.error);
            return;
        }
        
        alert(`Bedankt! Je hebt ${amount} FestCoins bijgedragen.`);
        
        // Update festCoins display
        if(data.newAmount !== undefined){
            // Update header if exists
            const festCoinsHeader = document.getElementById('festCoinsHeader');
            if(festCoinsHeader) festCoinsHeader.textContent = `FestCoins: ${data.newAmount}`;
            
            // Update wallet page if exists
            if(typeof updateFestCoinDisplay === 'function'){
                updateFestCoinDisplay(data.newAmount);
            }
        }
        
        cancelContribution();
    } catch (err) {
        console.error(err);
        alert("Bijdrage mislukt: internal error");
    }
}

window.cancelContribution = function() {
    document.getElementById('contributionPopup').classList.add('hidden');
    scannedQRCode = null;
    document.getElementById('contributionAmount').value = '';
}

window.showManualCodeInput = function() {
    const modal = document.getElementById('manualCodeModal');
    if(modal) {
        modal.classList.remove('hidden');
        document.getElementById('manualOrderCode').focus();
    }
}

window.hideManualCodeInput = function() {
    const modal = document.getElementById('manualCodeModal');
    if(modal) {
        modal.classList.add('hidden');
        document.getElementById('manualOrderCode').value = '';
    }
}

window.submitManualCode = async function() {
    const code = document.getElementById('manualOrderCode').value.trim();
    
    if(!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
        alert('Voer een geldige 6-cijferige code in');
        return;
    }
    
    try {
        const response = await fetch(`/order/code/${code}`);
        const data = await response.json();
        
        if(data.success && data.order) {
            hideManualCodeInput();
            showOrderPopup(data.order);
        } else {
            alert(data.error || 'Bestelling niet gevonden. Controleer de code.');
        }
    } catch(err) {
        console.error(err);
        alert('Fout bij ophalen bestelling informatie.');
    }
}

// Allow Enter key to submit
document.addEventListener('DOMContentLoaded', () => {
    const codeInput = document.getElementById('manualOrderCode');
    if(codeInput) {
        codeInput.addEventListener('keypress', (e) => {
            if(e.key === 'Enter') {
                submitManualCode();
            }
        });
    }
});