// === CUSTOM CURSOR TRACKING ===
const cursorEl = document.getElementById('custom-cursor');
document.addEventListener('mousemove', (e) => {
    cursorEl.style.left = e.clientX + 'px';
    cursorEl.style.top  = e.clientY + 'px';
});

const API_URL = "http://127.0.0.1:5000";
let timer = 60;
let lastCheckpoint = "";
let timerInterval;
let moveInterval;
let sysMsgTimeout;

function showMessage(msg, isError = false) {
    const sysBox = document.getElementById("sys-message");
    sysBox.style.display = "block";
    sysBox.innerText = `>> ${msg}`;
    sysBox.style.color = isError ? "var(--danger-red)" : "var(--glow-color)";
    sysBox.style.borderColor = isError ? "var(--danger-red)" : "var(--glow-color)";
    clearTimeout(sysMsgTimeout);
    sysMsgTimeout = setTimeout(() => { sysBox.style.display = "none"; }, 3000);
}

const textArea = document.getElementById('journal-textarea');
const timerDisplay = document.getElementById('timer');
const aliveBtn = document.getElementById('still-alive-btn');

// ==== PROCEDURAL AUDIO ENGINE ==== 
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playKeystroke() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(120, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + 0.02);
    gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.02);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.03);
}

function playBeep() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1000, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
}

function playPanicBeep() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(600, audioCtx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
}

function playPowerDown() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc1.type = 'sawtooth';
    osc2.type = 'square';
    osc1.frequency.setValueAtTime(100, audioCtx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + 1.0);
    osc2.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(15, audioCtx.currentTime + 1.0);
    gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.0);
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(audioCtx.destination);
    osc1.start();
    osc2.start();
    osc1.stop(audioCtx.currentTime + 1.0);
    osc2.stop(audioCtx.currentTime + 1.0);
}

let humOscillator = null;
let scanOscillator = null;
let systemBooted = false;

document.body.addEventListener('click', (e) => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (!systemBooted) {
        humOscillator = audioCtx.createOscillator();
        const humGain = audioCtx.createGain();
        humOscillator.type = 'sine';
        humOscillator.frequency.value = 55;
        humGain.gain.value = 0.05;
        humOscillator.connect(humGain);
        humGain.connect(audioCtx.destination);
        humOscillator.start();
        systemBooted = true;
    }
    if (e.target.classList.contains('btn-system') || e.target.classList.contains('like-btn')) {
        playBeep();
    }
});

document.addEventListener('keydown', (e) => {
    if (["Shift", "Control", "Alt", "Meta", "CapsLock"].includes(e.key)) return;
    playKeystroke();
});

function typeWriter(elementId, text, speed = 15) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.innerHTML = "";
    let i = 0;
    function type() {
        if (i < text.length) {
            el.innerHTML += text.charAt(i);
            playKeystroke();
            i++;
            setTimeout(type, speed);
        }
    }
    type();
}

let faceModelsLoaded = false;
async function loadFaceModels() {
    if (faceModelsLoaded) return;
    const modelUrl = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
    document.getElementById("auth-error").innerText = "LOADING BIOMETRIC MODELS...";
    await faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl);
    await faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl);
    await faceapi.nets.faceRecognitionNet.loadFromUri(modelUrl);
    faceModelsLoaded = true;
    document.getElementById("auth-error").innerText = "";
}

let faceScanMode = null; 
let videoStream = null;
let isAnalyzing = false;
let scanTimeout = null;
let scanInterval = null;

async function startFaceScan(mode) {
    faceScanMode = mode;
    await loadFaceModels();
    const videoContainer = document.getElementById('video-container');
    const video = document.getElementById('videoElement');
    videoContainer.style.display = 'flex';
    try {
        videoStream = await navigator.mediaDevices.getUserMedia({ video: {} });
        video.srcObject = videoStream;
    } catch (err) {
        document.getElementById("auth-error").innerText = "CAMERA ACCESS DENIED.";
        videoContainer.style.display = 'none';
        return;
    }
    video.addEventListener('play', onVideoPlay);
}

function cancelFaceScan() {
    const videoContainer = document.getElementById('video-container');
    const video = document.getElementById('videoElement');
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
    }
    videoContainer.style.display = 'none';
    video.removeEventListener('play', onVideoPlay);
    if (isAnalyzing) {
        clearTimeout(scanTimeout);
        clearInterval(scanInterval);
        isAnalyzing = false;
        if (scanOscillator) {
            scanOscillator.stop();
            scanOscillator = null;
        }
        document.querySelector("#video-container h3").innerText = "SCANNING BIOMETRICS...";
    }
}

async function onVideoPlay() {
    const videoContainer = document.getElementById('video-container');
    const video = document.getElementById('videoElement');
    if (videoContainer.style.display === 'none' || video.paused || video.ended || !faceScanMode || isAnalyzing) return;
    const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();
    if (detection) {
        isAnalyzing = true;
        const descriptor = Array.from(detection.descriptor);
        const strData = JSON.stringify(descriptor);
        const scanTitle = videoContainer.querySelector("h3");
        const originalTitle = scanTitle.innerText;
        if (audioCtx.state === 'suspended') audioCtx.resume();
        scanOscillator = audioCtx.createOscillator();
        const scanGain = audioCtx.createGain();
        scanOscillator.type = 'sawtooth';
        scanOscillator.frequency.value = 800;
        scanGain.gain.value = 0.05;
        scanOscillator.connect(scanGain);
        scanGain.connect(audioCtx.destination);
        scanOscillator.start();
        const modInterval = setInterval(() => {
            if (scanOscillator) scanOscillator.frequency.value = 400 + Math.random() * 800;
        }, 50);
        const texts = ["ANALYZING FACIAL TOPOGRAPHY...", "CHECKING RADIATION SIGNATURE...", "DECRYPTING GENETIC MARKERS...", "MATCHING BUNKER RECORDS...", "VERIFYING SURVIVOR IDENTITY..."];
        let step = 0;
        scanInterval = setInterval(() => {
            scanTitle.innerText = texts[step % texts.length];
            step++;
        }, 500);
        scanTimeout = setTimeout(() => {
            clearInterval(scanInterval);
            clearInterval(modInterval);
            if (scanOscillator) { scanOscillator.stop(); scanOscillator = null; }
            scanTitle.innerText = originalTitle;
            isAnalyzing = false;
            cancelFaceScan();
            if (faceScanMode === 'register') {
                document.getElementById('reg-face').value = strData;
                document.getElementById('face-status').innerText = "FACE SCANNED AND ENCODED.";
                document.getElementById('face-status').style.color = "var(--glow-color)";
            } else if (faceScanMode === 'login') {
                document.getElementById('login-face').value = strData;
                document.getElementById('login-face-status').innerText = "FACE SCANNED AND ENCODED.";
                document.getElementById('login-face-status').style.color = "var(--glow-color)";
            }
            faceScanMode = null;
        }, 2500);
    } else {
        setTimeout(onVideoPlay, 500);
    }
}

let currentUserId = localStorage.getItem("user_id");
let currentUserName = localStorage.getItem("user_name");

function hideAllViews() {
    document.getElementById("auth-overlay").style.display = "none";
    document.getElementById("write-view").style.display = "none";
    document.getElementById("archives-view").style.display = "none";
    document.getElementById("home-view").style.display = "none";
    document.getElementById("terminal-view").style.display = "none";
    document.getElementById("protocol-view").style.display = "none";
    document.getElementById("nav-bar").style.display = "none";
    stopLogic();
}

function checkAuth() {
    if (currentUserId) {
        document.getElementById("current-user-name").innerText = currentUserName;
        showHome();
    } else {
        hideAllViews();
        document.getElementById("auth-overlay").style.display = "flex";
    }
}

async function showHome() {
    hideAllViews();
    document.getElementById("nav-bar").style.display = "block";
    document.getElementById("home-view").style.display = "flex";
    const container = document.getElementById("my-blogs-container");
    container.innerHTML = "LOADING PERSONAL LOGS...";
    try {
        const res = await fetch(`${API_URL}/blogs`);
        const blogs = await res.json();
        container.innerHTML = "";
        const myBlogs = blogs.filter(b => String(b.author_id) === String(currentUserId));
        if (myBlogs.length === 0) {
            container.innerHTML = "<p>NO PERSONAL LOGS FOUND.</p>";
            return;
        }
        myBlogs.forEach(blog => {
            const uniqueId = `typewriter-p-${blog.id}-${Math.random().toString(36).substr(2, 9)}`;
            const div = document.createElement("div");
            div.className = "blog-post";
            div.innerHTML = `
                <h3>${blog.title}</h3>
                <p id="${uniqueId}" style="white-space: pre-wrap; font-size: 14px; margin-bottom: 10px;">_</p>
                <div class="blog-meta">
                    <span style="color:var(--glow-color)">STATUS: DELIVERED</span>
                    <button class="like-btn" onclick="likeBlog(${blog.id}, true)">[ACK: ${blog.likes}]</button>
                </div>
            `;
            container.appendChild(div);
            typeWriter(uniqueId, blog.para);
        });
    } catch (e) {
        container.innerHTML = "<p style='color:var(--danger-red)'>SIGNAL LOST.</p>";
    }
}

function showEditor() {
    hideAllViews();
    document.getElementById("nav-bar").style.display = "block";
    document.getElementById("write-view").style.display = "flex";
    document.getElementById('journal-title').value = '';
    document.getElementById('journal-textarea').value = '';
    lastCheckpoint = "";
    startLogic();
}

function showSignup() {
    document.getElementById("login-form").style.display = "none";
    document.getElementById("signup-form").style.display = "flex";
    document.getElementById("auth-error").innerText = "";
}

function showLogin() {
    document.getElementById("login-form").style.display = "flex";
    document.getElementById("signup-form").style.display = "none";
    document.getElementById("auth-error").innerText = "";
}

async function login() {
    const email = document.getElementById("auth-email").value;
    const password = document.getElementById("auth-password").value;
    const face_data = document.getElementById("login-face").value;
    if (!email || !password || !face_data) {
        document.getElementById("auth-error").innerText = "MISSING EMAIL, PASSWORD, OR FACE SCAN.";
        return;
    }
    try {
        const res = await fetch(`${API_URL}/signin`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email, password, face_data})
        });
        const data = await res.json();
        if (res.ok) {
            currentUserId = data.user_id;
            currentUserName = data.name;
            localStorage.setItem("user_id", currentUserId);
            localStorage.setItem("user_name", currentUserName);
            checkAuth();
        } else {
            document.getElementById("auth-error").innerText = data.error;
        }
    } catch (e) {
        document.getElementById("auth-error").innerText = "NETWORK ERROR.";
    }
}

async function register() {
    const name = document.getElementById("reg-name").value;
    const age = document.getElementById("reg-age").value;
    const email = document.getElementById("reg-email").value;
    const password = document.getElementById("reg-password").value;
    const face_data = document.getElementById("reg-face").value;
    try {
        const res = await fetch(`${API_URL}/signup`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({name, age, email, password, face_data})
        });
        const data = await res.json();
        if (res.ok) {
            document.getElementById("auth-error").innerText = "REGISTRATION OK. PLEASE LOGIN.";
            document.getElementById("auth-error").style.color = "var(--glow-color)";
            showLogin();
        } else {
            document.getElementById("auth-error").innerText = data.error;
            document.getElementById("auth-error").style.color = "var(--danger-red)";
        }
    } catch (e) {
        document.getElementById("auth-error").innerText = "NETWORK ERROR.";
        document.getElementById("auth-error").style.color = "var(--danger-red)";
    }
}

function logout() {
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_name");
    currentUserId = null;
    currentUserName = null;
    checkAuth();
}

function startLogic() {
    timer = 60;
    const decayMeter = document.getElementById('decay-meter');
    decayMeter.style.color = "var(--glow-color)";
    aliveBtn.style.display = "block";
    clearInterval(timerInterval);
    clearInterval(moveInterval);
    timerInterval = setInterval(() => {
        timer--;
        timerDisplay.innerText = timer;
        if (timer <= 15 && timer > 0) {
            playPanicBeep();
            decayMeter.style.color = (timer % 2 === 0) ? "var(--danger-red)" : "var(--glow-color)";
        }
        if (timer <= 0) {
            playPowerDown();
            localStorage.setItem("timeout_backup_title", document.getElementById('journal-title').value);
            localStorage.setItem("timeout_backup_para", textArea.value);
            document.getElementById('journal-title').value = '';
            textArea.value = "";
            lastCheckpoint = "";
            decayMeter.style.color = "var(--danger-red)";
            showMessage("CRITICAL ERROR: BIOMETRIC TIMEOUT. POST ERASED.", true);
            timer = 60;
        }
    }, 1000);
    moveInterval = setInterval(moveButton, 3000);
    moveButton();
}

function stopLogic() {
    clearInterval(timerInterval);
    clearInterval(moveInterval);
    aliveBtn.style.display = "none";
    document.getElementById('decay-meter').style.color = "var(--glow-color)";
}

function moveButton() {
    if (document.getElementById("write-view").style.display !== "flex") return;
    const maxX = window.innerWidth - 200;
    const maxY = window.innerHeight - 100;
    let randomY = Math.floor(Math.random() * maxY);
    if (randomY < 80) randomY = 80; 
    const randomX = Math.floor(Math.random() * maxX);
    aliveBtn.style.left = randomX + 'px';
    aliveBtn.style.top = randomY + 'px';
}

function confirmExistence() {
    playKeystroke();
    lastCheckpoint = textArea.value;
    timer = 60;
    timerDisplay.innerText = timer;
    document.getElementById('decay-meter').style.color = "var(--glow-color)";
    moveButton();
}

function purgeLog() {
    document.getElementById('journal-title').value = '';
    document.getElementById('journal-textarea').value = '';
}

function restoreBackup() {
    const bTitle = localStorage.getItem("timeout_backup_title");
    const bPara = localStorage.getItem("timeout_backup_para");
    if (bTitle || bPara) {
        document.getElementById('journal-title').value = bTitle || '';
        document.getElementById('journal-textarea').value = bPara || '';
        showMessage("BACKUP RESTORED SUCCESSFULLY.");
    } else {
        showMessage("NO BACKUP FOUND IN SYSTEM.", true);
    }
}

let recognition = null;
let isDictating = false;
let animationId = null;
let wavePhase = 0;

function startVisualizer() {
    const canvas = document.getElementById("voice-visualizer");
    canvas.style.display = "inline-block";
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    const cx = H / 2;
    function draw() {
        if (!isDictating) return;
        animationId = requestAnimationFrame(draw);
        ctx.fillStyle = '#050505';
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = 'rgba(255,49,49,0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, cx);
        ctx.lineTo(W, cx);
        ctx.stroke();
        ctx.beginPath();
        ctx.strokeStyle = '#ff3131';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = '#ff3131';
        ctx.shadowBlur = 6;
        for (let x = 0; x < W; x++) {
            const t = (x / W) * Math.PI * 4 + wavePhase;
            const amp = (cx - 3) * (0.55 + 0.45 * Math.abs(Math.sin(wavePhase * 0.7)));
            const y = cx + Math.sin(t) * amp * 0.6 + Math.sin(t * 2.3 + 1.1) * amp * 0.25 + Math.sin(t * 0.5 - 0.8) * amp * 0.15;
            x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
        wavePhase += 0.12;
    }
    draw();
}

function stopVisualizer() {
    if (animationId) { cancelAnimationFrame(animationId); animationId = null; }
    const canvas = document.getElementById("voice-visualizer");
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#ff3131';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
    setTimeout(() => { canvas.style.display = 'none'; }, 400);
}

function toggleDictation() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        showMessage("VOICE UPLINK FAILED: HARDWARE NOT DETECTED.", true);
        return;
    }
    if (!recognition) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.onstart = function() {
            isDictating = true;
            document.getElementById('dictate-btn').innerText = "[VOICE_UPLINK_ACTIVE]";
            document.getElementById('dictate-btn').style.color = "var(--danger-red)";
            showMessage("VOICE UPLINK ESTABLISHED. AWAITING AUDIO...");
            startVisualizer();
        };
        recognition.onerror = function(event) { showMessage("VOICE UPLINK ERROR: " + event.error.toUpperCase(), true); };
        recognition.onend = function() {
            isDictating = false;
            document.getElementById('dictate-btn').innerText = "[VOICE_UPLINK]";
            document.getElementById('dictate-btn').style.color = "var(--glow-color)";
            showMessage("VOICE UPLINK SEVERED.");
            stopVisualizer();
        };
        recognition.onresult = function(event) {
            const textArea = document.getElementById('journal-textarea');
            let newText = "";
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) newText += event.results[i][0].transcript + ' ';
            }
            if (newText.length > 0) { textArea.value += newText; playKeystroke(); }
        };
    }
    if (isDictating) recognition.stop(); else recognition.start();
}

async function saveBlog() {
    const title = document.getElementById('journal-title').value;
    const para = document.getElementById('journal-textarea').value;
    if (!title || !para) { showMessage("TRANSMISSION FAILED. MISSING DATA.", true); return; }

    // === LORE: RANDOM SYSTEM INTERRUPTIONS ===
    const interruptions = [
        { msg: "RAD-STORM DETECTED. SIGNAL SCRAMBLED. RE-VERIFYING...", delay: 2000 },
        { msg: "FACTION SCANNER ALERT: DRIFTERS IN SECTOR 4. ENCRYPTING...", delay: 1500 },
        { msg: "GENERATOR FLICKER. VOLTAGE DROP DETECTED.", delay: 1000 },
        { msg: "OXYGEN SCRUBBER MAINTENANCE REQUIRED. IGNORE?", delay: 800 }
    ];

    if (Math.random() > 0.6) {
        const intel = interruptions[Math.floor(Math.random() * interruptions.length)];
        showMessage(`[WARNING]: ${intel.msg}`, true);
        playPanicBeep();
        await new Promise(r => setTimeout(r, intel.delay));
    }

    try {
        const res = await fetch(`${API_URL}/blogs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': currentUserId },
            body: JSON.stringify({title, para, image: ""})
        });
        if (res.ok) {
            showMessage("ARCHIVE SUCCESSFUL.");
            document.getElementById('journal-title').value = '';
            document.getElementById('journal-textarea').value = '';
            lastCheckpoint = '';
        } else { showMessage("ARCHIVE FAILED: CORRUPTION DETECTED.", true); }
    } catch (e) { showMessage("ARCHIVE FAILED: NO SIGNAL.", true); }
}

async function viewArchives() {
    hideAllViews();
    document.getElementById("nav-bar").style.display = "block";
    document.getElementById("archives-view").style.display = "flex";
    const container = document.getElementById("blogs-container");
    container.innerHTML = "LOADING ARCHIVES...";
    try {
        const res = await fetch(`${API_URL}/blogs`);
        const blogs = await res.json();
        container.innerHTML = "";
        if (blogs.length === 0) { container.innerHTML = "<p>NO ARCHIVES FOUND.</p>"; return; }
        blogs.forEach(blog => {
            const uniqueId = `typewriter-a-${blog.id}-${Math.random().toString(36).substr(2, 9)}`;
            const div = document.createElement("div");
            div.className = "blog-post";
            div.innerHTML = `
                <h3>${blog.title}</h3>
                <p id="${uniqueId}" style="white-space: pre-wrap; font-size: 14px; margin-bottom: 10px;">_</p>
                <div class="blog-meta">
                    <small style="color:var(--danger-red)">AUTHOR: ${blog.author} | ID: ${blog.author_id}</small>
                    <button class="like-btn" onclick="likeBlog(${blog.id}, false)">[ACK: ${blog.likes}]</button>
                </div>
            `;
            container.appendChild(div);
            typeWriter(uniqueId, blog.para);
        });
    } catch (e) { container.innerHTML = "<p style='color:var(--danger-red)'>SIGNAL LOST. UNABLE TO LOAD ARCHIVES.</p>"; }
}

async function likeBlog(blogId, isHomeView) {
    try {
        const res = await fetch(`${API_URL}/blogs/${blogId}/like`, {
            method: 'POST',
            headers: { 'Authorization': currentUserId }
        });
        if (res.ok) { if (isHomeView) showHome(); else viewArchives(); }
        else { showMessage("COMMUNICATION ERROR.", true); }
    } catch (e) { showMessage("NETWORK DISCONNECTED.", true); }
}

checkAuth();
