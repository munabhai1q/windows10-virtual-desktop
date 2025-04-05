// Start Menu functionality

// Initialize start menu
function initStartMenu() {
    const startMenu = document.getElementById('start-menu');
    const startButton = document.getElementById('start-button');
    
    // Toggle start menu when start button is clicked
    startButton.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleStartMenu();
    });
    
    // Close start menu when clicking outside of it
    document.addEventListener('click', function(e) {
        if (startMenu.style.display !== 'none' && 
            !startMenu.contains(e.target) && 
            e.target !== startButton) {
            startMenu.style.display = 'none';
        }
    });
    
    // Populate most used apps
    populateMostUsedApps();
    
    // Initialize apps list
    initializeAppsList();
}

// Populate most used apps section
function populateMostUsedApps() {
    const mostUsedAppsContainer = document.querySelector('.most-used-apps');
    const mostUsedApps = ['explorer', 'chrome', 'notepad'];
    
    mostUsedAppsContainer.innerHTML = '';
    
    mostUsedApps.forEach(appName => {
        const app = applications[appName];
        if (app) {
            const appElement = document.createElement('div');
            appElement.className = 'most-used-app';
            appElement.dataset.app = appName;
            
            appElement.innerHTML = `
                <div class="most-used-app-icon">${app.title.charAt(0)}</div>
                <div class="most-used-app-name">${app.title}</div>
            `;
            
            appElement.addEventListener('click', function() {
                openApp(appName);
                toggleStartMenu();
            });
            
            mostUsedAppsContainer.appendChild(appElement);
        }
    });
}

// Initialize the apps list in the start menu
function initializeAppsList() {
    const appsContainer = document.querySelector('.start-apps');
    
    // Clear existing apps
    appsContainer.innerHTML = '';
    
    // Add all applications
    Object.keys(applications).forEach(appName => {
        const app = applications[appName];
        
        const appElement = document.createElement('div');
        appElement.className = 'start-app';
        appElement.dataset.app = appName;
        
        appElement.innerHTML = `
            <div class="start-app-icon">${app.title.charAt(0)}</div>
            <div class="start-app-name">${app.title}</div>
        `;
        
        appElement.addEventListener('click', function() {
            openApp(appName);
            toggleStartMenu();
        });
        
        appsContainer.appendChild(appElement);
    });
}

// Toggle the start menu visibility
function toggleStartMenu() {
    const startMenu = document.getElementById('start-menu');
    startMenu.style.display = startMenu.style.display === 'none' || startMenu.style.display === '' ? 'flex' : 'none';
}

// Update the apps list (called when new apps are installed)
function updateAppsList(newApps) {
    // Reinitialize the apps list
    initializeAppsList();
    
    // Potentially update most used apps
    populateMostUsedApps();
}

// Initialize start menu when the page loads
document.addEventListener('DOMContentLoaded', initStartMenu);
