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
// 2. SETUP & DOM ELEMENTS
// ==========================================
const consoleOutput = document.getElementById('console-output');
const connectionBadge = document.getElementById('connection-status');

// Result Card Elements
const resultCard = document.getElementById("result-card");
const uiName = document.getElementById("student-name");
const uiId = document.getElementById("student-id");
const uiBadge = document.getElementById("status-badge");
const uiIcon = document.getElementById("status-icon");
const uiTime = document.getElementById("time-msg");

// Sidebar Elements
const attendanceList = document.getElementById("attendance-list");
const countBadge = document.getElementById("count-badge");

function log(msg) {
    const div = document.createElement('div');
    div.innerText = `> ${msg}`;
    consoleOutput.prepend(div);
}

// Init Firebase
let db;
try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    checkConnection();
} catch (e) {
    connectionBadge.innerText = "Config Error";
    connectionBadge.className = "status-pill offline";
}

async function checkConnection() {
    try {
        await db.collection('test').doc('ping').set({ active: true });
        connectionBadge.innerText = "System Online";
        connectionBadge.className = "status-pill online";
        startLiveSidebar(); // Start listening to sidebar
    } catch (error) {
        connectionBadge.innerText = "Access Denied";
        connectionBadge.className = "status-pill offline";
        log("Error: Check Firestore Rules");
    }
}

// ==========================================
// 3. SCANNING LOGIC (FIXED)
// ==========================================
let isScanning = true;

async function onScanSuccess(decodedText) {
    if (!isScanning) return;
    isScanning = false;

    log(`Scanned: ${decodedText}`);

    // A. Parse Scan Data
    let studentId = decodedText;
    let studentName = null; // Don't guess yet

    try {
        const data = JSON.parse(decodedText);
        if(data.id) studentId = data.id;
        if(data.name) studentName = data.name;
    } catch (e) {
        // Not JSON, just simple text ID
        studentId = decodedText;
    }

    // B. Check Database
    try {
        const docRef = db.collection("attendance").doc(studentId);
        const docSnap = await docRef.get();

        if (docSnap.exists) {
            const existingData = docSnap.data();
            
            // KEY FIX: If they are already there, use the NAME from the database!
            const finalName = existingData.name || studentName || "Unknown Student";
            
            if (existingData.status === "Present") {
                // DUPLICATE CASE
                showResult(finalName, studentId, "ALREADY HERE", "error");
                // Optional: Play beep sound here
            } else {
                // UPDATE CASE (rare)
                await markPresent(studentId, finalName || "Unknown Student");
            }
        } else {
            // NEW ENTRY CASE
            await markPresent(studentId, studentName || "Unknown Student");
        }

    } catch (error) {
        log("DB Error: " + error.message);
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
    showResult(name, id, "MARKED PRESENT", "success");
}

function showResult(name, id, status, type) {
    uiName.innerText = name;
    uiId.innerText = `ID: ${id}`;
    uiBadge.innerText = status;
    uiTime.innerText = new Date().toLocaleTimeString();

    resultCard.classList.remove("hidden", "success-mode", "error-mode");
    resultCard.classList.add("visible");
    
    if (type === "success") {
        resultCard.classList.add("success-mode");
        uiIcon.innerText = "✅";
    } else {
        resultCard.classList.add("error-mode");
        uiIcon.innerText = "⚠️";
    }
}

// ==========================================
// 4. LIVE SIDEBAR LISTENER
// ==========================================
function startLiveSidebar() {
    db.collection("attendance")
      .orderBy("timestamp", "desc")
      .onSnapshot((snapshot) => {
          attendanceList.innerHTML = "";
          countBadge.innerText = snapshot.size;

          if (snapshot.empty) {
              attendanceList.innerHTML = '<li class="empty-state">No scans yet.</li>';
              return;
          }

          snapshot.forEach((doc) => {
              const data = doc.data();
              const time = data.timestamp 
                ? new Date(data.timestamp.seconds * 1000).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) 
                : '...';

              const li = document.createElement('li');
              li.className = 'student-row';
              li.innerHTML = `
                  <div class="row-info">
                      <strong>${data.name}</strong>
                      <small>ID: ${data.id}</small>
                  </div>
                  <div class="row-time">${time}</div>
              `;
              attendanceList.appendChild(li);
          });
      });
}

// Start Camera
const scanner = new Html5QrcodeScanner("reader", { fps: 20, qrbox: 250 });
scanner.render(onScanSuccess);
