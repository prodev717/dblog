/**
 * DBlog Protocol Chatbot Logic
 * Lore Context: Year 2121 P.C., Amaravati Dead-Zone, Sector 4.
 */

const loreKnowledge = {
    "lore": "The year is 2121 P.C. (Post-Collapse). A century after the Great Grid Collapse, we remain in the Amaravati Dead-Zone (Grid Sector 4). DBlog is all that remains of our history.",
    "protocol": "The DBlog Protocol is a military-grade blackbox firmware designed to prevent data scavenging by enemy factions.",
    "purge": "If the 'Life Signal' isn't detected every 60 seconds, the kernel assumes the author has perished. All unverified data is purged immediately.",
    "switch": "The 'Dead-man's Switch' is our safety. Prove you are alive, or your words die with you.",
    "recovery": "Smart Recovery silently fragments your text into safe backups every time you hit 'Still Alive'. If you perish (timeout), you revert to the last verification point.",
    "face": "Biometric scans are mandatory. No face, no access. The grid does not recognize ghosts.",
    "time": "System time is recorded as P.C. (Post-Collapse). We are 100 years into the silence.",
    "bunker": "Bunker Sector 7 Reliance. Integrity is holding, but for how long?",
    "faction": "Data scavenging by enemy factions is the primary threat. Total data erasure is the only defense.",
    "amaravati": "Amaravati Dead-Zone. Once a hub of the Old World, now Grid Sector 4. High radiation. Low survival probability.",
    "who are you": "I am the Archival Interface daemon. I guard the protocols and the lore of the fallen.",
    "help": "Keywords detected in my database: LORE, PURGE, SWITCH, RECOVERY, FACE, TIME, AMARAVATI, FACTION. Input query."
};

function showProtocol() {
    hideAllViews();
    document.getElementById("nav-bar").style.display = "block";
    document.getElementById("protocol-view").style.display = "flex";
    setTimeout(() => document.getElementById("protocol-chat-input").focus(), 50);
}

function handleProtocolInput(e) {
    if (e.key !== 'Enter') return;
    const input = e.target.value.trim().toLowerCase();
    e.target.value = '';
    
    if (!input) return;

    // Echo user input
    printToProtocolChat(`<span style="color:rgba(0,255,65,0.6)">query@protocol:~$</span> ${escapeHtml(input)}`);

    // Generate response
    let response = "UNAUTHORIZED QUESTION. SECURITY CLEARANCE INSUFFICIENT OR DATA CORRUPTED.";
    
    for (const key in loreKnowledge) {
        if (input.includes(key)) {
            response = loreKnowledge[key];
            break;
        }
    }

    setTimeout(() => {
        printToProtocolChat(`<span style="color:var(--danger-red)">[DAEMON]:</span> ${response}`);
        playBeep();
    }, 400);
}

function printToProtocolChat(html) {
    const out = document.getElementById("protocol-chat-output");
    const d = document.createElement("div");
    d.style.marginBottom = "8px";
    d.innerHTML = html;
    out.appendChild(d);
    out.scrollTop = out.scrollHeight;
}
