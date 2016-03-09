'use strict';
var _ = require('lodash'),
    bookshelf = require('bookshelf'),
    path = require('path'),
    config = require('../../config'),
    knex = require('../../config/lib/knex'),
    schema = require('../../data/schema'),
    moment = require('moment'),
    Promise = require('bluebird'),
    sanitizer = require('validator').sanitizer,
    validation  = require('../validation'),

    markBookshelf,
    proto;

// 初始化一个新的bookshelf对象，做为其它model的基类
markBookshelf = bookshelf(knex);

markBookshelf.plugin('registry');


// 缓存原型链
proto = markBookshelf.Model.prototype;

markBookshelf.Model = markBookshelf.Model.extend({
    // 处理create_at, updated_at, 属性
    hasTimestamps: false,

    // get permitted attributes from schema.js
    permittedAttributes: function permittedAttributes() {
        return _.keys(schema.tables[this.tableName]);
    },

    // Bookshelf `initialize` - declare a constructor-like method for model creation
    initialize: function initialize() {
        var self = this,
            options = arguments[1] || {};

        this.on('creating', this.creating, this);

        this.on('saving', function onSaving(model, attributes, options) {
            return Promise.resolve(self.saving(model, attributes, options)).then(function then() {
                return self.validate(model, attributes, {});
            });
        });
    },

    validate: function validate() {
        return validation.validateSchema(this.tableName, this.toJSON());
    },

    creating: function creating(newObj, attr, options) {
        // Do nothing
    },

    saving: function saving(newObj, attr, options) {
        // Remove any properties which don't belong on the model
        this.attributes = this.pick(this.permittedAttributes());

        // Store the previous attributes so we can tell what was updated later
        this._updatedAttributes = newObj.previousAttributes();
    },

    fixDates: function fixDates(attrs) {
        var self = this;
        _.each(attrs, function each(value, key) {
            if (value !== null && schema.tables[self.tableName].hasOwnProperty(key) && schema.tables[self.tableName][key].type === 'dateTime') {
                // convert dateTime value into a native javascript Date object
                attrs[key] = moment(value).toDate();
            }
        });

        return attrs;
    },

    fixBools: function fixBools(attrs) {
        var self = this;

        _.each(attrs, function each(value, key) {
            if (schema.tables[self.tableName].hasOwnProperty(key) && schema.tables[self.tableName][key].type === 'bool')
                attrs[key] = !!value;
        });

        return attrs;
    },

    // format date before writing to DB, bools work
    format: function format(attrs) {
        return this.fixDates(attrs);
    },

    // format date and bool when fetching from DB
    parse: function parse(attrs) {
        return this.fixBools(this.fixDates(attrs));
    },

    // Prevent xss
    sanitize: function sanitize(attr) {
        return sanitize(this.get(attr)).xss();
    },

    // Get attributes that have been updated(values before a .save() call)
    updatedAttributes: function updatedAttributes() {
        return this._updatedAttributes || {};
    },

    updated: function updated(attr) {
        return this.updatedAttributes()[attr];
    }
}, {

    /**
     * Returns an array of keys permitted in every method's `options` hash.
     * Can be overridden and added to by a model's `permittedOptions` method.
     * @return {Object} Keys allowed in the `options` hash of every model's method.
     */
    permittedOptions: function permittedOptions() {
        // terms to whitelist for all methods.
        return ['context', 'include', 'transacting'];
    },

    /**
     * Filters potentially unsafe model attributes, so you can pass them to Bookshelf / Knex.
     * @param {Object} data Has keys representing the model's attributes/fields in the database.
     * @return {Object} The filtered results of the passed in data, containing only what's allowed in the schema.
     */
    filterData: function filterData(data) {;
        var permittedAttributes = this.prototype.permittedAttributes(),
            filteredData = _.pick(data, permittedAttributes);

        return filteredData;
    },

    /**
     * Filters potentially unsafe `options` in a model method's arguments, so you can pass them to Bookshelf / Knex.
     * @param {Object} options Represents options to filter in order to be passed to the Bookshelf query.
     * @param {String} methodName The name of the method to check valid options for.
     * @return {Object} The filtered results of `options`.
     */
    filterOptions: function filterOptions(options, methodName) {
        var permittedOptions = this.permittedOptions(methodName),
            filteredOptions = _.pick(options, permittedOptions);

        return filteredOptions;
    },

    findAll: function findAll(options) {
        options = this.filterOptions(options, 'findAll');
        options.withRelated = _.union(options.withRelated, options.include);
        return this.forge().fetchAll(options).then(function then(result) {
            if(options.include) {
                _.each(result.models, function each(item) {
                    item.include = options.include;
                });
            }
            return result;
        });
    },
    /**
     * ### Find One
     * Naive find one where data determines what to match on
     * @param {Object} data
     * @param {Object} options (optional)
     * @return {Promise(markBookshelf.Model)} Single Model
     */
    findOne: function findOne(data, options) {
        data = this.filterData(data);
        options = this.filterOptions(options, 'findOne');
        return this.forge(data).fetch(options);
    },

    /**
     * ### Edit
     * Naive edit
     * @param {Object} data
     * @param {Object} options (optional)
     * @return {Promise(markBookshelf.Model)} Edited Model
     */
    edit: function edit(data, options) {
        var id = parseInt(options.id);

        data = this.filterData(data);
        options = this.filterOptions(options, 'edit');
        return this.forge({id: id}).fetch(options).then(function then(object) {
            console.log('object', object);
            if (object) {
                console.log(data, options);
                return object.save(data, options);
            }
        });
    },

    /**
     * ### Add
     * Naive add
     * @param {Object} data
     * @param {Object} options (optional)
     * @return {Promise(markBookshelf.Model)} Newly Added Model
     */
    add: function add(data, options) {
        data = this.filterData(data);
        options = this.filterOptions(options, 'add');
        var model = this.forge(data);
        // We allow you to disable timestamps when importing posts so that the new posts `updated_at` value is the same
        if (options.importing) {
            model.hasTimestamps = false;
        }

        return model.save(null, options);
    },

    /**
     * ### Destroy
     * Naive destroy
     * @param {Object} options (optional)
     * @return {Promise(markBookshelf.Model)} Empty Model
     */
    destroy: function destroy(options) {

        var id = options.id;
        options = this.filterOptions(options, 'destroy');
        options.require = true;
        // Fetch the object before destroying it, so that the changed data is available to events
        return this.forge({id: id}).fetch(options).then(function then(obj) {
            return obj.destroy(options);
        });
    },

    parseOrderOption: function (order, include) {
        var permittedAttributes, result, rules;

        permittedAttributes = this.prototype.permittedAttributes();

        result = {};
        rules = order.split(',');

        _.each(rules, function (rule) {
            var match, field, direction;

            match = /^([a-z0-9_\.]+)\s+(asc|desc)$/i.exec(rule.trim());

            // invalid order syntax
            if (!match) {
                return;
            }

            field = match[1].toLowerCase();
            direction = match[2].toUpperCase();

            if (permittedAttributes.indexOf(field) === -1) {
                return;
            }

            result[field] = direction;
        });

        return result;
    }
});

// Export markBookshelf for use elsewhere
module.exports = markBookshelf;
