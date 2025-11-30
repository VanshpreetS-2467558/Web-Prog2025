const video = document.getElementById("video");
const output = document.getElementById("output");

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
            output.textContent = "Gescand: " + code.data;
        } else {
            output.textContent = "Klaar om te scannen...";
        }
    }
    requestAnimationFrame(scan);
}