// Applications Manager - Handles opening and interacting with applications

// WebSocket.OPEN constant for cross-browser compatibility
if (typeof WebSocket === 'undefined') {
    var WebSocket = {};
    WebSocket.OPEN = 1;
}

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
    },
    davinci: {
        title: 'DaVinci Resolve',
        icon: 'video',
        width: '1000px',
        height: '700px',
        openFunction: openDavinciResolve
    },
    'davinci-studio': {
        title: 'DaVinci Resolve Studio',
        icon: 'film',
        width: '1000px',
        height: '700px',
        openFunction: openDavinciResolveStudio
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
    if (!explorerContent) return;
    
    // Set the current path as data attribute
    explorerContent.dataset.path = path;
    
    // Show loading indicator
    explorerContent.innerHTML = '<div class="loading-spinner">Loading...</div>';
    
    // Request files for this path from server
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: 'getFiles',
            data: { path: path }
        }));
    } else {
        console.error('WebSocket not available for file system navigation');
        explorerContent.innerHTML = '<div class="error-message">Cannot connect to file system. WebSocket connection is not available.</div>';
    }
}

// Navigate to "This PC" view
function navigateToThisPC(explorerContent) {
    // Just navigate to the root path
    navigateToPath(explorerContent, 'C:/');
}

// Update explorer status bar
function updateExplorerStatusBar(explorerContent) {
    const statusBar = explorerContent.closest('.explorer').querySelector('.status-text');
    const itemCount = explorerContent.children.length;
    statusBar.textContent = `${itemCount} item${itemCount !== 1 ? 's' : ''}`;
}

// Open Notepad
function openNotepad(filePath, fileName) {
    const template = document.getElementById('notepad-template');
    const content = template.content.cloneNode(true);
    
    // Use the file name in the title if provided, or default notepad title
    const title = fileName ? `Notepad - ${fileName}` : applications.notepad.title;
    
    const window = createWindow({
        title: title,
        content: content,
        width: applications.notepad.width,
        height: applications.notepad.height,
        app: 'notepad'
    });
    
    // Set up notepad functionality
    const textarea = window.element.querySelector('.notepad-textarea');
    
    // Load content if a file path is provided
    if (filePath) {
        // Set the file path as a data attribute for saving
        textarea.dataset.path = filePath;
        
        // Request file content from the server
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: 'getFileContent',
                data: { path: filePath }
            }));
        }
    }
    
    // Allow saving with Ctrl+S
    textarea.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            
            // Get the file path if it exists
            const path = textarea.dataset.path;
            
            if (path) {
                // Save to existing file
                saveNotepadContent(path, textarea.value);
            } else {
                // Simulate file save dialog - in a real implementation, 
                // we would show a save dialog to get file name and path
                const defaultPath = 'C:/Users/User/Documents/Untitled.txt';
                saveNotepadContent(defaultPath, textarea.value);
                textarea.dataset.path = defaultPath;
                
                // Update window title
                const windowElement = textarea.closest('.window');
                if (windowElement) {
                    const titleElement = windowElement.querySelector('.window-title');
                    if (titleElement) {
                        titleElement.textContent = `Notepad - Untitled.txt`;
                    }
                }
            }
        }
    });
    
    return window;
}

// Save notepad content to file
function saveNotepadContent(path, content) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: 'saveFile',
            data: {
                path: path,
                content: content
            }
        }));
        
        console.log(`Saving file to ${path}`);
    } else {
        console.error('WebSocket not available for saving file');
        alert('Cannot save file. WebSocket connection is not available.');
    }
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
                if (socket && socket.readyState === WebSocket.OPEN) {
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

// Open DaVinci Resolve
function openDavinciResolve() {
    const content = document.createElement('div');
    content.className = 'window-content davinci-resolve';
    content.innerHTML = `
        <div class="davinci-toolbar">
            <div class="toolbar-item">File</div>
            <div class="toolbar-item">Edit</div>
            <div class="toolbar-item">Clip</div>
            <div class="toolbar-item">Timeline</div>
            <div class="toolbar-item">Render</div>
            <div class="toolbar-item">View</div>
            <div class="toolbar-item">Workspace</div>
            <div class="toolbar-item">Help</div>
        </div>
        <div class="davinci-workspace">
            <div class="davinci-sidebar">
                <div class="workspace-tab active">Media</div>
                <div class="workspace-tab">Cut</div>
                <div class="workspace-tab">Edit</div>
                <div class="workspace-tab">Fusion</div>
                <div class="workspace-tab">Color</div>
                <div class="workspace-tab">Fairlight</div>
                <div class="workspace-tab">Deliver</div>
            </div>
            <div class="davinci-content">
                <div class="davinci-media-pool">
                    <h3>Media Pool</h3>
                    <div class="media-items">
                        <div class="media-item">Project 1.mp4</div>
                        <div class="media-item">Intro.mov</div>
                        <div class="media-item">Background.jpg</div>
                        <div class="media-item">Music.mp3</div>
                        <div class="media-item">Interview.mp4</div>
                    </div>
                </div>
                <div class="davinci-preview">
                    <div class="video-preview">
                        <div class="preview-placeholder">Video Preview</div>
                    </div>
                    <div class="timeline">
                        <div class="timeline-track video">Video Track 1</div>
                        <div class="timeline-track video">Video Track 2</div>
                        <div class="timeline-track audio">Audio Track 1</div>
                        <div class="timeline-track audio">Audio Track 2</div>
                    </div>
                </div>
            </div>
        </div>
        <style>
            .davinci-resolve {
                display: flex;
                flex-direction: column;
                height: 100%;
                background-color: #2a2a2a;
                color: #e0e0e0;
            }
            .davinci-toolbar {
                height: 30px;
                background-color: #1a1a1a;
                display: flex;
                align-items: center;
            }
            .toolbar-item {
                padding: 0 15px;
                height: 100%;
                display: flex;
                align-items: center;
                cursor: pointer;
            }
            .toolbar-item:hover {
                background-color: #3a3a3a;
            }
            .davinci-workspace {
                flex: 1;
                display: flex;
            }
            .davinci-sidebar {
                width: 80px;
                background-color: #1a1a1a;
                display: flex;
                flex-direction: column;
            }
            .workspace-tab {
                height: 80px;
                display: flex;
                justify-content: center;
                align-items: center;
                cursor: pointer;
                font-size: 12px;
                text-align: center;
                padding: 5px;
            }
            .workspace-tab.active {
                background-color: #3a3a3a;
                border-left: 3px solid #0094ff;
            }
            .workspace-tab:hover {
                background-color: #2a2a2a;
            }
            .davinci-content {
                flex: 1;
                display: flex;
                flex-direction: column;
            }
            .davinci-media-pool {
                height: 200px;
                border-bottom: 1px solid #3a3a3a;
                padding: 10px;
                overflow-y: auto;
            }
            .media-items {
                margin-top: 10px;
            }
            .media-item {
                padding: 5px 10px;
                cursor: pointer;
                border-radius: 3px;
            }
            .media-item:hover {
                background-color: #3a3a3a;
            }
            .davinci-preview {
                flex: 1;
                display: flex;
                flex-direction: column;
                padding: 10px;
            }
            .video-preview {
                height: 60%;
                background-color: #1a1a1a;
                display: flex;
                justify-content: center;
                align-items: center;
                margin-bottom: 10px;
            }
            .timeline {
                flex: 1;
                background-color: #1a1a1a;
                padding: 10px;
                display: flex;
                flex-direction: column;
                gap: 5px;
            }
            .timeline-track {
                height: 30px;
                background-color: #2a2a2a;
                padding: 5px 10px;
                border-radius: 3px;
            }
            .timeline-track.video {
                border-left: 3px solid #0094ff;
            }
            .timeline-track.audio {
                border-left: 3px solid #00ff94;
            }
        </style>
    `;
    
    const window = createWindow({
        title: applications.davinci.title,
        content: content,
        width: applications.davinci.width,
        height: applications.davinci.height
    });
    
    // Set up DaVinci functionality
    const davinciElement = window.element.querySelector('.davinci-resolve');
    
    // Handle workspace tab switching
    davinciElement.querySelectorAll('.workspace-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            davinciElement.querySelectorAll('.workspace-tab').forEach(t => {
                t.classList.remove('active');
            });
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Alert workspace change
            alert(`Switched to ${this.textContent} workspace`);
        });
    });
    
    // Handle media item clicking
    davinciElement.querySelectorAll('.media-item').forEach(item => {
        item.addEventListener('click', function() {
            alert(`Selected media: ${this.textContent}`);
        });
        
        // Add drag and drop simulation
        item.setAttribute('draggable', 'true');
        item.addEventListener('dragstart', function(e) {
            e.dataTransfer.setData('text/plain', this.textContent);
        });
    });
    
    // Handle timeline tracks
    davinciElement.querySelector('.timeline').addEventListener('dragover', function(e) {
        e.preventDefault();
    });
    
    davinciElement.querySelector('.timeline').addEventListener('drop', function(e) {
        e.preventDefault();
        const mediaName = e.dataTransfer.getData('text/plain');
        alert(`Added ${mediaName} to timeline`);
    });
}

// Open DaVinci Resolve Studio
function openDavinciResolveStudio() {
    // Create similar UI to regular DaVinci but with Studio features
    const content = document.createElement('div');
    content.className = 'window-content davinci-resolve studio';
    content.innerHTML = `
        <div class="davinci-toolbar">
            <div class="toolbar-item">File</div>
            <div class="toolbar-item">Edit</div>
            <div class="toolbar-item">Clip</div>
            <div class="toolbar-item">Timeline</div>
            <div class="toolbar-item">Render</div>
            <div class="toolbar-item">View</div>
            <div class="toolbar-item">Workspace</div>
            <div class="toolbar-item">Help</div>
        </div>
        <div class="davinci-workspace">
            <div class="davinci-sidebar">
                <div class="workspace-tab active">Media</div>
                <div class="workspace-tab">Cut</div>
                <div class="workspace-tab">Edit</div>
                <div class="workspace-tab">Fusion</div>
                <div class="workspace-tab">Color</div>
                <div class="workspace-tab">Fairlight</div>
                <div class="workspace-tab">Deliver</div>
            </div>
            <div class="davinci-content">
                <div class="studio-banner">
                    <div class="studio-label">STUDIO VERSION</div>
                    <div class="studio-features">
                        <span>Neural Engine</span> | 
                        <span>Magic Mask</span> | 
                        <span>HDR Grading</span> | 
                        <span>4K+ Resolution</span>
                    </div>
                </div>
                <div class="davinci-media-pool">
                    <h3>Media Pool</h3>
                    <div class="media-items">
                        <div class="media-item">Project 1.mp4</div>
                        <div class="media-item">8K Footage.mp4</div>
                        <div class="media-item">Background.jpg</div>
                        <div class="media-item">Music.mp3</div>
                        <div class="media-item">HDR Interview.mp4</div>
                    </div>
                </div>
                <div class="davinci-preview">
                    <div class="video-preview">
                        <div class="preview-placeholder">Video Preview (HDR Enabled)</div>
                    </div>
                    <div class="timeline">
                        <div class="timeline-track video">Video Track 1</div>
                        <div class="timeline-track video">Video Track 2</div>
                        <div class="timeline-track video">Video Track 3</div>
                        <div class="timeline-track audio">Audio Track 1</div>
                        <div class="timeline-track audio">Audio Track 2</div>
                        <div class="timeline-track audio">Audio Track 3</div>
                    </div>
                </div>
            </div>
        </div>
        <style>
            .davinci-resolve {
                display: flex;
                flex-direction: column;
                height: 100%;
                background-color: #2a2a2a;
                color: #e0e0e0;
            }
            .davinci-toolbar {
                height: 30px;
                background-color: #1a1a1a;
                display: flex;
                align-items: center;
            }
            .toolbar-item {
                padding: 0 15px;
                height: 100%;
                display: flex;
                align-items: center;
                cursor: pointer;
            }
            .toolbar-item:hover {
                background-color: #3a3a3a;
            }
            .davinci-workspace {
                flex: 1;
                display: flex;
            }
            .davinci-sidebar {
                width: 80px;
                background-color: #1a1a1a;
                display: flex;
                flex-direction: column;
            }
            .workspace-tab {
                height: 80px;
                display: flex;
                justify-content: center;
                align-items: center;
                cursor: pointer;
                font-size: 12px;
                text-align: center;
                padding: 5px;
            }
            .workspace-tab.active {
                background-color: #3a3a3a;
                border-left: 3px solid #ff9400;
            }
            .workspace-tab:hover {
                background-color: #2a2a2a;
            }
            .davinci-content {
                flex: 1;
                display: flex;
                flex-direction: column;
            }
            .studio-banner {
                background: linear-gradient(90deg, #8c00ff, #ff9400);
                padding: 10px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .studio-label {
                font-weight: bold;
                letter-spacing: 2px;
            }
            .studio-features {
                font-size: 12px;
            }
            .davinci-media-pool {
                height: 180px;
                border-bottom: 1px solid #3a3a3a;
                padding: 10px;
                overflow-y: auto;
            }
            .media-items {
                margin-top: 10px;
            }
            .media-item {
                padding: 5px 10px;
                cursor: pointer;
                border-radius: 3px;
            }
            .media-item:hover {
                background-color: #3a3a3a;
            }
            .davinci-preview {
                flex: 1;
                display: flex;
                flex-direction: column;
                padding: 10px;
            }
            .video-preview {
                height: 60%;
                background-color: #1a1a1a;
                display: flex;
                justify-content: center;
                align-items: center;
                margin-bottom: 10px;
            }
            .timeline {
                flex: 1;
                background-color: #1a1a1a;
                padding: 10px;
                display: flex;
                flex-direction: column;
                gap: 5px;
            }
            .timeline-track {
                height: 30px;
                background-color: #2a2a2a;
                padding: 5px 10px;
                border-radius: 3px;
            }
            .timeline-track.video {
                border-left: 3px solid #ff9400;
            }
            .timeline-track.audio {
                border-left: 3px solid #ffff00;
            }
        </style>
    `;
    
    const window = createWindow({
        title: applications['davinci-studio'].title,
        content: content,
        width: applications['davinci-studio'].width,
        height: applications['davinci-studio'].height
    });
    
    // Set up DaVinci Studio functionality
    const davinciElement = window.element.querySelector('.davinci-resolve');
    
    // Handle workspace tab switching
    davinciElement.querySelectorAll('.workspace-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            davinciElement.querySelectorAll('.workspace-tab').forEach(t => {
                t.classList.remove('active');
            });
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Alert workspace change
            alert(`Switched to ${this.textContent} workspace (Studio Version)`);
        });
    });
    
    // Handle media item clicking
    davinciElement.querySelectorAll('.media-item').forEach(item => {
        item.addEventListener('click', function() {
            alert(`Selected media: ${this.textContent} (Studio Quality)`);
        });
        
        // Add drag and drop simulation
        item.setAttribute('draggable', 'true');
        item.addEventListener('dragstart', function(e) {
            e.dataTransfer.setData('text/plain', this.textContent);
        });
    });
    
    // Handle timeline tracks
    davinciElement.querySelector('.timeline').addEventListener('dragover', function(e) {
        e.preventDefault();
    });
    
    davinciElement.querySelector('.timeline').addEventListener('drop', function(e) {
        e.preventDefault();
        const mediaName = e.dataTransfer.getData('text/plain');
        alert(`Added ${mediaName} to timeline with Studio effects`);
    });
}
