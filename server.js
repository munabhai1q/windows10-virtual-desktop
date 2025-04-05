const express = require('express');
const http = require('http');
const path = require('path');
const WebSocket = require('ws');

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

// Session data store (in-memory)
const sessions = new Map();

// WebSocket connection handling
wss.on('connection', (ws) => {
  const sessionId = Date.now().toString();
  
  // Create a new session
  sessions.set(sessionId, {
    id: sessionId,
    createdAt: new Date(),
    files: {},
    apps: {
      installed: ['explorer', 'chrome', 'notepad', 'settings', 'store'],
      running: []
    }
  });
  
  // Send session ID to client
  ws.send(JSON.stringify({
    type: 'session',
    data: { sessionId, specs: getSystemSpecs() }
  }));
  
  // Handle messages from client
  ws.on('message', (message) => {
    try {
      const parsedMessage = JSON.parse(message);
      
      switch (parsedMessage.type) {
        case 'getApps':
          sendInstalledApps(ws, sessionId);
          break;
        case 'installApp':
          installApp(ws, sessionId, parsedMessage.data);
          break;
        case 'saveFile':
          saveFile(ws, sessionId, parsedMessage.data);
          break;
        case 'getFiles':
          sendFiles(ws, sessionId);
          break;
        default:
          console.log(`Unknown message type: ${parsedMessage.type}`);
      }
    } catch (e) {
      console.error('Error processing message:', e);
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

// Send installed applications to client
function sendInstalledApps(ws, sessionId) {
  const session = sessions.get(sessionId);
  if (session && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'apps',
      data: { installed: session.apps.installed }
    }));
  }
}

// Install new application (simulation)
function installApp(ws, sessionId, appData) {
  const session = sessions.get(sessionId);
  if (session) {
    if (!session.apps.installed.includes(appData.name)) {
      session.apps.installed.push(appData.name);
    }
    
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'appInstalled',
        data: {
          name: appData.name,
          success: true
        }
      }));
    }
  }
}

// Save file to simulated file system
function saveFile(ws, sessionId, fileData) {
  const session = sessions.get(sessionId);
  if (session) {
    const { path, content } = fileData;
    session.files[path] = content;
    
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'fileSaved',
        data: { path, success: true }
      }));
    }
  }
}

// Send files from simulated file system
function sendFiles(ws, sessionId) {
  const session = sessions.get(sessionId);
  if (session && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'files',
      data: { files: session.files }
    }));
  }
}

// Start the server
httpServer.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
});
