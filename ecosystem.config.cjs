module.exports = {
  apps: [{
    name: 'factory-os',
    script: './dist/index.js',
    cwd: '/var/www/agentic-factory',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3002
    },
    error_file: '/var/log/pm2/factory-os-error.log',
    out_file: '/var/log/pm2/factory-os-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '500M',
    restart_delay: 3000,
    max_restarts: 5,
    min_uptime: '10s',
    autorestart: true,
    kill_timeout: 5000,
    listen_timeout: 10000
  }]
};
