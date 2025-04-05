// Window Manager - Handles the creation, movement, and management of windows

// Track all open windows
const openWindows = [];
let activeWindow = null;
let zIndexCounter = 100;

// Create a new window
function createWindow(options) {
    const { title, content, width, height, x, y, icon, resizable } = options;
    
    // Create window element
    const windowElement = document.createElement('div');
    windowElement.className = 'window';
    windowElement.style.width = width || '600px';
    windowElement.style.height = height || '400px';
    windowElement.style.left = x || `${(window.innerWidth - parseInt(width || 600)) / 2}px`;
    windowElement.style.top = y || `${(window.innerHeight - parseInt(height || 400)) / 2}px`;
    windowElement.style.zIndex = zIndexCounter++;
    
    // Create title bar
    const titleBar = document.createElement('div');
    titleBar.className = 'window-titlebar';
    
    // Create title
    const titleElement = document.createElement('div');
    titleElement.className = 'window-title';
    titleElement.textContent = title;
    
    // Create window controls
    const controlsElement = document.createElement('div');
    controlsElement.className = 'window-controls';
    
    const minimizeBtn = document.createElement('div');
    minimizeBtn.className = 'window-control minimize';
    minimizeBtn.innerHTML = '─';
    
    const maximizeBtn = document.createElement('div');
    maximizeBtn.className = 'window-control maximize';
    maximizeBtn.innerHTML = '□';
    
    const closeBtn = document.createElement('div');
    closeBtn.className = 'window-control close';
    closeBtn.innerHTML = '×';
    
    // Add controls to title bar
    controlsElement.appendChild(minimizeBtn);
    controlsElement.appendChild(maximizeBtn);
    controlsElement.appendChild(closeBtn);
    
    titleBar.appendChild(titleElement);
    titleBar.appendChild(controlsElement);
    
    // Create content container
    const contentContainer = document.createElement('div');
    contentContainer.className = 'window-content';
    
    // Set window content
    if (typeof content === 'string') {
        contentContainer.innerHTML = content;
    } else if (content instanceof HTMLElement) {
        contentContainer.appendChild(content);
    }
    
    // Assemble window
    windowElement.appendChild(titleBar);
    windowElement.appendChild(contentContainer);
    
    // Add window to the document
    document.getElementById('windows-container').appendChild(windowElement);
    
    // Add window to tracking array
    const windowObj = {
        id: Date.now().toString(),
        element: windowElement,
        title,
        isMinimized: false,
        isMaximized: false
    };
    
    openWindows.push(windowObj);
    
    // Setup window event listeners
    setupWindowEventListeners(windowObj);
    
    // Activate this window
    activateWindow(windowObj);
    
    return windowObj;
}

// Set up event listeners for a window
function setupWindowEventListeners(windowObj) {
    const windowElement = windowObj.element;
    const titleBar = windowElement.querySelector('.window-titlebar');
    const minimizeBtn = windowElement.querySelector('.window-control.minimize');
    const maximizeBtn = windowElement.querySelector('.window-control.maximize');
    const closeBtn = windowElement.querySelector('.window-control.close');
    
    // Click on window to activate
    windowElement.addEventListener('mousedown', () => {
        activateWindow(windowObj);
    });
    
    // Title bar drag to move window
    titleBar.addEventListener('mousedown', (e) => {
        if (windowObj.isMaximized) return;
        
        // Prevent text selection during drag
        e.preventDefault();
        
        // Get initial mouse position and window position
        const initialMouseX = e.clientX;
        const initialMouseY = e.clientY;
        const initialWindowX = windowElement.offsetLeft;
        const initialWindowY = windowElement.offsetTop;
        
        // Define dragging function
        function handleDrag(moveEvent) {
            const dx = moveEvent.clientX - initialMouseX;
            const dy = moveEvent.clientY - initialMouseY;
            
            windowElement.style.left = `${initialWindowX + dx}px`;
            windowElement.style.top = `${initialWindowY + dy}px`;
        }
        
        // Define drag end function
        function handleDragEnd() {
            document.removeEventListener('mousemove', handleDrag);
            document.removeEventListener('mouseup', handleDragEnd);
        }
        
        // Add drag and drag end event listeners
        document.addEventListener('mousemove', handleDrag);
        document.addEventListener('mouseup', handleDragEnd);
    });
    
    // Minimize button
    minimizeBtn.addEventListener('click', () => {
        minimizeWindow(windowObj);
    });
    
    // Maximize button
    maximizeBtn.addEventListener('click', () => {
        toggleMaximizeWindow(windowObj);
    });
    
    // Close button
    closeBtn.addEventListener('click', () => {
        closeWindow(windowObj);
    });
    
    // Double click on title bar to maximize/restore
    titleBar.addEventListener('dblclick', () => {
        toggleMaximizeWindow(windowObj);
    });
}

// Activate a window (bring to front)
function activateWindow(windowObj) {
    // Deactivate current active window
    if (activeWindow) {
        activeWindow.element.style.zIndex = 100;
    }
    
    // Activate new window
    windowObj.element.style.zIndex = zIndexCounter++;
    activeWindow = windowObj;
    
    // Update taskbar
    updateTaskbar();
}

// Minimize a window
function minimizeWindow(windowObj) {
    windowObj.isMinimized = true;
    windowObj.element.classList.add('minimized');
    
    // Update taskbar
    updateTaskbar();
}

// Restore a minimized window
function restoreWindow(windowObj) {
    windowObj.isMinimized = false;
    windowObj.element.classList.remove('minimized');
    activateWindow(windowObj);
}

// Toggle maximize/restore window
function toggleMaximizeWindow(windowObj) {
    if (windowObj.isMaximized) {
        // Restore window
        windowObj.isMaximized = false;
        windowObj.element.classList.remove('maximized');
    } else {
        // Maximize window
        windowObj.isMaximized = true;
        windowObj.element.classList.add('maximized');
    }
}

// Close a window
function closeWindow(windowObj) {
    // Remove window from document
    windowObj.element.remove();
    
    // Remove window from tracking array
    const index = openWindows.findIndex(w => w.id === windowObj.id);
    if (index !== -1) {
        openWindows.splice(index, 1);
    }
    
    // Update active window
    if (activeWindow === windowObj) {
        activeWindow = openWindows.length > 0 ? openWindows[openWindows.length - 1] : null;
        if (activeWindow) {
            activateWindow(activeWindow);
        }
    }
    
    // Update taskbar
    updateTaskbar();
}

// Find window by title
function findWindowByTitle(title) {
    return openWindows.find(w => w.title === title);
}

// Update taskbar with current windows
function updateTaskbar() {
    const taskbarApps = document.getElementById('taskbar-apps');
    taskbarApps.innerHTML = '';
    
    openWindows.forEach(windowObj => {
        const taskbarAppElement = document.createElement('div');
        taskbarAppElement.className = 'taskbar-app';
        
        if (activeWindow === windowObj && !windowObj.isMinimized) {
            taskbarAppElement.classList.add('active');
        }
        
        // Add first letter of title as icon
        taskbarAppElement.textContent = windowObj.title.charAt(0);
        
        // Handle click on taskbar app
        taskbarAppElement.addEventListener('click', () => {
            if (windowObj.isMinimized) {
                restoreWindow(windowObj);
            } else if (activeWindow === windowObj) {
                minimizeWindow(windowObj);
            } else {
                activateWindow(windowObj);
            }
        });
        
        taskbarApps.appendChild(taskbarAppElement);
    });
}
