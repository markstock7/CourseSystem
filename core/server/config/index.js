var _ = require('lodash'),
    path = require('path'),
    config;
config = {

    // sqlite3 配置信息

    database: {
        client: 'sqlite3',
        connection: {
            filename: path.resolve( 'content/data/course.db')
        },
    },

    server: {
        host: '127.0.0.1',
        port: '2368'
    }
}

// 输出配置信息
module.exports = config;
