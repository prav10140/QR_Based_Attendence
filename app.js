const firebaseConfig = {
  apiKey: "AIzaSyA3qwJZJgKiArPNC38cB6VcbGLmp9TKsEA",
  authDomain: "qrattend-1cf9c.firebaseapp.com",
  projectId: "qrattend-1cf9c",
  storageBucket: "qrattend-1cf9c.firebasestorage.app",
  messagingSenderId: "1055007791060",
  appId: "1:1055007791060:web:d627c9a9456a0467f6e841",
  measurementId: "G-JZNXLBJEVY"
};;

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ==============================
// 2. DOM ELEMENTS
// ==============================
const resultCard = document.getElementById("result-card");
const statusTitle = document.getElementById("status-title");
const statusMsg = document.getElementById("status-message");
const detailsDiv = document.getElementById("participant-details");

let isScanning = true; // Flag to prevent double scanning

// ==============================
// 3. MAIN LOGIC
// ==============================

async function onScanSuccess(decodedText, decodedResult) {
    if (!isScanning) return;
    
    isScanning = false; // Pause scanning to process
    
    // Play a beep sound (optional UX)
    // new Audio('beep.mp3').play().catch(e => {});

    showUIState("Processing...", "Checking database...", "neutral");

    try {
        // We assume the QR code text is the Unique ID (e.g., "USER_001")
        const participantId = decodedText.trim();
        
        // Check Firestore
        const docRef = db.collection("attendance").doc(participantId);
        const docSnap = await docRef.get();

        if (docSnap.exists && docSnap.data().status === "Present") {
            // CASE: DUPLICATE
            showUIState("DUPLICATE ENTRY", `ID: ${participantId} is already inside.`, "error");
        } else {
            // CASE: NEW ENTRY (Mark as Present)
            await docRef.set({
                id: participantId,
                status: "Present",
                entryTime: firebase.firestore.FieldValue.serverTimestamp(),
                userAgent: navigator.userAgent // Optional: track which device scanned them
            }, { merge: true });

            showUIState("ACCESS GRANTED", `Welcome! ID: ${participantId} marked present.`, "success");
        }

    } catch (error) {
        console.error("Database Error:", error);
        showUIState("SYSTEM ERROR", "Could not connect to Firebase.", "error");
    }

    // Cooldown: Wait 3 seconds before allowing next scan
    setTimeout(() => {
        isScanning = true;
        resultCard.classList.add("hidden"); // Optional: hide card after delay
    }, 4000);
}

function onScanFailure(error) {
    // Keeps console clean; uncomment if debugging
    // console.warn(`Scan error: ${error}`);
}

// ==============================
// 4. UI HELPER
// ==============================
function showUIState(title, message, type) {
    resultCard.classList.remove("hidden", "status-success", "status-error");
    
    statusTitle.innerText = title;
    statusMsg.innerText = message;
    
    if (type === "success") {
        resultCard.classList.add("status-success");
    } else if (type === "error") {
        resultCard.classList.add("status-error");
    }
}

// ==============================
// 5. INITIALIZE SCANNER
// ==============================
const html5QrcodeScanner = new Html5QrcodeScanner(
    "reader", 
    { fps: 10, qrbox: { width: 250, height: 250 } }, 
    false
);

html5QrcodeScanner.render(onScanSuccess, onScanFailure);
