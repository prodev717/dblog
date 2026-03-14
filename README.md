# ☢️ BUNKER OS // DBlog
**A Brutalist Post-Apocalyptic Terminal Journal**

## 📖 Concept
DBlog is a conceptual web application designed to simulate an ancient, barely-functioning survival mainframe. Users log in to "Bunker OS" using raw biometric data (facial recognition) along with the traditional passwords. 

The core feature is a **60-second paranoia timer**: When appending a new log entry, the terminal assumes you have been compromised. If you do not physically confirm your existence (`[ I AM STILL ALIVE ]`) within 60 seconds, the terminal triggers a panic alarm, violently crashes, and permanently purges your unsaved data.

## 🚀 Key Features
*   **Biometric Authentication:** Uses `face-api.js` to scan and encode user facial topography as the primary login mechanism.
*   **True Terminal UX:** 100% edge-to-edge pure command-line styling. No modern styling, web 2.0 glow, or centered layout divs.
*   **Procedural Web Audio Engine:** Bypasses ad-blockers by relying on the native Javascript `AudioContext` API to mathematically generate vintage IBM relay clicks, motherboard POST beeps, scanning telemetry, and deep CRT hums.
*   **The 60-Second Dead Man's Switch:** Unsaved journal entries trigger a ticking visual/audio panic sequence that deletes all input if the user does not regularly reset the timer via a randomly jumping confirmation button.
*   **Glitch Rendering:** Heavy CSS-injected procedural CRT scanlines, vertical jitter, and color-separation applied over the live webcam feed during facial scanning.

---

## 🛠️ Instructions for Evaluator / Setup Guide

This project requires a lightweight Python backend alongside a standard web frontend browser to handle the `face-api.js` models without breaking CORS rules.

### Prerequisites
1. Python 3.8+ installed on your machine.
2. A webcam connected to your device.

### 1. Backend Initialization
The backend server handles the local SQLite database that stores biometric encoded arrays.
```bash
# Navigate to the project root
$ cd d:\Blog\dblog

# Install the required Flask dependencies from requirements.txt
$ pip install -r requirements.txt

# Run the backend server (starts on localhost:5000)
$ python app.py
```

### 2. Frontend Access
Once the python server is running, the terminal can execute in any modern browser. 
Since it uses `face-api.js` models stored in the root `/models` folder, **do not just double-click the `index.html` file**, as the browser will block the models. Run a simple http server, or serve the directory via VSCode's LiveServer extension.
```bash
# In a new terminal window inside the dblog folder:
$ python -m http.server 8000
```
Open your browser and navigate to `http://localhost:8000/index.html`. 

---

## 🧪 Evaluation Testing Script
To test the core app features, follow this flow:

### Test 1: Audio & Aesthetics
1. Click absolutely anywhere on the blank login screen. You should immediately hear a deep `55Hz` ground loop hum begin to play. 
2. Click inside the `EMAIL` input. Type randomly. You should hear sharp, mathematically-generated vintage terminal relay snaps (`playKeystroke`) for every single key you hit.

### Test 2: Biometric Registration
1. Click `[REGISTER_NEW_NODE]`.
2. Enter dummy data for Email and Password. 
3. Click `[SCAN_FACE_DATA]`.
4. Allow webcam permissions. Observe the procedurally distorted, glitching camera feed and the audio telemetry sound effect while it scans.
5. Click `[INITIALIZE_NODE]` once face data is grabbed.

### Test 3: The Dead-Man's Switch
1. Login with your new dummy account and biometrics.
2. Click `[APPEND_LOG]`.
3. An `[ I AM STILL ALIVE ]` panic button will appear, and the `[SECURE_CHANNEL_TIMEOUT]` meter will rapidly tick down from 60 seconds.
4. **Do nothing.** 
5. At exactly 15 seconds, listen for the rising sawtooth panic alarm and watch the timer flash red.
6. At 0 seconds, listen for the heavy mainframe power-down groan. The inputs will be instantly wiped blank. 
7. Try to write a new post, but this time click `[ I AM STILL ALIVE ]` before time runs out. The button will jump sideways across the screen, the panic alarm will cease, and you will get another 60 seconds of uptime.

> **Note on Audio:** We do not use external `.mp3` files due to cross-origin Resource Sharing (CORS) auto-play policies. If the audio fails to start upon typing, make sure you have actively clicked the HTML document body at least once to wake Chrome's `AudioContext` permission engine.
