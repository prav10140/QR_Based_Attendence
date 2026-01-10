// 🔥 Replace with your Firebase config
const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "YOUR_DOMAIN",
  databaseURL: "YOUR_DB_URL",
  projectId: "YOUR_PROJECT_ID"
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
