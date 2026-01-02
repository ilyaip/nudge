import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL || ''

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set')
}

// Create postgres client with SSL support for production
const client = postgres(connectionString, {
  ssl: connectionString.includes('render.com') ? { rejectUnauthorized: false } : false
})

// Create drizzle instance
export const db = drizzle(client, { schema })

// Export schema for use in queries
export { schema }
