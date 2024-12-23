

module.exports = {
    apps: [
        {
            name: "api-demo-checklist",
            script: "./index.js",
            env: {
                NODE_ENV: 'production',
                PORT: 6666
            }
        }
    ]
}