module.exports = {
  apps: [
    {
      name: 'notes-api',
      script: 'server.js',
      instances: 'max', // Use all CPU cores
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      // Logging
      log_file: './logs/combined.log',
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      // Health monitoring
      min_uptime: '10s',
      max_restarts: 10,
    },
  ],

  // Deployment configuration
  deploy: {
    production: {
      user: 'deploy',
      host: ['your-server-ip'],
      ref: 'origin/main',
      repo: 'git@github.com:your-username/backend-application.git',
      path: '/var/www/notes-api',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      env: {
        NODE_ENV: 'production',
      },
    },
    staging: {
      user: 'deploy',
      host: ['your-staging-server-ip'],
      ref: 'origin/develop',
      repo: 'git@github.com:your-username/backend-application.git',
      path: '/var/www/notes-api-staging',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      env: {
        NODE_ENV: 'production',
      },
    },
  },
};
