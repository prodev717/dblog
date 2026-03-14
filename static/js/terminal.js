// ========== TERMINAL ENGINE ==========
let termHistory = [];
let termHistoryIdx = -1;
const termBoot = [
    '<span style="color:var(--danger-red)">BUNKER_OS v4.2.1 — EMERGENCY KERNEL</span>',
    'CPU: [████████░░] 82% | MEM: 2.1GB / 3.0GB | TEMP: 61°C',
    'UPLINK: NONE  |  RADIATION: 0.8 μSv/h  |  POWER: BACKUP GENERATOR',
    'Type <b>help</b> to list available commands.',
    '───────────────────────────────────────────────',
];

function showTerminal() {
    hideAllViews();
    document.getElementById("nav-bar").style.display = "block";
    const tv = document.getElementById("terminal-view");
    tv.style.display = "flex";
    const out = document.getElementById("term-output");
    if (out.innerHTML === '') {
        termBoot.forEach(line => termPrint(line, false));
    }
    setTimeout(() => document.getElementById("term-input").focus(), 50);
}

function termPrint(html, withPrompt = true) {
    const out = document.getElementById("term-output");
    if (withPrompt) {
        const p = document.createElement("div");
        p.style.color = 'rgba(0,255,65,0.5)';
        p.textContent = `root@bunker:~$ ${withPrompt}`;
        out.appendChild(p);
    }
    const d = document.createElement("div");
    d.innerHTML = html;
    out.appendChild(d);
    out.scrollTop = out.scrollHeight;
}

function handleTermInput(e) {
    if (e.key === 'ArrowUp') {
        if (termHistory.length > 0) {
            termHistoryIdx = Math.min(termHistoryIdx + 1, termHistory.length - 1);
            e.target.value = termHistory[termHistoryIdx];
        }
        return;
    }
    if (e.key === 'ArrowDown') {
        termHistoryIdx = Math.max(termHistoryIdx - 1, -1);
        e.target.value = termHistoryIdx >= 0 ? termHistory[termHistoryIdx] : '';
        return;
    }
    if (e.key !== 'Enter') return;
    const input = e.target.value.trim();
    e.target.value = '';
    if (!input) return;
    termHistory.unshift(input);
    termHistoryIdx = -1;
    // Echo the command
    const echo = document.createElement("div");
    echo.innerHTML = `<span style="color:rgba(0,255,65,0.6)">root@bunker:~$</span> ${escapeHtml(input)}`;
    document.getElementById("term-output").appendChild(echo);
    runTermCommand(input);
    playBeep();
}

function escapeHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function runTermCommand(raw) {
    const parts = raw.trim().split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1).join(' ');

    const responses = {
        help: () => [
            '<b>AVAILABLE COMMANDS:</b>',
            '  <b>ls</b>           — list directory contents',
            '  <b>whoami</b>       — display current user identity',
            '  <b>date</b>         — display system timestamp',
            '  <b>uname</b>        — display OS info',
            '  <b>uptime</b>       — display system uptime',
            '  <b>echo [text]</b>  — print text to stdout',
            '  <b>cat [file]</b>   — read a file',
            '  <b>clear</b>        — clear terminal output',
            '  <b>ps</b>           — list running processes',
            '  <b>ping</b>         — attempt network ping',
            '  <b>radiation</b>    — check external radiation levels',
            '  <b>bunker</b>       — display structural integrity',
            '  <b>sudo</b>         — invoke superuser privileges',
            '  <b>rm -rf /</b>     — ...',
            '  <b>logout</b>       — terminate session',
        ].join('<br>'),

        ls: () => [
            'drwxr-xr-x  <span style="color:var(--glow-color)">logs/</span>',
            'drwxr-xr-x  <span style="color:var(--glow-color)">archives/</span>',
            '-rw-r--r--  manifest.dat',
            '-rw-------  <span style="color:var(--danger-red)">biometric.enc</span>',
            '-rw-r--r--  bunker_protocol.txt',
            '-rw-r--r--  survivor_count.log',
        ].join('<br>'),

        whoami: () => `<span style="color:var(--glow-color)">${currentUserName || 'UNKNOWN_NODE'}</span>  [UID:${currentUserId || '???'}]  |  CLEARANCE: LEVEL-3`,

        date: () => `SYS_TIME: ${new Date().toUTCString()}  [BUNKER_ATOMIC_CLOCK: DRIFTING ±4.2s]`,

        radiation: () => {
            const level = (0.5 + Math.random() * 0.5).toFixed(3);
            return `RADIATION_LEVEL: <span style="color:${level > 0.8 ? 'var(--danger-red)' : 'var(--glow-color)'}">${level} μSv/h</span> [STATUS: ${level > 0.8 ? 'ELEVATED' : 'STABLE'}]`;
        },

        bunker: () => [
            '<b>BUNKER_SPECIFICATIONS:</b>',
            '  DESIGNATION: SECTOR_7_RELIANCE',
            '  INTEGRITY: 89%',
            '  OXYGEN: 94%',
            '  POPULATION: 3 (AUTHORIZED)',
            '  DEFENSE_GRID: ACTIVE',
        ].join('<br>'),

        uname: () => 'BUNKER_OS 4.2.1-EMERGENCY-KERNEL #1 SMP Thu Jan 01 00:00:00 UTC 2026 x86_64',

        uptime: () => {
            const s = Math.floor(performance.now() / 1000);
            const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60;
            return `up ${h}h ${m}m ${sec}s  |  load avg: 4.20 6.66 9.11  |  GENERATOR FUEL: 34%`;
        },

        echo: () => args ? escapeHtml(args) : '',

        clear: () => { document.getElementById('term-output').innerHTML = ''; return null; },

        ps: () => [
            '  PID  CMD',
            '    1  /sbin/init',
            '   42  bunker_watchdog',
            '  187  <span style="color:var(--danger-red)">panic_alarm.sh</span>',
            '  203  face_scanner',
            '  256  journal_daemon',
            `  512  bash — <span style="color:var(--glow-color)">${currentUserName || 'unknown'}</span>`,
        ].join('<br>'),

        ping: () => '<span style="color:var(--danger-red)">PING 0.0.0.0: Network unreachable. No external uplink detected. You are alone.</span>',

        sudo: () => '<span style="color:var(--danger-red)">[SECURITY ALERT] Unauthorized privilege escalation attempt. Incident logged. Node flagged.</span>',

        logout: () => { setTimeout(logout, 800); return '<span style="color:var(--danger-red)">TERMINATING SESSION...</span>'; },

        cat: () => {
            const files = {
                'manifest.dat': 'BUNKER_MANIFEST v1.0\nCAPACITY: 47 survivors\nCURRENT: 3 survivors\nSTATUS: CRITICAL',
                'bunker_protocol.txt': 'RULE 1: Do not open the outer vault.\nRULE 2: Log all activity.\nRULE 3: If compromised, initiate wipe protocol.\nRULE 4: Confirm existence every 60 seconds.',
                'survivor_count.log': '[2024-01-01] count=47\n[2025-06-12] count=11\n[2026-01-01] count=3\n[2026-03-14] count=3  — NO CHANGE',
                'biometric.enc': '<span style="color:var(--danger-red)">PERMISSION DENIED: File is encrypted. Access requires biometric clearance.</span>',
            };
            if (!args) return 'Usage: cat [filename]';
            return files[args] ? `<pre style="margin:0">${files[args]}</pre>` : `<span style="color:var(--danger-red)">cat: ${escapeHtml(args)}: No such file or directory</span>`;
        },
    };

    // Special case: rm -rf /
    if (raw.trim().startsWith('rm')) {
        if (raw.includes('-rf') || raw.includes('-r')) {
            termPrint('<span style="color:var(--danger-red)">EXECUTING WIPE PROTOCOL...</span>', false);
            let dots = 0;
            const wipe = setInterval(() => {
                termPrint(`<span style="color:var(--danger-red)">[████${Array(dots++).fill('░').join('')}] PURGING SECTOR ${Math.floor(Math.random()*9999)}...</span>`, false);
                if (dots > 5) {
                    clearInterval(wipe);
                    termPrint('<span style="color:var(--danger-red)">Just kidding. Nice try, survivor.</span>', false);
                }
            }, 300);
            return;
        }
        termPrint(`<span style="color:var(--danger-red)">rm: missing operand</span>`, false);
        return;
    }

    const fn = responses[cmd];
    if (fn) {
        const result = fn();
        if (result !== null && result !== undefined) termPrint(result, false);
    } else {
        termPrint(`<span style="color:var(--danger-red)">bash: ${escapeHtml(cmd)}: command not found</span>`, false);
    }
}
// ========== END TERMINAL ENGINE ==========
