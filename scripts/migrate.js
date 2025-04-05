const { db, pool } = require('../server/db');
const schema = require('../shared/schema');
const { eq, and } = require('drizzle-orm');

// Define the default applications
const defaultApps = [
  {
    name: 'explorer',
    displayName: 'File Explorer',
    icon: 'assets/apps/explorer.svg',
    appType: 'system',
    isInstalled: true,
    isSystem: true,
    publisher: 'Microsoft',
    version: '10.0.19042',
    size: 25,
    category: 'System Tools',
    description: 'File management application for Windows',
    executable: 'explorer.exe'
  },
  {
    name: 'chrome',
    displayName: 'Google Chrome',
    icon: 'assets/apps/chrome.svg',
    appType: 'browser',
    isInstalled: true,
    isSystem: false,
    publisher: 'Google LLC',
    version: '91.0.4472.124',
    size: 285,
    category: 'Internet',
    description: 'Fast and secure web browser',
    executable: 'chrome.exe'
  },
  {
    name: 'notepad',
    displayName: 'Notepad',
    icon: 'assets/apps/notepad.svg',
    appType: 'editor',
    isInstalled: true,
    isSystem: true,
    publisher: 'Microsoft',
    version: '10.0.19042',
    size: 10,
    category: 'System Tools',
    description: 'Simple text editor for Windows',
    executable: 'notepad.exe'
  },
  {
    name: 'settings',
    displayName: 'Settings',
    icon: 'assets/apps/settings.svg',
    appType: 'system',
    isInstalled: true,
    isSystem: true,
    publisher: 'Microsoft',
    version: '10.0.19042',
    size: 45,
    category: 'System Tools',
    description: 'Windows settings and configuration',
    executable: 'settings.exe'
  },
  {
    name: 'store',
    displayName: 'Microsoft Store',
    icon: 'assets/apps/store.svg',
    appType: 'store',
    isInstalled: true,
    isSystem: true,
    publisher: 'Microsoft',
    version: '10.0.19042',
    size: 120,
    category: 'System Tools',
    description: 'Digital distribution platform for Windows',
    executable: 'store.exe'
  },
  {
    name: 'davinci',
    displayName: 'DaVinci Resolve',
    icon: 'assets/apps/davinci.svg',
    appType: 'application',
    isInstalled: true,
    isSystem: false,
    publisher: 'Blackmagic Design',
    version: '17.4.3',
    size: 2500,
    category: 'Video Editing',
    description: 'Professional video editing software',
    executable: 'davinci.exe'
  },
  {
    name: 'davinci-studio',
    displayName: 'DaVinci Resolve Studio',
    icon: 'assets/apps/davinci-studio.svg',
    appType: 'application',
    isInstalled: true,
    isSystem: false,
    publisher: 'Blackmagic Design',
    version: '17.4.3',
    size: 3200,
    category: 'Video Editing',
    description: 'Professional video editing software (Studio version)',
    executable: 'davinci-studio.exe'
  }
];

// Define the default file system structure
const defaultFiles = [
  {
    path: 'C:/',
    name: 'C:',
    type: 'drive',
    parent: null,
    isSystem: true,
    isHidden: false,
    size: 0,
    metadata: { driveType: 'SSD', totalSpace: 1024 * 1024 * 1024 * 1024 }
  },
  {
    path: 'C:/Windows',
    name: 'Windows',
    type: 'directory',
    parent: 'C:/',
    isSystem: true,
    isHidden: false,
    size: 0,
    metadata: { systemFolder: true }
  },
  {
    path: 'C:/Users',
    name: 'Users',
    type: 'directory',
    parent: 'C:/',
    isSystem: true,
    isHidden: false,
    size: 0,
    metadata: { systemFolder: true }
  },
  {
    path: 'C:/Users/User',
    name: 'User',
    type: 'directory',
    parent: 'C:/Users',
    isSystem: false,
    isHidden: false,
    size: 0,
    metadata: { owner: 'current' }
  },
  {
    path: 'C:/Users/User/Desktop',
    name: 'Desktop',
    type: 'directory',
    parent: 'C:/Users/User',
    isSystem: false,
    isHidden: false,
    size: 0,
    metadata: { specialFolder: true }
  },
  {
    path: 'C:/Users/User/Documents',
    name: 'Documents',
    type: 'directory',
    parent: 'C:/Users/User',
    isSystem: false,
    isHidden: false,
    size: 0,
    metadata: { specialFolder: true }
  },
  {
    path: 'C:/Users/User/Pictures',
    name: 'Pictures',
    type: 'directory',
    parent: 'C:/Users/User',
    isSystem: false,
    isHidden: false,
    size: 0,
    metadata: { specialFolder: true }
  },
  {
    path: 'C:/Users/User/Music',
    name: 'Music',
    type: 'directory',
    parent: 'C:/Users/User',
    isSystem: false,
    isHidden: false,
    size: 0,
    metadata: { specialFolder: true }
  },
  {
    path: 'C:/Users/User/Videos',
    name: 'Videos',
    type: 'directory',
    parent: 'C:/Users/User',
    isSystem: false,
    isHidden: false,
    size: 0,
    metadata: { specialFolder: true }
  },
  {
    path: 'C:/Users/User/Downloads',
    name: 'Downloads',
    type: 'directory',
    parent: 'C:/Users/User',
    isSystem: false,
    isHidden: false,
    size: 0,
    metadata: { specialFolder: true }
  },
  {
    path: 'C:/Users/User/Desktop/My Computer.lnk',
    name: 'My Computer.lnk',
    type: 'file',
    parent: 'C:/Users/User/Desktop',
    isSystem: false,
    isHidden: false,
    size: 1024,
    content: JSON.stringify({ target: 'C:/' }),
    metadata: { type: 'shortcut', icon: 'computer' }
  },
  {
    path: 'C:/Users/User/Desktop/Recycle Bin.lnk',
    name: 'Recycle Bin.lnk',
    type: 'file',
    parent: 'C:/Users/User/Desktop',
    isSystem: false,
    isHidden: false,
    size: 1024,
    content: JSON.stringify({ target: 'C:/Recycle Bin' }),
    metadata: { type: 'shortcut', icon: 'recycle-bin' }
  }
];

// Define the default user
const defaultUser = {
  username: 'user',
  password: 'password', // Note: In a real app, use proper password hashing
  displayName: 'User',
  isAdmin: true,
  settings: {
    theme: 'light',
    wallpaper: 'default',
    language: 'en-US',
    notifications: true
  }
};

// Define the default settings
const defaultSettings = [
  {
    category: 'system',
    key: 'theme',
    value: 'light',
    isSystem: true
  },
  {
    category: 'system',
    key: 'language',
    value: 'en-US',
    isSystem: true
  },
  {
    category: 'system',
    key: 'notifications',
    value: true,
    isSystem: true
  },
  {
    category: 'desktop',
    key: 'wallpaper',
    value: 'default.jpg',
    isSystem: true
  },
  {
    category: 'desktop',
    key: 'iconSize',
    value: 'medium',
    isSystem: true
  }
];

async function createTable(query) {
  try {
    console.log(`Executing: ${query}`);
    await pool.query(query);
    console.log('Table created successfully');
    return true;
  } catch (error) {
    console.error('Error creating table:', error);
    return false;
  }
}

async function migrateDatabase() {
  try {
    console.log('Creating database tables...');
    
    // Create apps table
    await createTable(`
      CREATE TABLE IF NOT EXISTS apps (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        display_name VARCHAR(255) NOT NULL,
        icon VARCHAR(255) NOT NULL,
        app_type VARCHAR(50) NOT NULL DEFAULT 'application',
        is_installed BOOLEAN NOT NULL DEFAULT TRUE,
        is_system BOOLEAN NOT NULL DEFAULT FALSE,
        install_date TIMESTAMP DEFAULT NOW(),
        version VARCHAR(50) DEFAULT '1.0.0',
        publisher VARCHAR(255) DEFAULT 'Microsoft',
        size INTEGER DEFAULT 0,
        category VARCHAR(100) DEFAULT 'Uncategorized',
        description TEXT,
        executable VARCHAR(255),
        metadata JSONB
      )
    `);
    
    // Create files table
    await createTable(`
      CREATE TABLE IF NOT EXISTS files (
        id SERIAL PRIMARY KEY,
        path VARCHAR(1024) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        content TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        modified_at TIMESTAMP DEFAULT NOW(),
        size INTEGER DEFAULT 0,
        parent VARCHAR(1024),
        is_system BOOLEAN NOT NULL DEFAULT FALSE,
        is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
        metadata JSONB
      )
    `);
    
    // Create users table
    await createTable(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        display_name VARCHAR(255),
        email VARCHAR(255),
        is_admin BOOLEAN NOT NULL DEFAULT FALSE,
        avatar VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        last_login TIMESTAMP,
        settings JSONB
      )
    `);
    
    // Create settings table
    await createTable(`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        category VARCHAR(255) NOT NULL,
        key VARCHAR(255) NOT NULL,
        value JSONB,
        user_id INTEGER REFERENCES users(id),
        is_system BOOLEAN NOT NULL DEFAULT FALSE
      )
    `);
    
    // Create sessions table
    await createTable(`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL UNIQUE,
        user_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP,
        data JSONB
      )
    `);
    
    console.log('Database tables created successfully.');
    
    // Seed default data
    console.log('Seeding database with default data...');
    
    // Insert default apps
    for (const app of defaultApps) {
      try {
        const result = await pool.query('SELECT * FROM apps WHERE name = $1', [app.name]);
        
        if (result.rows.length === 0) {
          await pool.query(
            `INSERT INTO apps 
             (name, display_name, icon, app_type, is_installed, is_system, version, publisher, size, category, description, executable, metadata)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [
              app.name, 
              app.displayName, 
              app.icon, 
              app.appType, 
              app.isInstalled, 
              app.isSystem, 
              app.version, 
              app.publisher, 
              app.size, 
              app.category, 
              app.description, 
              app.executable, 
              app.metadata || {}
            ]
          );
          console.log(`Added app: ${app.name}`);
        }
      } catch (error) {
        console.error(`Error adding app ${app.name}:`, error);
      }
    }
    
    // Insert default files
    for (const file of defaultFiles) {
      try {
        const result = await pool.query('SELECT * FROM files WHERE path = $1', [file.path]);
        
        if (result.rows.length === 0) {
          await pool.query(
            `INSERT INTO files 
             (path, name, type, content, size, parent, is_system, is_hidden, metadata)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              file.path, 
              file.name, 
              file.type, 
              file.content || null, 
              file.size, 
              file.parent, 
              file.isSystem, 
              file.isHidden, 
              file.metadata || {}
            ]
          );
          console.log(`Added file: ${file.path}`);
        }
      } catch (error) {
        console.error(`Error adding file ${file.path}:`, error);
      }
    }
    
    // Insert default user
    try {
      const userResult = await pool.query('SELECT * FROM users WHERE username = $1', [defaultUser.username]);
      
      if (userResult.rows.length === 0) {
        await pool.query(
          `INSERT INTO users 
           (username, password, display_name, is_admin, settings)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            defaultUser.username, 
            defaultUser.password, 
            defaultUser.displayName, 
            defaultUser.isAdmin, 
            defaultUser.settings
          ]
        );
        console.log(`Added user: ${defaultUser.username}`);
      }
    } catch (error) {
      console.error(`Error adding user ${defaultUser.username}:`, error);
    }
    
    // Insert default settings
    for (const setting of defaultSettings) {
      try {
        const result = await pool.query(
          'SELECT * FROM settings WHERE category = $1 AND key = $2', 
          [setting.category, setting.key]
        );
        
        if (result.rows.length === 0) {
          await pool.query(
            `INSERT INTO settings 
             (category, key, value, is_system)
             VALUES ($1, $2, $3, $4)`,
            [
              setting.category, 
              setting.key, 
              setting.value, 
              setting.isSystem
            ]
          );
          console.log(`Added setting: ${setting.category}.${setting.key}`);
        }
      } catch (error) {
        console.error(`Error adding setting ${setting.category}.${setting.key}:`, error);
      }
    }
    
    console.log('Database seeded successfully.');
    
  } catch (error) {
    console.error('Database migration failed:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the migration
migrateDatabase();