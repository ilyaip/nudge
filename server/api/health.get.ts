/**
 * GET /api/health
 * Health check endpoint для Docker и мониторинга
 */
export default defineEventHandler(async (event) => {
  try {
    // Можно добавить проверку подключения к БД
    // const dbCheck = await db.select().from(users).limit(1)
    
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    }
  } catch (error) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Service Unavailable'
    })
  }
})
