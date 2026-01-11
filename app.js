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
const attendanceList = document.getElementById("attendance-list");
const countBadge = document.getElementById("count-badge");

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
        
        // Start listening for sidebar updates immediately
        startLiveAttendanceList(); 
        
    } catch (error) {
        connectionBadge.innerText = "Access Denied";
        connectionBadge.className = "status-badge offline";
        log("Error: Check Firebase Rules.");
    }
}

// ==========================================
// 3. REAL-TIME SIDEBAR LISTENER
// ==========================================
function startLiveAttendanceList() {
    // This listens to the database 24/7 for changes
    db.collection("attendance")
      .orderBy("timestamp", "desc") // Show newest first
      .onSnapshot((snapshot) => {
          
          attendanceList.innerHTML = ""; // Clear list
          countBadge.innerText = snapshot.size; // Update count

          if (snapshot.empty) {
              attendanceList.innerHTML = '<li class="empty-list">No students present yet.</li>';
              return;
          }

          snapshot.forEach((doc) => {
              const data = doc.data();
              const time = data.timestamp ? new Date(data.timestamp.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now';
              
              // Create list HTML
              const li = document.createElement('li');
              li.className = 'student-item';
              li.innerHTML = `
                  <div class="student-info">
                      <strong>${data.name || 'Unknown'}</strong>
                      <small>ID: ${data.id}</small>
                  </div>
                  <div class="time-stamp">${time}</div>
              `;
              attendanceList.appendChild(li);
          });
      });
}

// ==========================================
// 4. SCANNING LOGIC
// ==========================================
let isScanning = true;

async function onScanSuccess(decodedText) {
    if (!isScanning) return;
    isScanning = false;

    // 1. Parse Data
    let studentId = decodedText;
    let studentName = "Unknown Student";

    try {
        const data = JSON.parse(decodedText);
        if(data.id) studentId = data.id;
        if(data.name) studentName = data.name;
    } catch (e) {
        studentId = decodedText;
    }

    // 2. Check Database
    try {
        const docRef = db.collection("attendance").doc(studentId);
        const docSnap = await docRef.get();

        if (docSnap.exists) {
            const data = docSnap.data();
            showUI(studentName, "ALREADY HERE", "Duplicate Entry", "error");
        } else {
            await markPresent(studentId, studentName);
        }

    } catch (error) {
        log("Scan Error: " + error.message);
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
    
    resultCard.classList.add("visible");
    resultCard.classList.remove("success-card", "error-card");
    resultCard.classList.add(type === "success" ? "success-card" : "error-card");
}

// Start Camera
const scanner = new Html5QrcodeScanner("reader", { fps: 20, qrbox: 250 });
scanner.render(onScanSuccess);
