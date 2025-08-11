module.exports = {
  apps: [
    {
      name: 'ringbot',
      script: 'npx',
      args: 'http-server build/client -p 3001 -a 0.0.0.0 --proxy http://localhost:3001?',
      cwd: '/www/wwwroot/ringbot',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      log_file: '/www/wwwroot/ringbot/logs/combined.log',
      out_file: '/www/wwwroot/ringbot/logs/out.log',
      error_file: '/www/wwwroot/ringbot/logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      max_memory_restart: '200M',
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,
    }
  ]
};