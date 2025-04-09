module.exports = {
    apps: [
        {
            name: 'strapi-web',
            script: 'npm run start',
            out_file: "./front-end-out.log",
            error_file: "./front-end-error.log",
            log_date_format: "DD-MM HH:mm:ss Z",
            env: {
                NODE_ENV: 'development',
                PORT: 5000
            },
            env_production: {
                NODE_ENV: 'production',
                BASE_HOST: 'https://cms.regisna.site',
                PORT: 5000
            },
        },
    ],
}