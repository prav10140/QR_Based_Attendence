const firebaseConfig = {
  apiKey: "AIzaSyAD1VORa-bf-zcJKBq8F_M5ez108dXYz78",
  authDomain: "chat-43c01.firebaseapp.com",
  databaseURL: "https://chat-43c01-default-rtdb.firebaseio.com",
  projectId: "chat-43c01",
  storageBucket: "chat-43c01.firebasestorage.app",
  messagingSenderId: "605263762443",
  appId: "1:605263762443:web:82ac2e6a1cc0fa0e84a30e",
  measurementId: "G-VVBCEN7R6D"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const statusBox = document.getElementById("status");

// QR Scanner
const scanner = new Html5Qrcode("reader");

scanner.start(
  { facingMode: "environment" },
  { fps: 10, qrbox: 250 },
  (text) => verify(text)
);

// Verify attendance
function verify(pid){
  const ref = db.ref("attendance/" + pid);

  ref.once("value", snap => {
    if(snap.exists()){
      statusBox.innerText = "❌ Already Checked In";
      statusBox.className = "error";
    } else {
      ref.set({
        present: true,
        time: new Date().toLocaleString()
      });

      statusBox.innerText = "✅ Attendance Marked";
      statusBox.className = "success";
    }
  });
}
