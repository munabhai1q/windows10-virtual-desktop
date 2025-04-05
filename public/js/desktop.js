// Main desktop initialization and management script

// WebSocket connection
let socket;
let sessionId;
let systemSpecs = {};

// Connect to WebSocket server
function connectWebSocket() {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    socket = new WebSocket(wsUrl);
    
    socket.onopen = function() {
        console.log('WebSocket connection established');
    };
    
    socket.onmessage = function(event) {
        try {
            const message = JSON.parse(event.data);
            
            switch (message.type) {
                case 'session':
                    sessionId = message.data.sessionId;
                    systemSpecs = message.data.specs;
                    updateSystemSpecs();
                    break;
                case 'apps':
                    updateInstalledApps(message.data.installed);
                    break;
                case 'appInstalled':
                    handleAppInstalled(message.data);
                    break;
                case 'files':
                    updateFiles(message.data.files);
                    break;
                case 'fileSaved':
                    console.log(`File ${message.data.path} saved successfully`);
                    break;
                default:
                    console.log(`Unknown message type: ${message.type}`);
            }
        } catch (error) {
            console.error('Error processing WebSocket message:', error);
        }
    };
    
    socket.onclose = function() {
        console.log('WebSocket connection closed');
        // Try to reconnect after a short delay
        setTimeout(connectWebSocket, 3000);
    };
    
    socket.onerror = function(error) {
        console.error('WebSocket error:', error);
    };
}

// Update system specifications in settings
function updateSystemSpecs() {
    document.getElementById('spec-os').textContent = systemSpecs.os || 'Windows 10 Pro';
    document.getElementById('spec-cpu').textContent = systemSpecs.cpu || 'Intel Core i9-10900K';
    document.getElementById('spec-ram').textContent = systemSpecs.ram || '64 GB';
    document.getElementById('spec-gpu').textContent = systemSpecs.gpu || 'NVIDIA GeForce GTX 1080';
    document.getElementById('spec-storage').textContent = systemSpecs.storage || '1 TB SSD';
}

// Update installed applications
function updateInstalledApps(apps) {
    // Update Start Menu apps
    const startAppsContainer = document.querySelector('.start-apps');
    startAppsContainer.innerHTML = '';
    
    apps.forEach(app => {
        const appElement = document.createElement('div');
        appElement.className = 'start-app';
        appElement.dataset.app = app;
        appElement.innerHTML = `
            <div class="start-app-icon">${app.charAt(0).toUpperCase()}</div>
            <div class="start-app-name">${app.charAt(0).toUpperCase() + app.slice(1)}</div>
        `;
        appElement.addEventListener('click', () => {
            openApp(app);
            toggleStartMenu();
        });
        startAppsContainer.appendChild(appElement);
    });
    
    // Update desktop icons
    updateDesktopIcons(apps);
}

// Handle app installation confirmation
function handleAppInstalled(data) {
    if (data.success) {
        // Request updated list of installed apps
        socket.send(JSON.stringify({
            type: 'getApps'
        }));
        
        // Show notification
        alert(`${data.name} has been installed successfully.`);
    } else {
        alert(`Failed to install ${data.name}.`);
    }
}

// Update file system display
function updateFiles(files) {
    console.log('Files updated:', files);
    // This would update file system windows if open
}

// Initialize desktop
function initDesktop() {
    // Connect to WebSocket
    connectWebSocket();
    
    // Initialize loading screen
    showLoadingScreen();
    
    // Initialize date and time display
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    // Initialize default desktop icons
    createDefaultDesktopIcons();
    
    // Initialize event listeners
    initEventListeners();
}

// Show loading screen with Windows boot simulation
function showLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    loadingScreen.style.display = 'flex';
    
    // Simulate Windows boot sequence
    setTimeout(() => {
        loadingScreen.style.display = 'none';
        document.getElementById('login-screen').style.display = 'block';
    }, 3000);
}

// Update date and time in the taskbar
function updateDateTime() {
    const now = new Date();
    document.getElementById('time').textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    document.getElementById('date').textContent = now.toLocaleDateString();
}

// Create default desktop icons
function createDefaultDesktopIcons() {
    const desktopIcons = document.getElementById('desktop-icons');
    
    // Basic desktop icons
    const defaultIcons = [
        { name: 'This PC', icon: 'computer' },
        { name: 'Recycle Bin', icon: 'trash' },
        { name: 'Edge', icon: 'globe' },
        { name: 'File Explorer', icon: 'folder' }
    ];
    
    defaultIcons.forEach(icon => {
        const iconElement = document.createElement('div');
        iconElement.className = 'desktop-icon';
        iconElement.dataset.name = icon.name.toLowerCase().replace(/\s/g, '-');
        iconElement.innerHTML = `
            <div class="icon-image">
                <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" stroke-width="1" fill="none">
                    ${getIconSvgPath(icon.icon)}
                </svg>
            </div>
            <div class="icon-text">${icon.name}</div>
        `;
        
        iconElement.addEventListener('click', function(e) {
            selectDesktopIcon(this);
        });
        
        iconElement.addEventListener('dblclick', function(e) {
            const appName = this.dataset.name;
            if (appName === 'this-pc' || appName === 'file-explorer') {
                openApp('explorer');
            } else if (appName === 'edge') {
                openApp('chrome');
            }
        });
        
        desktopIcons.appendChild(iconElement);
    });
}

// Update desktop icons based on installed apps
function updateDesktopIcons(apps) {
    // This would add icons for installed applications
    // For now, we'll use the default icons
}

// Get SVG path for icon
function getIconSvgPath(icon) {
    const icons = {
        computer: '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line>',
        folder: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>',
        globe: '<circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>',
        trash: '<polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>'
    };
    
    return icons[icon] || '';
}

// Select desktop icon
function selectDesktopIcon(iconElement) {
    // Deselect all icons
    document.querySelectorAll('.desktop-icon').forEach(icon => {
        icon.classList.remove('selected');
    });
    
    // Select clicked icon
    iconElement.classList.add('selected');
}

// Initialize event listeners
function initEventListeners() {
    // Login button click
    document.getElementById('login-btn').addEventListener('click', function() {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('desktop').style.display = 'block';
        
        // Request apps from server
        if (socket.readyState === 1) { // WebSocket.OPEN is 1
            socket.send(JSON.stringify({
                type: 'getApps'
            }));
        }
    });
    
    // Password input enter key
    document.getElementById('password').addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            document.getElementById('login-btn').click();
        }
    });
    
    // Desktop click (for closing menus and deselecting icons)
    document.getElementById('desktop').addEventListener('click', function(e) {
        if (e.target === this) {
            // Close start menu if open
            if (document.getElementById('start-menu').style.display !== 'none') {
                toggleStartMenu();
            }
            
            // Close context menu if open
            hideContextMenu();
            
            // Deselect all icons
            document.querySelectorAll('.desktop-icon').forEach(icon => {
                icon.classList.remove('selected');
            });
        }
    });
    
    // Right-click on desktop for context menu
    document.getElementById('desktop').addEventListener('contextmenu', function(e) {
        e.preventDefault();
        showContextMenu(e.clientX, e.clientY);
    });
    
    // Start button click
    document.getElementById('start-button').addEventListener('click', toggleStartMenu);
    
    // Power button click
    document.getElementById('power-button').addEventListener('click', function() {
        if (confirm('Are you sure you want to shut down?')) {
            document.getElementById('desktop').style.display = 'none';
            document.getElementById('login-screen').style.display = 'block';
        }
    });
    
    // Settings button click
    document.getElementById('settings-button').addEventListener('click', function() {
        openApp('settings');
        toggleStartMenu();
    });
}

// Toggle start menu visibility
function toggleStartMenu() {
    const startMenu = document.getElementById('start-menu');
    if (startMenu.style.display === 'none' || startMenu.style.display === '') {
        startMenu.style.display = 'flex';
    } else {
        startMenu.style.display = 'none';
    }
}

// Document ready event
document.addEventListener('DOMContentLoaded', initDesktop);
