'use strict';
var config = require('../index');

var knex = require('knex')({
    client: config.database.client,
    connection: config.database.connection
});

module.exports = knex;
