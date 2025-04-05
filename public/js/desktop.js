// Main desktop initialization and management script

// WebSocket connection
let socket;
let sessionId;
let systemSpecs = {};

// WebSocket.OPEN constant for cross-browser compatibility
if (typeof WebSocket === 'undefined') {
    var WebSocket = {};
    WebSocket.OPEN = 1;
}

// Connect to WebSocket server
function connectWebSocket() {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    try {
        socket = new WebSocket(wsUrl);
        
        socket.onopen = function() {
            console.log('WebSocket connection established');
            // Request initial data once connected
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({
                    type: 'getApps'
                }));
            }
        };
        
        socket.onmessage = function(event) {
            try {
                const data = event.data;
                console.log('Received raw message:', data);
                
                const message = JSON.parse(data);
                console.log('Parsed message:', message);
                
                if (!message.type || !message.data) {
                    console.log('Ignoring message without type or data');
                    return;
                }
                
                switch (message.type) {
                    case 'session':
                        try {
                            sessionId = message.data.sessionId;
                            systemSpecs = message.data.specs || {};
                            console.log('Session processed, ID:', sessionId);
                            console.log('System specs:', systemSpecs);
                            updateSystemSpecs();
                        } catch (err) {
                            console.error('Error processing session data:', err, message);
                        }
                        break;
                    case 'apps':
                        if (message.data && message.data.installed) {
                            console.log('Installing apps:', message.data.installed);
                            updateInstalledApps(message.data.installed);
                        } else {
                            console.error('Invalid apps data format:', message.data);
                        }
                        break;
                    case 'appInstalled':
                        handleAppInstalled(message.data);
                        break;
                    case 'appUninstalled':
                        handleAppUninstalled(message.data);
                        break;
                    case 'files':
                        updateFiles(message.data.files, message.data.path);
                        break;
                    case 'fileSaved':
                        console.log(`File ${message.data.path} saved successfully`);
                        break;
                    case 'fileContent':
                        handleFileContent(message.data);
                        break;
                    case 'directoryCreated':
                        console.log(`Directory ${message.data.path} created successfully`);
                        break;
                    case 'fileDeleted':
                        console.log(`File ${message.data.path} deleted successfully: ${message.data.success}`);
                        break;
                    case 'systemSpecs':
                        systemSpecs = message.data;
                        updateSystemSpecs();
                        break;
                    case 'settings':
                        updateSettings(message.data);
                        break;
                    case 'settingUpdated':
                        console.log(`Setting ${message.data.category}.${message.data.key} updated successfully`);
                        break;
                    case 'error':
                        console.error('Error from server:', message.data.message, message.data.details);
                        alert(`Error: ${message.data.message}`);
                        break;
                    default:
                        console.log(`Unknown message type: ${message.type}`);
                }
            } catch (error) {
                console.error('Error processing WebSocket message:', error);
                console.error('Raw message data:', event.data);
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
    } catch (error) {
        console.error('Error creating WebSocket connection:', error);
    }
}

// Update system specifications in settings
function updateSystemSpecs() {
    try {
        const specOs = document.getElementById('spec-os');
        const specCpu = document.getElementById('spec-cpu');
        const specRam = document.getElementById('spec-ram');
        const specGpu = document.getElementById('spec-gpu');
        const specStorage = document.getElementById('spec-storage');
        
        if (specOs) specOs.textContent = systemSpecs.os || 'Windows 10 Pro';
        if (specCpu) specCpu.textContent = systemSpecs.cpu || 'Intel Core i9-10900K';
        if (specRam) specRam.textContent = systemSpecs.ram || '64 GB';
        if (specGpu) specGpu.textContent = systemSpecs.gpu || 'NVIDIA GeForce GTX 1080';
        if (specStorage) specStorage.textContent = systemSpecs.storage || '1 TB SSD';
        
        console.log('System specs updated successfully');
    } catch (error) {
        console.error('Error updating system specs:', error);
    }
}

// Update installed applications
function updateInstalledApps(apps) {
    // Update Start Menu apps
    const startAppsContainer = document.querySelector('.start-apps');
    if (!startAppsContainer) {
        console.error('Start apps container not found');
        return;
    }
    
    startAppsContainer.innerHTML = '';
    
    apps.forEach(app => {
        const appElement = document.createElement('div');
        appElement.className = 'start-app';
        
        // Handle both string and object formats
        if (typeof app === 'string') {
            appElement.dataset.app = app;
            appElement.innerHTML = `
                <div class="start-app-icon">${app.charAt(0).toUpperCase()}</div>
                <div class="start-app-name">${app.charAt(0).toUpperCase() + app.slice(1)}</div>
            `;
            appElement.addEventListener('click', () => {
                openApp(app);
                toggleStartMenu();
            });
        } else {
            // Object format with name and displayName
            appElement.dataset.app = app.name;
            let iconContent = app.name.charAt(0).toUpperCase();
            let displayName = app.displayName || app.name.charAt(0).toUpperCase() + app.name.slice(1);
            
            // If icon is provided and is an SVG path
            if (app.icon && app.icon.includes('.svg')) {
                iconContent = `<img src="${app.icon}" alt="${app.name}" class="app-icon-img">`;
            }
            
            appElement.innerHTML = `
                <div class="start-app-icon">${iconContent}</div>
                <div class="start-app-name">${displayName}</div>
            `;
            
            appElement.addEventListener('click', () => {
                openApp(app.name);
                toggleStartMenu();
            });
        }
        
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
function updateFiles(files, path) {
    console.log('Files updated in path:', path, files);
    
    // Find any open explorer windows that are showing this path
    const explorerWindows = document.querySelectorAll('.window[data-app="explorer"]');
    
    explorerWindows.forEach(window => {
        const explorerContent = window.querySelector('.explorer-content');
        if (explorerContent && explorerContent.dataset.path === path) {
            // Update this explorer window with the new files
            updateExplorerContent(explorerContent, files, path);
        }
    });
}

// Handle file content received from server
function handleFileContent(data) {
    const { path, name, content, type } = data;
    console.log(`Received content for ${path}`);
    
    // Find or create a notepad window to display this content
    let notepadWindow = findWindowByTitle(`Notepad - ${name}`);
    
    if (!notepadWindow) {
        // Create a new notepad window
        notepadWindow = createWindow({
            title: `Notepad - ${name}`,
            app: 'notepad',
            width: 600,
            height: 400
        });
    }
    
    // Update the notepad content
    if (notepadWindow) {
        const textarea = notepadWindow.querySelector('.notepad-content textarea');
        if (textarea) {
            textarea.value = content || '';
            // Save the file path as a data attribute for saving
            textarea.dataset.path = path;
        }
    }
}

// Handle app uninstallation response
function handleAppUninstalled(data) {
    if (data.success) {
        // Request updated list of installed apps
        socket.send(JSON.stringify({
            type: 'getApps'
        }));
        
        // Show notification
        alert(`${data.name} has been uninstalled successfully.`);
    } else {
        alert(`Failed to uninstall ${data.name}.`);
    }
}

// Update settings UI based on received settings
function updateSettings(data) {
    const { category, settings } = data;
    console.log(`Received ${category} settings:`, settings);
    
    // Find any open settings windows
    const settingsWindows = document.querySelectorAll('.window[data-app="settings"]');
    
    settingsWindows.forEach(window => {
        // Update settings UI based on category
        const categorySection = window.querySelector(`.settings-section[data-category="${category}"]`);
        
        if (categorySection) {
            for (const [key, value] of Object.entries(settings)) {
                const settingInput = categorySection.querySelector(`[data-setting="${key}"]`);
                
                if (settingInput) {
                    // Update UI based on input type
                    if (settingInput.type === 'checkbox') {
                        settingInput.checked = value;
                    } else if (settingInput.tagName === 'SELECT') {
                        settingInput.value = value;
                    } else {
                        settingInput.value = value;
                    }
                }
            }
        }
    });
}

// Update explorer content with files
function updateExplorerContent(explorerContent, files, path) {
    if (!explorerContent) return;
    
    // Clear current content
    explorerContent.innerHTML = '';
    
    // Set current path
    explorerContent.dataset.path = path;
    
    // Create file list container
    const fileList = document.createElement('div');
    fileList.className = 'file-list';
    
    // Add back button if not at root
    if (path && path !== 'C:/') {
        const backItem = document.createElement('div');
        backItem.className = 'file-item';
        backItem.innerHTML = `
            <div class="file-icon">
                <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="1" fill="none">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
            </div>
            <div class="file-name">...</div>
        `;
        backItem.addEventListener('dblclick', () => {
            const parentPath = path.substring(0, path.lastIndexOf('/'));
            navigateToPath(explorerContent, parentPath || 'C:/');
        });
        
        fileList.appendChild(backItem);
    }
    
    // Add files and folders
    if (Array.isArray(files)) {
        files.forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.dataset.path = file.path;
            fileItem.dataset.type = file.type;
            
            // Get appropriate icon
            let iconSvg = '';
            if (file.type === 'directory') {
                iconSvg = getIconSvgPath('folder');
            } else if (file.type === 'drive') {
                iconSvg = getIconSvgPath('computer');
            } else {
                iconSvg = getIconSvgPath('file');
            }
            
            fileItem.innerHTML = `
                <div class="file-icon">
                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="1" fill="none">
                        ${iconSvg}
                    </svg>
                </div>
                <div class="file-name">${file.name}</div>
            `;
            
            // Add event listeners
            fileItem.addEventListener('click', () => {
                // Select this file
                const selectedFiles = fileList.querySelectorAll('.file-item.selected');
                selectedFiles.forEach(item => item.classList.remove('selected'));
                fileItem.classList.add('selected');
            });
            
            fileItem.addEventListener('dblclick', () => {
                if (file.type === 'directory' || file.type === 'drive') {
                    // Navigate to this directory
                    navigateToPath(explorerContent, file.path);
                } else if (file.type === 'file') {
                    // Open file based on extension
                    openFile(file.path);
                }
            });
            
            fileList.appendChild(fileItem);
        });
    }
    
    explorerContent.appendChild(fileList);
    
    // Update explorer address bar and status bar if they exist
    updateExplorerAddressBar(explorerContent.closest('.window'), path);
    updateExplorerStatusBar(explorerContent.closest('.window'), files ? files.length : 0);
}

// Update explorer address bar
function updateExplorerAddressBar(explorerWindow, path) {
    if (!explorerWindow) return;
    
    const addressBar = explorerWindow.querySelector('.explorer-address-bar input');
    if (addressBar) {
        addressBar.value = path || 'C:/';
    }
}

// Open a file based on its path
function openFile(filePath) {
    if (!filePath) return;
    
    // Request file content from server
    socket.send(JSON.stringify({
        type: 'getFileContent',
        data: { path: filePath }
    }));
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
