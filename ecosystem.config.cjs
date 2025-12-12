module.exports = {
    apps: [
        {
            name: 'domainscope-api',
            script: './backend/dist/server.js',
            instances: 'max',
            exec_mode: 'cluster',
            env: {
                NODE_ENV: 'production',
                PORT: 3000
            },
            env_production: {
                NODE_ENV: 'production',
                PORT: 3000
            },
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            error_file: './logs/api-error.log',
            out_file: './logs/api-out.log',
            merge_logs: true,
            max_memory_restart: '1G'
        },
        {
            name: 'domainscope-worker',
            script: './backend/dist/worker.js', // Assuming a separate worker entry point or same server handling queues
            instances: 2,
            exec_mode: 'cluster',
            env: {
                NODE_ENV: 'production'
            },
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            error_file: './logs/worker-error.log',
            out_file: './logs/worker-out.log',
            merge_logs: true
        }
    ]
};
