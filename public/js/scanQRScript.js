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