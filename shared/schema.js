const { pgTable, serial, text, varchar, timestamp, integer, boolean, jsonb } = require('drizzle-orm/pg-core');

// Windows applications table
const apps = pgTable('apps', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  icon: varchar('icon', { length: 255 }).notNull(),
  appType: varchar('app_type', { length: 50 }).notNull().default('application'),
  isInstalled: boolean('is_installed').notNull().default(true),
  isSystem: boolean('is_system').notNull().default(false),
  installDate: timestamp('install_date').defaultNow(),
  version: varchar('version', { length: 50 }).default('1.0.0'),
  publisher: varchar('publisher', { length: 255 }).default('Microsoft'),
  size: integer('size').default(0), // In MB
  category: varchar('category', { length: 100 }).default('Uncategorized'),
  description: text('description'),
  executable: varchar('executable', { length: 255 }),
  metadata: jsonb('metadata')
});

// Windows files table
const files = pgTable('files', {
  id: serial('id').primaryKey(),
  path: varchar('path', { length: 1024 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // file, folder, etc.
  content: text('content'),
  createdAt: timestamp('created_at').defaultNow(),
  modifiedAt: timestamp('modified_at').defaultNow(),
  size: integer('size').default(0), // In bytes
  parent: varchar('parent', { length: 1024 }),
  isSystem: boolean('is_system').notNull().default(false),
  isHidden: boolean('is_hidden').notNull().default(false),
  metadata: jsonb('metadata')
});

// Users table
const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 255 }),
  email: varchar('email', { length: 255 }),
  isAdmin: boolean('is_admin').notNull().default(false),
  avatar: varchar('avatar', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
  lastLogin: timestamp('last_login'),
  settings: jsonb('settings')
});

// Settings table
const settings = pgTable('settings', {
  id: serial('id').primaryKey(),
  category: varchar('category', { length: 255 }).notNull(),
  key: varchar('key', { length: 255 }).notNull(),
  value: jsonb('value'),
  userId: integer('user_id').references(() => users.id),
  isSystem: boolean('is_system').notNull().default(false)
});

// Session table
const sessions = pgTable('sessions', {
  id: serial('id').primaryKey(),
  sessionId: varchar('session_id', { length: 255 }).notNull().unique(),
  userId: integer('user_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  expiresAt: timestamp('expires_at'),
  data: jsonb('data')
});

module.exports = {
  apps,
  files,
  users,
  settings,
  sessions
};