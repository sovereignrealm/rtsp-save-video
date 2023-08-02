module.exports = {
    apps: [
        {
            name: "rtsp-send-file-to-server",
            script: "node server.js",
            instances: 1,
            error_file: 'logs/err/err.log',
            out_file: 'logs/out/out.log',
            time: true,
            autorestart: true,
            watch: false,
            env: {
                "NODE_ENV": "development"
            },
            env_production: {
                "NODE_ENV": "production"
            }
        },
    ]
};