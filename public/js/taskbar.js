// Taskbar functionality

// Initialize taskbar
function initTaskbar() {
    // Update the time display every minute
    updateTaskbarTime();
    setInterval(updateTaskbarTime, 60000);
    
    // Set up taskbar events
    document.getElementById('start-button').addEventListener('click', toggleStartMenu);
    
    // Search functionality
    const searchBar = document.getElementById('search-bar').querySelector('input');
    searchBar.addEventListener('focus', function() {
        // Show search results when search bar is focused
        // showSearchResults();
    });
    
    searchBar.addEventListener('blur', function() {
        // Hide search results when search bar loses focus
        // hideSearchResults();
    });
    
    searchBar.addEventListener('input', function() {
        // Filter search results based on input
        // filterSearchResults(this.value);
    });
}

// Update taskbar time display
function updateTaskbarTime() {
    const now = new Date();
    const timeElement = document.getElementById('time');
    const dateElement = document.getElementById('date');
    
    timeElement.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    dateElement.textContent = now.toLocaleDateString();
}

// Add app to taskbar
function addAppToTaskbar(appName) {
    const taskbarApps = document.getElementById('taskbar-apps');
    
    // Check if app already exists in taskbar
    const existingApp = Array.from(taskbarApps.children).find(app => app.dataset.app === appName);
    if (existingApp) {
        existingApp.classList.add('active');
        return;
    }
    
    // Create new taskbar app button
    const appButton = document.createElement('div');
    appButton.className = 'taskbar-app active';
    appButton.dataset.app = appName;
    
    // Add app icon
    const app = applications[appName];
    if (app) {
        appButton.textContent = app.title.charAt(0);
        // You could also use an SVG icon here
    } else {
        appButton.textContent = appName.charAt(0).toUpperCase();
    }
    
    // Add click handler to toggle app window
    appButton.addEventListener('click', function() {
        toggleAppWindow(appName);
    });
    
    taskbarApps.appendChild(appButton);
}

// Remove app from taskbar
function removeAppFromTaskbar(appName) {
    const taskbarApps = document.getElementById('taskbar-apps');
    const appButton = Array.from(taskbarApps.children).find(app => app.dataset.app === appName);
    
    if (appButton) {
        taskbarApps.removeChild(appButton);
    }
}

// Set app active state in taskbar
function setAppActiveInTaskbar(appName, isActive) {
    const taskbarApps = document.getElementById('taskbar-apps');
    const appButton = Array.from(taskbarApps.children).find(app => app.dataset.app === appName);
    
    if (appButton) {
        if (isActive) {
            appButton.classList.add('active');
        } else {
            appButton.classList.remove('active');
        }
    }
}

// Toggle app window from taskbar
function toggleAppWindow(appName) {
    // Find the window for this app
    const app = applications[appName];
    if (!app) return;
    
    const window = findWindowByTitle(app.title);
    
    if (window) {
        if (window.isMinimized) {
            // Restore minimized window
            restoreWindow(window);
        } else if (window === activeWindow) {
            // Minimize active window
            minimizeWindow(window);
        } else {
            // Activate window
            activateWindow(window);
        }
    } else {
        // Open new app window
        openApp(appName);
    }
}

// Initialize taskbar when the page loads
document.addEventListener('DOMContentLoaded', initTaskbar);
