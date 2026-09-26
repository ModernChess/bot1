// =========================================================================
// IN-GAME OVERLAY CONSOLE & ERROR/SUCCESS TRACKER (VISIBLE & INTERACTIVE)
// =========================================================================

(function() {
    // Create container elements for the in-game console and make it visible by default
    const consoleContainer = document.createElement('div');
    consoleContainer.id = 'ingame-debug-console';
    consoleContainer.style.cssText = `
        position: fixed;
        bottom: 15px;
        right: 15px;
        width: 440px;
        height: 220px;
        background: rgba(15, 15, 15, 0.92);
        border: 2px solid #444;
        border-radius: 8px;
        color: #fff;
        font-family: monospace;
        font-size: 11px;
        z-index: 99999;
        display: flex;
        flex-direction: column;
        box-shadow: 0 6px 16px rgba(0,0,0,0.7);
        pointer-events: auto;
        transition: height 0.2s ease;
    `;

    const headerBar = document.createElement('div');
    headerBar.style.cssText = `
        background: #222;
        padding: 6px 10px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #444;
        cursor: pointer;
        user-select: none;
        border-top-left-radius: 6px;
        border-top-right-radius: 6px;
    `;
    headerBar.innerHTML = `<span><b>Game Tracker & Console</b></span>`;

    const controls = document.createElement('div');
    
    const clearBtn = document.createElement('button');
    clearBtn.innerText = 'Clear';
    clearBtn.style.cssText = 'background:#444; color:#fff; border:none; padding:2px 6px; cursor:pointer; font-size:10px; margin-right:5px; border-radius:3px;';
    clearBtn.onclick = (e) => { 
        e.stopPropagation(); 
        logContent.innerHTML = ''; 
    };

    const toggleBtn = document.createElement('button');
    toggleBtn.innerText = '_';
    toggleBtn.style.cssText = 'background:#444; color:#fff; border:none; padding:2px 8px; cursor:pointer; font-size:10px; border-radius:3px;';
    
    let isMinimized = false;
    toggleBtn.onclick = (e) => {
        e.stopPropagation();
        isMinimized = !isMinimized;
        if (isMinimized) {
            consoleContainer.style.height = '32px';
            logContent.style.display = 'none';
            toggleBtn.innerText = '+';
        } else {
            consoleContainer.style.height = '220px';
            logContent.style.display = 'flex';
            toggleBtn.innerText = '_';
        }
    };

    controls.appendChild(clearBtn);
    controls.appendChild(toggleBtn);
    headerBar.appendChild(controls);
    consoleContainer.appendChild(headerBar);

    const logContent = document.createElement('div');
    logContent.style.cssText = `
        flex: 1;
        overflow-y: auto;
        padding: 8px;
        display: flex;
        flex-direction: column;
        gap: 4px;
        word-break: break-all;
    `;
    consoleContainer.appendChild(logContent);

    document.body.appendChild(consoleContainer);

    // Capture and display logs inside the UI overlay container
    function appendLog(type, args) {
        let msg = args.map(arg => {
            if (typeof arg === 'object') {
                try { return JSON.stringify(arg); } catch(e) { return String(arg); }
            }
            return String(arg);
        }).join(' ');

        let logEntry = document.createElement('div');
        logEntry.style.padding = '2px 4px';
        logEntry.style.borderRadius = '3px';
        logEntry.style.lineHeight = '1.3';

        if (type === 'error') {
            logEntry.style.background = 'rgba(192, 57, 43, 0.3)';
            logEntry.style.color = '#e74c3c';
        } else if (type === 'warn') {
            logEntry.style.background = 'rgba(241, 196, 15, 0.2)';
            logEntry.style.color = '#f1c40f';
        } else if (msg.includes('SUCCESS') || msg.includes('successfully')) {
            logEntry.style.color = '#2ecc71';
        } else {
            logEntry.style.color = '#dcdcdc';
        }

        logEntry.innerText = msg;
        logContent.appendChild(logEntry);
        
        // Auto-scroll to the bottom of the log container
        logContent.scrollTop = logContent.scrollHeight;
    }

    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    console.log = function(...args) {
        originalLog.apply(console, args);
        appendLog('log', args);
    };

    console.warn = function(...args) {
        originalWarn.apply(console, args);
        appendLog('warn', args);
    };

    console.error = function(...args) {
        originalError.apply(console, args);
        appendLog('error', args);
    };

    window.addEventListener('error', function(event) {
        appendLog('error', [`Uncaught Error: ${event.message} at ${event.filename}:${event.lineno}`]);
    });

    console.log("[SUCCESS][console] In-game overlay console loaded and active.");
})();
