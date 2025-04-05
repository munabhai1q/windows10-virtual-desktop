// Context Menu Functionality

// Initialize context menu
function initContextMenu() {
    const contextMenu = document.getElementById('context-menu');
    
    // Close context menu on any click outside of it
    document.addEventListener('click', function() {
        hideContextMenu();
    });
    
    // Set up context menu item actions
    contextMenu.querySelectorAll('li[data-action]').forEach(item => {
        item.addEventListener('click', function(e) {
            e.stopPropagation();
            const action = this.dataset.action;
            handleContextMenuAction(action);
            hideContextMenu();
        });
    });
    
    // Prevent default context menu on desktop
    document.getElementById('desktop').addEventListener('contextmenu', function(e) {
        e.preventDefault();
        showContextMenu(e.clientX, e.clientY);
    });
    
    // Add context menu for desktop icons
    document.querySelectorAll('.desktop-icon').forEach(icon => {
        icon.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Select the icon that was right-clicked
            selectDesktopIcon(this);
            
            // Show icon-specific context menu
            showIconContextMenu(e.clientX, e.clientY, this.dataset.name);
        });
    });
}

// Show context menu at specified position
function showContextMenu(x, y) {
    const contextMenu = document.getElementById('context-menu');
    
    // Position the menu
    contextMenu.style.left = `${x}px`;
    contextMenu.style.top = `${y}px`;
    
    // Show the menu
    contextMenu.style.display = 'block';
    
    // Adjust position if menu goes off screen
    const menuRect = contextMenu.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    if (menuRect.right > windowWidth) {
        contextMenu.style.left = `${windowWidth - menuRect.width}px`;
    }
    
    if (menuRect.bottom > windowHeight) {
        contextMenu.style.top = `${windowHeight - menuRect.height}px`;
    }
}

// Show icon-specific context menu
function showIconContextMenu(x, y, iconName) {
    const contextMenu = document.getElementById('context-menu');
    
    // Update menu items based on icon type
    if (iconName === 'this-pc') {
        // Customize menu for This PC icon
        contextMenu.innerHTML = `
            <ul>
                <li data-action="open">Open</li>
                <li class="divider"></li>
                <li data-action="properties">Properties</li>
            </ul>
        `;
    } else if (iconName === 'recycle-bin') {
        // Customize menu for Recycle Bin icon
        contextMenu.innerHTML = `
            <ul>
                <li data-action="open">Open</li>
                <li data-action="empty-recycle-bin">Empty Recycle Bin</li>
                <li class="divider"></li>
                <li data-action="properties">Properties</li>
            </ul>
        `;
    } else {
        // Default icon menu
        contextMenu.innerHTML = `
            <ul>
                <li data-action="open">Open</li>
                <li data-action="delete">Delete</li>
                <li data-action="rename">Rename</li>
                <li class="divider"></li>
                <li data-action="properties">Properties</li>
            </ul>
        `;
    }
    
    // Re-add event listeners for new menu items
    contextMenu.querySelectorAll('li[data-action]').forEach(item => {
        item.addEventListener('click', function(e) {
            e.stopPropagation();
            const action = this.dataset.action;
            handleContextMenuAction(action, iconName);
            hideContextMenu();
        });
    });
    
    // Show the menu
    showContextMenu(x, y);
}

// Hide context menu
function hideContextMenu() {
    document.getElementById('context-menu').style.display = 'none';
}

// Handle context menu actions
function handleContextMenuAction(action, iconName) {
    switch (action) {
        case 'view':
            // Change desktop view
            break;
            
        case 'sort':
            // Sort desktop icons
            break;
            
        case 'refresh':
            // Refresh desktop
            location.reload();
            break;
            
        case 'new':
            // Create new item menu
            showNewItemMenu();
            break;
            
        case 'display':
            // Open display settings
            openApp('settings');
            break;
            
        case 'personalize':
            // Open personalization settings
            openApp('settings');
            break;
            
        case 'open':
            // Open the selected icon
            if (iconName === 'this-pc') {
                openApp('explorer');
            } else if (iconName === 'file-explorer') {
                openApp('explorer');
            } else if (iconName === 'edge') {
                openApp('chrome');
            }
            break;
            
        case 'delete':
            // Delete the selected icon
            alert('Delete functionality is simulated');
            break;
            
        case 'rename':
            // Rename the selected icon
            renameSelectedIcon();
            break;
            
        case 'properties':
            // Show properties of the selected icon
            showIconProperties(iconName);
            break;
            
        case 'empty-recycle-bin':
            // Empty recycle bin
            alert('Recycle Bin emptied (simulated)');
            break;
    }
}

// Show new item menu
function showNewItemMenu() {
    alert('New item functionality is simulated');
}

// Rename selected icon
function renameSelectedIcon() {
    const selectedIcon = document.querySelector('.desktop-icon.selected');
    if (selectedIcon) {
        const nameElement = selectedIcon.querySelector('.icon-text');
        const currentName = nameElement.textContent;
        
        const newName = prompt('Enter new name:', currentName);
        if (newName && newName !== currentName) {
            nameElement.textContent = newName;
        }
    }
}

// Show properties of an icon
function showIconProperties(iconName) {
    let message = '';
    
    if (iconName === 'this-pc') {
        message = 'This PC Properties:\nSystem: Windows 10\nProcessor: Intel Core i9-10900K\nRAM: 64 GB\nGPU: NVIDIA GeForce GTX 1080\nStorage: 1 TB SSD';
    } else if (iconName === 'recycle-bin') {
        message = 'Recycle Bin Properties:\nContains 0 items\nLocation: Desktop';
    } else {
        message = `Properties for ${iconName}:\nType: Shortcut\nLocation: Desktop`;
    }
    
    alert(message);
}

// Initialize context menu when page loads
document.addEventListener('DOMContentLoaded', initContextMenu);
