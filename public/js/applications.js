// Applications Manager - Handles opening and interacting with applications

// Application definitions with their properties and behavior
const applications = {
    explorer: {
        title: 'File Explorer',
        icon: 'folder',
        width: '800px',
        height: '600px',
        openFunction: openExplorer
    },
    notepad: {
        title: 'Notepad',
        icon: 'file-text',
        width: '600px',
        height: '400px',
        openFunction: openNotepad
    },
    settings: {
        title: 'Settings',
        icon: 'settings',
        width: '800px',
        height: '600px',
        openFunction: openSettings
    },
    chrome: {
        title: 'Google Chrome',
        icon: 'chrome',
        width: '900px',
        height: '600px',
        openFunction: openChrome
    },
    store: {
        title: 'Microsoft Store',
        icon: 'shopping-bag',
        width: '800px',
        height: '600px',
        openFunction: openStore
    }
};

// Open an application
function openApp(appName) {
    if (applications[appName]) {
        const app = applications[appName];
        
        // Check if app is already open
        const existingWindow = findWindowByTitle(app.title);
        if (existingWindow) {
            if (existingWindow.isMinimized) {
                restoreWindow(existingWindow);
            } else {
                activateWindow(existingWindow);
            }
            return;
        }
        
        // Open the app using its specific function
        app.openFunction();
    } else {
        console.error(`Application "${appName}" not found`);
    }
}

// Open File Explorer
function openExplorer() {
    const template = document.getElementById('explorer-template');
    const content = template.content.cloneNode(true);
    
    const window = createWindow({
        title: applications.explorer.title,
        content: content,
        width: applications.explorer.width,
        height: applications.explorer.height
    });
    
    // Set up event listeners for explorer functionality
    const explorerContent = window.element.querySelector('.explorer-content');
    
    // Handle sidebar item clicks
    window.element.querySelectorAll('.sidebar-item').forEach(item => {
        item.addEventListener('click', function() {
            const path = this.dataset.path;
            navigateToPath(explorerContent, path);
        });
    });
    
    // Load initial "This PC" view
    navigateToThisPC(explorerContent);
}

// Navigate to a specific path in explorer
function navigateToPath(explorerContent, path) {
    // Clear current content
    explorerContent.innerHTML = '';
    
    // Simulate path navigation
    if (path === 'c') {
        // Show C: drive contents
        const driveC = document.createElement('div');
        driveC.className = 'explorer-item';
        driveC.innerHTML = `
            <div class="item-icon">W</div>
            <div class="item-name">Windows</div>
        `;
        
        const users = document.createElement('div');
        users.className = 'explorer-item';
        users.innerHTML = `
            <div class="item-icon">U</div>
            <div class="item-name">Users</div>
        `;
        
        explorerContent.appendChild(driveC);
        explorerContent.appendChild(users);
    } else if (['desktop', 'downloads', 'documents', 'pictures'].includes(path)) {
        // Show user folder contents
        const dummyFiles = [
            { name: 'File 1', icon: 'F' },
            { name: 'File 2', icon: 'F' },
            { name: 'Folder 1', icon: 'D' }
        ];
        
        dummyFiles.forEach(file => {
            const fileElement = document.createElement('div');
            fileElement.className = 'explorer-item';
            fileElement.innerHTML = `
                <div class="item-icon">${file.icon}</div>
                <div class="item-name">${file.name}</div>
            `;
            explorerContent.appendChild(fileElement);
        });
    }
    
    // Update status bar
    updateExplorerStatusBar(explorerContent);
}

// Navigate to "This PC" view
function navigateToThisPC(explorerContent) {
    // Clear current content
    explorerContent.innerHTML = '';
    
    // Create C: drive item
    const driveC = document.createElement('div');
    driveC.className = 'explorer-item system-drive';
    driveC.innerHTML = `
        <div class="item-icon">C:</div>
        <div class="item-name">Local Disk (C:)</div>
        <div class="item-details">SSD: 1 TB</div>
    `;
    
    driveC.addEventListener('dblclick', function() {
        navigateToPath(explorerContent, 'c');
    });
    
    explorerContent.appendChild(driveC);
    
    // Update status bar
    updateExplorerStatusBar(explorerContent);
}

// Update explorer status bar
function updateExplorerStatusBar(explorerContent) {
    const statusBar = explorerContent.closest('.explorer').querySelector('.status-text');
    const itemCount = explorerContent.children.length;
    statusBar.textContent = `${itemCount} item${itemCount !== 1 ? 's' : ''}`;
}

// Open Notepad
function openNotepad() {
    const template = document.getElementById('notepad-template');
    const content = template.content.cloneNode(true);
    
    const window = createWindow({
        title: applications.notepad.title,
        content: content,
        width: applications.notepad.width,
        height: applications.notepad.height
    });
    
    // Set up notepad functionality
    const textarea = window.element.querySelector('.notepad-textarea');
    
    // Allow saving with Ctrl+S
    textarea.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            // Simulate file save dialog
            alert('File saved successfully!');
        }
    });
}

// Open Settings
function openSettings() {
    const template = document.getElementById('settings-template');
    const content = template.content.cloneNode(true);
    
    const window = createWindow({
        title: applications.settings.title,
        content: content,
        width: applications.settings.width,
        height: applications.settings.height
    });
    
    // Set up settings functionality
    const settingsElement = window.element.querySelector('.settings');
    
    // Handle sidebar navigation
    settingsElement.querySelectorAll('.sidebar-item').forEach(item => {
        item.addEventListener('click', function() {
            // Remove active class from all sidebar items
            settingsElement.querySelectorAll('.sidebar-item').forEach(i => {
                i.classList.remove('active');
            });
            
            // Add active class to clicked item
            this.classList.add('active');
            
            // Hide all sections
            settingsElement.querySelectorAll('.settings-section').forEach(section => {
                section.classList.remove('active');
            });
            
            // Show selected section
            const sectionId = `${this.dataset.section}-section`;
            document.getElementById(sectionId).classList.add('active');
        });
    });
    
    // Update system specs
    updateSystemSpecs();
}

// Open Chrome
function openChrome() {
    const template = document.getElementById('chrome-template');
    const content = template.content.cloneNode(true);
    
    const window = createWindow({
        title: applications.chrome.title,
        content: content,
        width: applications.chrome.width,
        height: applications.chrome.height
    });
    
    // Set up Chrome functionality
    const chromeElement = window.element.querySelector('.chrome');
    
    // Handle address bar
    const addressBar = chromeElement.querySelector('.chrome-address-bar input');
    addressBar.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            
            const url = this.value;
            if (url) {
                // Simulate navigating to the URL
                const chromePage = chromeElement.querySelector('.chrome-page');
                
                if (url.includes('google.com')) {
                    // Show Google search page
                    chromePage.innerHTML = `
                        <div class="google-logo">Google</div>
                        <div class="google-search">
                            <input type="text" placeholder="Search Google or type a URL">
                        </div>
                    `;
                } else {
                    // Show a generic page for other URLs
                    chromePage.innerHTML = `
                        <div style="padding: 20px;">
                            <h2>Simulated Webpage</h2>
                            <p>This is a simulated page for: ${url}</p>
                            <p>The actual web browsing functionality is not available in this simulation.</p>
                        </div>
                    `;
                }
            }
        }
    });
    
    // Handle navigation buttons
    const backBtn = chromeElement.querySelector('.back-btn');
    const forwardBtn = chromeElement.querySelector('.forward-btn');
    const refreshBtn = chromeElement.querySelector('.refresh-btn');
    
    backBtn.addEventListener('click', function() {
        // Simulate going back
        alert('Back navigation simulated');
    });
    
    forwardBtn.addEventListener('click', function() {
        // Simulate going forward
        alert('Forward navigation simulated');
    });
    
    refreshBtn.addEventListener('click', function() {
        // Simulate refreshing
        alert('Page refresh simulated');
    });
}

// Open Microsoft Store
function openStore() {
    const template = document.getElementById('store-template');
    const content = template.content.cloneNode(true);
    
    const window = createWindow({
        title: applications.store.title,
        content: content,
        width: applications.store.width,
        height: applications.store.height
    });
    
    // Set up Store functionality
    const storeElement = window.element.querySelector('.store');
    
    // Handle sidebar navigation
    storeElement.querySelectorAll('.sidebar-item').forEach(item => {
        item.addEventListener('click', function() {
            // Remove active class from all sidebar items
            storeElement.querySelectorAll('.sidebar-item').forEach(i => {
                i.classList.remove('active');
            });
            
            // Add active class to clicked item
            this.classList.add('active');
        });
    });
    
    // Handle app installation
    storeElement.querySelectorAll('.app-install-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const appItem = this.closest('.app-item');
            const appName = appItem.dataset.app;
            
            // Show installation progress
            this.textContent = 'Installing...';
            this.disabled = true;
            
            // Simulate installation delay
            setTimeout(() => {
                // Send app installation request to server
                if (socket && socket.readyState === 1) { // WebSocket.OPEN is 1
                    socket.send(JSON.stringify({
                        type: 'installApp',
                        data: { name: appName }
                    }));
                } else {
                    alert(`Installed ${appName} (offline mode)`);
                    this.textContent = 'Installed';
                }
            }, 2000);
        });
    });
}
