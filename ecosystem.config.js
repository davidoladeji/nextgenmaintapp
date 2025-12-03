module.exports = {
  apps: [{
    name: 'nextmint-fmea',
    script: 'pnpm',
    args: 'start',
    cwd: '/home/peerisfh/nextgenmaintapp',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3030
    },
    error_file: '/home/peerisfh/nextgenmaintapp/logs/err.log',
    out_file: '/home/peerisfh/nextgenmaintapp/logs/out.log',
    log_file: '/home/peerisfh/nextgenmaintapp/logs/combined.log',
    time: true
  }]
};