const path = require('path');

module.exports = {
    entry: './server.js', // Entry point of your application
    output: {
        path: path.resolve(__dirname, 'dist'), // Output directory
        filename: 'bundle.js' // Output file name
    },
    resolve: {
        fallback: {
            "vm": false,
            "path": false,
            "stream": false,
            "querystring": false,
            "http": false,
            "crypto": false,
            "util": false,
            "url": false,
            "buffer": false,
            "string_decoder": false,
            "os": false,
            "zlib": false,
            "fs": false,
            "async_hooks": false,
            "net": false,

        }
    }
};
