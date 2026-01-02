import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import * as dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set')
}

async function main() {
  console.log('Running migrations...')
  
  const client = postgres(connectionString!, { max: 1 })
  const db = drizzle(client)
  
  await migrate(db, { migrationsFolder: './server/db/migrations' })
  
  console.log('Migrations completed successfully!')
  
  await client.end()
}

main().catch((err) => {
  console.error('Migration failed!')
  console.error(err)
  process.exit(1)
})
