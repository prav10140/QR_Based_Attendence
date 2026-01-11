# 📱 QR Event Attendance Scanner

A lightweight, real-time web application that scans student QR codes and marks attendance using Firebase Firestore. It features a live sidebar that updates instantly across all devices.

## 🚀 Features

- **Instant Scanning:** Fast QR code detection using the device camera.
- **Real-Time Sync:** Sidebar updates automatically without refreshing the page.
- **Duplicate Prevention:** visual alerts (Red/Green) if a student is scanned twice.
- **Smart Data Handling:** Displays student names correctly even for duplicate scans.
- **Offline/Online Status:** Visual indicator for database connection health.

## 🛠️ Prerequisites

- A free [Firebase Account](https://firebase.google.com/).
- A code editor (VS Code) or a text editor.
- A local server (Live Server) or a hosting provider (Netlify/Vercel) for HTTPS.

## 📂 Project Structure

```text
/event-scanner
├── index.html    # The main user interface
├── style.css     # Styling and responsive layout
├── app.js        # Logic and Firebase configuration
└── README.md     # This file
