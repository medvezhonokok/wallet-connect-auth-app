/** @type {import('next').NextConfig} */
const nextConfig = {}

module.exports = {
    basePath: '/app',
    trailingSlash: true,

    webpackDevMiddleware: (config) => {
        config.client = {
            overlay: false, // Отключает отображение ошибок в UI
        };
        return config;
    },
};
