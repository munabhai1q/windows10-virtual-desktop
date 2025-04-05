const express = require('express');
const http = require('http');
const path = require('path');
const WebSocket = require('ws');
const storage = require('./server/storage');
const { pool } = require('./server/db');

const app = express();
const port = 5000;
const httpServer = http.createServer(app);

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Route to serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Setup WebSocket server
const wss = new WebSocket.Server({ server: httpServer, path: '/ws' });

// Session data store
const sessions = new Map();

// WebSocket connection handling
wss.on('connection', async (ws) => {
  const sessionId = Date.now().toString();
  
  try {
    // Create a new session in the database
    await storage.createSession({
      sessionId,
      userId: null, // No user login for now
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      data: {
        createdAt: new Date(),
        files: {},
        apps: {
          running: []
        }
      }
    });
    
    // Store the session in memory too for quick access
    sessions.set(sessionId, {
      id: sessionId,
      createdAt: new Date(),
      files: {},
      apps: {
        running: []
      }
    });
  } catch (error) {
    console.error('Error creating session:', error);
  }
  
  // Send session ID to client
  ws.send(JSON.stringify({
    type: 'session',
    data: { sessionId, specs: getSystemSpecs() }
  }));
  
  // Handle messages from client
  ws.on('message', async (message) => {
    try {
      const parsedMessage = JSON.parse(message);
      
      switch (parsedMessage.type) {
        case 'getApps':
          await sendInstalledApps(ws, sessionId);
          break;
        case 'installApp':
          await installApp(ws, sessionId, parsedMessage.data);
          break;
        case 'uninstallApp':
          await uninstallApp(ws, sessionId, parsedMessage.data);
          break;
        case 'saveFile':
          await saveFile(ws, sessionId, parsedMessage.data);
          break;
        case 'getFiles':
          await sendFiles(ws, sessionId, parsedMessage.data?.path);
          break;
        case 'getFileContent':
          await getFileContent(ws, sessionId, parsedMessage.data?.path);
          break;
        case 'createDirectory':
          await createDirectory(ws, sessionId, parsedMessage.data);
          break;
        case 'deleteFile':
          await deleteFile(ws, sessionId, parsedMessage.data?.path);
          break;
        case 'getSystemSpecs':
          sendSystemSpecs(ws);
          break;
        case 'getSettings':
          await getSettings(ws, sessionId, parsedMessage.data?.category);
          break;
        case 'updateSetting':
          await updateSetting(ws, sessionId, parsedMessage.data);
          break;
        default:
          console.log(`Unknown message type: ${parsedMessage.type}`);
      }
    } catch (e) {
      console.error('Error processing message:', e);
      // Send error to client
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'error',
          data: { message: 'Error processing request', details: e.message }
        }));
      }
    }
  });
  
  // Handle disconnection
  ws.on('close', () => {
    console.log(`Session ${sessionId} disconnected`);
    // Keep the session data for a while before removing it
    setTimeout(() => {
      sessions.delete(sessionId);
    }, 30 * 60 * 1000); // 30 minutes
  });
});

// System specifications (simulated high-end PC)
function getSystemSpecs() {
  return {
    os: 'Windows 10 Pro',
    ram: '64 GB',
    cpu: 'Intel Core i9-10900K',
    gpu: 'NVIDIA GeForce GTX 1080',
    storage: '1 TB SSD'
  };
}

// Send system specs to client
function sendSystemSpecs(ws) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'systemSpecs',
      data: getSystemSpecs()
    }));
  }
}

// Send installed applications to client
async function sendInstalledApps(ws, sessionId) {
  try {
    // Get installed apps from database
    const installedApps = await storage.getInstalledApps();
    
    if (ws.readyState === WebSocket.OPEN) {
      const appData = JSON.stringify({
        type: 'apps',
        data: { installed: installedApps.map(app => ({
          name: app.name,
          displayName: app.display_name,
          icon: app.icon,
          appType: app.app_type,
          publisher: app.publisher,
          version: app.version,
          size: app.size,
          description: app.description
        })) }
      });
      console.log('Sending app data with length:', installedApps.length);
      ws.send(appData);
    }
  } catch (error) {
    console.error('Error fetching and sending app data:', error);
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'error',
        data: { message: 'Error fetching applications', details: error.message }
      }));
    }
  }
}

// Install new application
async function installApp(ws, sessionId, appData) {
  try {
    // Install app in database
    const app = await storage.installApp({
      name: appData.name,
      displayName: appData.displayName || appData.name,
      icon: appData.icon || 'default.svg',
      appType: appData.appType || 'application',
      publisher: appData.publisher || 'Microsoft',
      description: appData.description || ''
    });
    
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'appInstalled',
        data: {
          name: app.name,
          displayName: app.display_name,
          success: true
        }
      }));
    }
  } catch (error) {
    console.error('Error installing app:', error);
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'error',
        data: { message: 'Error installing application', details: error.message }
      }));
    }
  }
}

// Uninstall application
async function uninstallApp(ws, sessionId, appData) {
  try {
    // Uninstall app in database
    const result = await storage.uninstallApp(appData.name);
    
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'appUninstalled',
        data: {
          name: appData.name,
          success: result.length > 0
        }
      }));
    }
  } catch (error) {
    console.error('Error uninstalling app:', error);
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'error',
        data: { message: 'Error uninstalling application', details: error.message }
      }));
    }
  }
}

// Save file to file system
async function saveFile(ws, sessionId, fileData) {
  try {
    // Save file to database
    const file = await storage.saveFile({
      path: fileData.path,
      name: path.basename(fileData.path),
      type: 'file',
      content: fileData.content,
      parent: path.dirname(fileData.path),
      size: fileData.content ? fileData.content.length : 0
    });
    
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'fileSaved',
        data: { 
          path: file.path,
          name: file.name,
          success: true 
        }
      }));
    }
  } catch (error) {
    console.error('Error saving file:', error);
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'error',
        data: { message: 'Error saving file', details: error.message }
      }));
    }
  }
}

// Get all files in a directory
async function sendFiles(ws, sessionId, directoryPath = 'C:/Users/User/Desktop') {
  try {
    // Get files from database
    const files = await storage.getFiles(directoryPath);
    
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'files',
        data: { 
          path: directoryPath,
          files: files.map(file => ({
            path: file.path,
            name: file.name,
            type: file.type,
            size: file.size,
            isSystem: file.is_system,
            isHidden: file.is_hidden,
            metadata: file.metadata,
            modifiedAt: file.modified_at
          }))
        }
      }));
    }
  } catch (error) {
    console.error('Error fetching files:', error);
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'error',
        data: { message: 'Error fetching files', details: error.message }
      }));
    }
  }
}

// Get content of a specific file
async function getFileContent(ws, sessionId, filePath) {
  try {
    // Get file from database
    const file = await storage.getFileByPath(filePath);
    
    if (file && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'fileContent',
        data: { 
          path: file.path,
          name: file.name,
          content: file.content,
          type: file.type,
          size: file.size
        }
      }));
    } else if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'error',
        data: { message: 'File not found', details: `File at path ${filePath} does not exist` }
      }));
    }
  } catch (error) {
    console.error('Error fetching file content:', error);
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'error',
        data: { message: 'Error fetching file content', details: error.message }
      }));
    }
  }
}

// Create a new directory
async function createDirectory(ws, sessionId, dirData) {
  try {
    // Create directory in database
    const dir = await storage.createDirectory({
      path: dirData.path,
      name: path.basename(dirData.path),
      parent: path.dirname(dirData.path)
    });
    
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'directoryCreated',
        data: { 
          path: dir.path,
          name: dir.name,
          success: true 
        }
      }));
    }
  } catch (error) {
    console.error('Error creating directory:', error);
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'error',
        data: { message: 'Error creating directory', details: error.message }
      }));
    }
  }
}

// Delete a file or directory
async function deleteFile(ws, sessionId, filePath) {
  try {
    // Delete file from database
    const result = await storage.deleteFile(filePath);
    
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'fileDeleted',
        data: { 
          path: filePath,
          success: result.length > 0
        }
      }));
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'error',
        data: { message: 'Error deleting file', details: error.message }
      }));
    }
  }
}

// Get settings
async function getSettings(ws, sessionId, category = 'system') {
  try {
    // In a real implementation, you would fetch this from the database
    // For now, provide some default settings
    const settings = {
      system: {
        theme: 'light',
        language: 'en-US',
        notifications: true
      },
      desktop: {
        wallpaper: 'default.jpg',
        iconSize: 'medium'
      }
    };
    
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'settings',
        data: { 
          category,
          settings: settings[category] || {}
        }
      }));
    }
  } catch (error) {
    console.error('Error fetching settings:', error);
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'error',
        data: { message: 'Error fetching settings', details: error.message }
      }));
    }
  }
}

// Update a setting
async function updateSetting(ws, sessionId, settingData) {
  try {
    const { category, key, value } = settingData;
    
    // In a real implementation, you would update this in the database
    console.log(`Updating setting: ${category}.${key} = ${JSON.stringify(value)}`);
    
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'settingUpdated',
        data: { 
          category,
          key,
          value,
          success: true
        }
      }));
    }
  } catch (error) {
    console.error('Error updating setting:', error);
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'error',
        data: { message: 'Error updating setting', details: error.message }
      }));
    }
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('Server shutting down...');
  
  try {
    // Close database pool
    await pool.end();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
  
  process.exit(0);
});

// Start the server
httpServer.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
  console.log('Access at:', process.env.REPL_SLUG ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co` : `http://localhost:${port}`);
});
