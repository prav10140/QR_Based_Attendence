const firebaseConfig = {
  apiKey: "AIzaSyA3qwJZJgKiArPNC38cB6VcbGLmp9TKsEA",
  authDomain: "qrattend-1cf9c.firebaseapp.com",
  projectId: "qrattend-1cf9c",
  storageBucket: "qrattend-1cf9c.firebasestorage.app",
  messagingSenderId: "1055007791060",
  appId: "1:1055007791060:web:d627c9a9456a0467f6e841",
  measurementId: "G-JZNXLBJEVY"
};

// ==========================================
// 2. SETUP
// ==========================================
const consoleOutput = document.getElementById('console-output');
const connectionBadge = document.getElementById('connection-status');
const resultCard = document.getElementById("result-card");
const studentNameEl = document.getElementById("student-name");
const statusBadge = document.getElementById("status-badge");
const resultMsg = document.getElementById("result-msg");

function log(msg) {
    const p = document.createElement('div');
    p.innerText = `> ${msg}`;
    consoleOutput.prepend(p);
}

// Init Firebase
let db;
try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    checkConnection();
} catch (e) {
    connectionBadge.innerText = "Config Error";
    connectionBadge.className = "status-badge offline";
}

async function checkConnection() {
    try {
        await db.collection('test').doc('ping').set({ active: true });
        connectionBadge.innerText = "System Online";
        connectionBadge.className = "status-badge online";
    } catch (error) {
        connectionBadge.innerText = "Database Access Denied";
        connectionBadge.className = "status-badge offline";
        log("Check Firestore Rules in Console!");
    }
}

// ==========================================
// 3. SCANNING LOGIC
// ==========================================
let isScanning = true;

async function onScanSuccess(decodedText) {
    if (!isScanning) return;
    isScanning = false;

    log(`Scanned Raw: ${decodedText}`);

    // 1. Parse Data (Handle JSON or Simple Text)
    let studentId = decodedText;
    let studentName = "Unknown Student";

    try {
        const data = JSON.parse(decodedText);
        if(data.id) studentId = data.id;
        if(data.name) studentName = data.name;
    } catch (e) {
        // Not JSON, just use the raw text as ID
        studentId = decodedText;
    }

    // 2. Check Database
    try {
        const docRef = db.collection("attendance").doc(studentId);
        const docSnap = await docRef.get();

        if (docSnap.exists) {
            const data = docSnap.data();
            if (data.status === "Present") {
                showUI(studentName, "ALREADY HERE", "Duplicate Entry", "error");
            } else {
                await markPresent(studentId, studentName);
            }
        } else {
            // New student
            await markPresent(studentId, studentName);
        }

    } catch (error) {
        log("DB Error: " + error.message);
        showUI("Error", "FAILED", "Database Error", "error");
    }

    // Cooldown 3 seconds
    setTimeout(() => { isScanning = true; }, 3000);
}

async function markPresent(id, name) {
    await db.collection("attendance").doc(id).set({
        id: id,
        name: name,
        status: "Present",
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    showUI(name, "MARKED PRESENT", `ID: ${id}`, "success");
}

function showUI(name, badgeText, msg, type) {
    studentNameEl.innerText = name;
    statusBadge.innerText = badgeText;
    resultMsg.innerText = msg;
    
    resultCard.classList.remove("hidden", "success-card", "error-card");
    resultCard.classList.add(type === "success" ? "success-card" : "error-card");
}

// ==========================================
// 4. CAMERA START
// ==========================================
const scanner = new Html5QrcodeScanner("reader", { 
    fps: 20, // Scans faster
    qrbox: 250,
    supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA] 
});
scanner.render(onScanSuccess);
