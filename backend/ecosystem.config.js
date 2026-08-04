module.exports = {
  apps: [
    {
      name: 'crm-backend',
      script: 'src/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 5000
      },
      max_memory_restart: '500M',
      error_file: 'logs/pm2-backend-error.log',
      out_file: 'logs/pm2-backend-out.log',
      merge_logs: true
    },
    {
      name: 'crm-scheduler',
      script: 'src/schedulers/alarmScheduler.js',
      instances: 1,
      exec_mode: 'fork',
      env_production: {
        NODE_ENV: 'production'
      },
      max_memory_restart: '200M',
      error_file: 'logs/pm2-scheduler-error.log',
      out_file: 'logs/pm2-scheduler-out.log'
    },
    {
      name: 'crm-worker',
      script: 'src/workers/alarmWorker.js',
      instances: 2,
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production'
      },
      max_memory_restart: '300M',
      error_file: 'logs/pm2-worker-error.log',
      out_file: 'logs/pm2-worker-out.log'
    }
  ]
};
