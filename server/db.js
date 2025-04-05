const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');
const schema = require('../shared/schema');

// Create a PostgreSQL connection pool using the DATABASE_URL environment variable
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Create a Drizzle instance with the database and schema
const db = drizzle(pool, { schema });

module.exports = { db, pool };