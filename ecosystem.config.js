// PM2 配置文件
module.exports = {
  apps: [
    {
      name: 'ringbot',
      script: './build/server/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      // 日志配置
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      
      // 自动重启配置
      watch: false,
      ignore_watch: ['node_modules', 'logs'],
      
      // 内存限制
      max_memory_restart: '500M',
      
      // 健康检查
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,
    }
  ]
};