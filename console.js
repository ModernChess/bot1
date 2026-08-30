(function() {
    const consoleBody = document.getElementById('console-body');
    if (!consoleBody) return;

    function appendLog(type, args) {
        const item = document.createElement('div');
        item.className = `console-log-item ${type}`;
        let message = Array.from(args).map(arg => {
            if (typeof arg === 'object') {
                try { return JSON.stringify(arg); } catch(e) { return String(arg); }
            }
            return String(arg);
        }).join(' ');
        item.textContent = `[${type.toUpperCase()}] ${message}`;
        consoleBody.appendChild(item);
        consoleBody.scrollTop = consoleBody.scrollHeight;
    }

    const origLog = console.log, origError = console.error, origWarn = console.warn, origInfo = console.info;
    console.log = function() { origLog.apply(console, arguments); appendLog('log', arguments); };
    console.error = function() { origError.apply(console, arguments); appendLog('error', arguments); };
    console.warn = function() { origWarn.apply(console, arguments); appendLog('warn', arguments); };
    console.info = function() { origInfo.apply(console, arguments); appendLog('info', arguments); };
})();

function toggleConsole() {
    const consoleEl = document.getElementById('custom-console');
    const btn = document.getElementById('console-toggle-btn');
    if (!consoleEl || !btn) return;
    consoleEl.classList.toggle('minimized');
    btn.textContent = consoleEl.classList.contains('minimized') ? 'Maximize' : 'Minimize';
}
