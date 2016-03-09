    var path = require('path'),
        config = require('../core/server/config'),
        Tables  = require('../core/server/data/Schema.js').tables,
        sequence = require('when/sequence'),
        _ = require('lodash'),
        knex = require('../core/server/config/lib/knex.js');

    function createTable(tableName) {
        return knex.schema.createTableIfNotExists(tableName, function(table) {
            var column,
                columnKeys = _.keys(Tables[tableName]);
            _.each(columnKeys, function(key) {
                if (Tables[tableName][key].type === 'text' && Tables[tableName][key].hasOwnProperty('fieldtype')) {
                    column = table[Tables[tableName][key].type](key, Tables[tableName][key].fieldtype);
                } else if (Tables[tableName][key].type === 'string' && Tables[tableName][key].hasOwnProperty('maxlength')) {
                    column = table[Tables[tableName][key].type](key, Tables[tableName][key].maxlength);
                } else {
                    column = table[Tables[tableName][key].type](key);
                }
                if (Tables[tableName][key].hasOwnProperty('nullable') && Tables[tableName][key].nullable === true) {
                    column.nullable();
                } else {
                    column.notNullable();
                }
                if (Tables[tableName][key].hasOwnProperty('primary') && Tables[tableName][key].primary === true) {
                    column.primary();
                }
                if (Tables[tableName][key].hasOwnProperty('unique') && Tables[tableName][key].unique) {
                    column.unique();
                }
                if (Tables[tableName][key].hasOwnProperty('unsigned') && Tables[tableName][key].unsigned) {
                    column.unsigned();
                }
                if (Tables[tableName][key].hasOwnProperty('references')) {
                    column.references(Tables[tableName][key].references);
                }
                if (Tables[tableName][key].hasOwnProperty('defaultTo')) {
                    column.defaultTo(Tables[tableName][key].defaultTo);
                }
            });
        });
    }

    function createTables() {
        var tables = [],
            tableNames = _.keys(Tables);
        console.log('tables', tableNames);
        tables = _.map(tableNames, function(tableName) {
            return function() {
                return createTable(tableName);
            };
        });
        return sequence(tables);
    }
    createTables()
        .then(function() {
            console.log('Tables created!!');
            process.exit(0);
        })
        .catch(function(error) {
            //throw error;
            console.log(error);
            process.exit(0);
        });
