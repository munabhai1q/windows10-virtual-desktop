const { db } = require('./db');
const { eq, and } = require('drizzle-orm');
const schema = require('../shared/schema');

// Storage interface for database operations
class DatabaseStorage {
  // Application methods
  async getInstalledApps() {
    try {
      return await db.select().from(schema.apps).where(eq(schema.apps.isInstalled, true));
    } catch (error) {
      console.error('Error fetching installed apps:', error);
      return [];
    }
  }

  async installApp(appData) {
    try {
      const existingApp = await db.select().from(schema.apps).where(eq(schema.apps.name, appData.name));
      
      if (existingApp.length > 0) {
        // Update existing app to installed status
        return await db.update(schema.apps)
          .set({ isInstalled: true })
          .where(eq(schema.apps.name, appData.name))
          .returning();
      } else {
        // Insert new app
        return await db.insert(schema.apps).values({
          name: appData.name,
          displayName: appData.displayName || appData.name,
          icon: appData.icon || 'default.svg',
          appType: appData.appType || 'application',
          isInstalled: true,
          publisher: appData.publisher || 'Microsoft',
          size: appData.size || 0,
          description: appData.description || '',
          executable: appData.executable || appData.name,
          metadata: appData.metadata || {}
        }).returning();
      }
    } catch (error) {
      console.error('Error installing app:', error);
      throw error;
    }
  }

  async uninstallApp(appName) {
    try {
      // Set isInstalled to false - we don't delete to maintain history
      return await db.update(schema.apps)
        .set({ isInstalled: false })
        .where(and(
          eq(schema.apps.name, appName),
          eq(schema.apps.isSystem, false)
        ))
        .returning();
    } catch (error) {
      console.error('Error uninstalling app:', error);
      throw error;
    }
  }

  // File system methods
  async getFiles(path) {
    try {
      return await db.select().from(schema.files).where(eq(schema.files.parent, path));
    } catch (error) {
      console.error('Error fetching files:', error);
      return [];
    }
  }

  async getFileByPath(path) {
    try {
      const [file] = await db.select().from(schema.files).where(eq(schema.files.path, path));
      return file;
    } catch (error) {
      console.error('Error fetching file by path:', error);
      return null;
    }
  }

  async saveFile(fileData) {
    try {
      const { path, name, type, content, parent, size = 0 } = fileData;
      
      const existingFile = await this.getFileByPath(path);
      
      if (existingFile) {
        // Update existing file
        return await db.update(schema.files)
          .set({ 
            content, 
            modifiedAt: new Date(), 
            size,
            metadata: { ...existingFile.metadata, lastModifiedBy: 'user' }
          })
          .where(eq(schema.files.path, path))
          .returning();
      } else {
        // Create new file
        return await db.insert(schema.files).values({
          path,
          name,
          type,
          content,
          parent,
          size,
          isSystem: false,
          isHidden: false,
          metadata: { createdBy: 'user' }
        }).returning();
      }
    } catch (error) {
      console.error('Error saving file:', error);
      throw error;
    }
  }

  async deleteFile(path) {
    try {
      return await db.delete(schema.files)
        .where(eq(schema.files.path, path))
        .returning();
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  async createDirectory(dirData) {
    try {
      const { path, name, parent } = dirData;
      
      return await db.insert(schema.files).values({
        path,
        name,
        type: 'directory',
        parent,
        content: null,
        size: 0,
        isSystem: false,
        isHidden: false,
        metadata: { createdBy: 'user' }
      }).returning();
    } catch (error) {
      console.error('Error creating directory:', error);
      throw error;
    }
  }

  // User methods
  async getUserByUsername(username) {
    try {
      const [user] = await db.select().from(schema.users).where(eq(schema.users.username, username));
      return user;
    } catch (error) {
      console.error('Error fetching user by username:', error);
      return null;
    }
  }

  async createSession(sessionData) {
    try {
      const { sessionId, userId, expiresAt, data } = sessionData;
      
      return await db.insert(schema.sessions).values({
        sessionId,
        userId,
        expiresAt,
        data
      }).returning();
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  async getSessionById(sessionId) {
    try {
      const [session] = await db.select().from(schema.sessions).where(eq(schema.sessions.sessionId, sessionId));
      return session;
    } catch (error) {
      console.error('Error fetching session by id:', error);
      return null;
    }
  }

  async updateSession(sessionId, data) {
    try {
      return await db.update(schema.sessions)
        .set({ data })
        .where(eq(schema.sessions.sessionId, sessionId))
        .returning();
    } catch (error) {
      console.error('Error updating session:', error);
      throw error;
    }
  }
}

module.exports = new DatabaseStorage();