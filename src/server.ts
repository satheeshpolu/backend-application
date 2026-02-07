/**
 * Server Entry Point
 */
import 'dotenv/config';
import { buildApp } from './app';
import config from './config';
import { closePool } from './config/database';

const start = async () => {
  try {
    const app = await buildApp();

    // Start server
    await app.listen({
      port: config.port,
      host: config.host,
    });

    console.log(`
┌────────────────────────────────────────────────┐
│           Server Started Successfully          │
├────────────────────────────────────────────────┤
│  Environment: ${config.env.padEnd(31)}│
│  Port: ${String(config.port).padEnd(38)}│
│  API: http://localhost:${config.port}/api/v1${' '.repeat(13)}│
│  Docs: http://localhost:${config.port}/api-docs${' '.repeat(11)}│
│  Health: http://localhost:${config.port}/health${' '.repeat(10)}│
└────────────────────────────────────────────────┘
    `);

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);

      try {
        await app.close();
        await closePool();
        console.log('Cleanup complete.');
        process.exit(0);
      } catch (error) {
        console.error('Shutdown error:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      shutdown('uncaughtException');
    });
    process.on('unhandledRejection', (reason) => {
      console.error('Unhandled Rejection:', reason);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();
