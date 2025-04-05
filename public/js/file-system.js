// File System Simulation

// In-memory file system structure
const fileSystem = {
    'C:': {
        'Windows': {
            'System32': {},
            'Program Files': {},
            'Program Files (x86)': {}
        },
        'Users': {
            'User': {
                'Desktop': {},
                'Documents': {},
                'Downloads': {},
                'Pictures': {},
                'Music': {},
                'Videos': {}
            }
        }
    }
};

// Generate random system files to populate the simulation
function populateFileSystem() {
    // Windows system files
    fileSystem['C:']['Windows']['System32'] = {
        'ntoskrnl.exe': { type: 'exe', size: '8 MB' },
        'hal.dll': { type: 'dll', size: '1 MB' },
        'kernel32.dll': { type: 'dll', size: '3 MB' },
        'user32.dll': { type: 'dll', size: '2 MB' },
        'explorer.exe': { type: 'exe', size: '4 MB' }
    };
    
    // Program Files
    fileSystem['C:']['Program Files'] = {
        'Windows Defender': {
            'MSASCui.exe': { type: 'exe', size: '5 MB' }
        },
        'Internet Explorer': {
            'iexplore.exe': { type: 'exe', size: '2 MB' }
        },
        'Microsoft Office': {
            'Word.exe': { type: 'exe', size: '15 MB' },
            'Excel.exe': { type: 'exe', size: '14 MB' },
            'PowerPoint.exe': { type: 'exe', size: '12 MB' }
        }
    };
    
    // Some user files
    fileSystem['C:']['Users']['User']['Documents'] = {
        'resume.docx': { type: 'docx', size: '2 MB' },
        'budget.xlsx': { type: 'xlsx', size: '1 MB' },
        'presentation.pptx': { type: 'pptx', size: '5 MB' }
    };
    
    fileSystem['C:']['Users']['User']['Pictures'] = {
        'vacation.jpg': { type: 'jpg', size: '3 MB' },
        'family.jpg': { type: 'jpg', size: '2 MB' },
        'screenshot.png': { type: 'png', size: '1 MB' }
    };
    
    fileSystem['C:']['Users']['User']['Desktop'] = {
        'My Computer.lnk': { type: 'lnk', size: '1 KB' },
        'Recycle Bin.lnk': { type: 'lnk', size: '1 KB' },
        'Microsoft Edge.lnk': { type: 'lnk', size: '1 KB' },
        'Project Notes.txt': { type: 'txt', size: '10 KB' }
    };
}

// Initialize file system
function initFileSystem() {
    populateFileSystem();
    
    // Add file system related event listeners
    document.addEventListener('DOMContentLoaded', function() {
        // Any additional initialization for file system
    });
}

// Get files in a specific directory
function getFilesInDirectory(path) {
    // Parse path and navigate through fileSystem
    const pathParts = path.split('/').filter(Boolean);
    let currentDir = fileSystem;
    
    for (const part of pathParts) {
        if (currentDir[part]) {
            currentDir = currentDir[part];
        } else {
            return null; // Directory not found
        }
    }
    
    return currentDir;
}

// Create a new file
function createFile(path, name, content = '') {
    const dirPath = path.substring(0, path.lastIndexOf('/'));
    const directory = getFilesInDirectory(dirPath);
    
    if (directory) {
        directory[name] = {
            type: name.split('.').pop() || 'txt',
            size: `${content.length} B`,
            content: content
        };
        
        // Send file to server
        if (socket && socket.readyState === 1) { // WebSocket.OPEN is 1
            socket.send(JSON.stringify({
                type: 'saveFile',
                data: {
                    path: `${dirPath}/${name}`,
                    content: content
                }
            }));
        }
        
        return true;
    }
    
    return false;
}

// Read a file
function readFile(path) {
    const fileName = path.split('/').pop();
    const dirPath = path.substring(0, path.lastIndexOf('/'));
    const directory = getFilesInDirectory(dirPath);
    
    if (directory && directory[fileName]) {
        return directory[fileName].content || '';
    }
    
    return null;
}

// Delete a file
function deleteFile(path) {
    const fileName = path.split('/').pop();
    const dirPath = path.substring(0, path.lastIndexOf('/'));
    const directory = getFilesInDirectory(dirPath);
    
    if (directory && directory[fileName]) {
        delete directory[fileName];
        return true;
    }
    
    return false;
}

// Create a new directory
function createDirectory(path, name) {
    const directory = getFilesInDirectory(path);
    
    if (directory) {
        directory[name] = {};
        return true;
    }
    
    return false;
}

// Format file size for display
function formatFileSize(size) {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let value = parseInt(size);
    let unitIndex = 0;
    
    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024;
        unitIndex++;
    }
    
    return `${value.toFixed(1)} ${units[unitIndex]}`;
}

// Initialize file system when the script loads
initFileSystem();
