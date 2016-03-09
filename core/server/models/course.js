'use strict';
var _ = require('lodash'),
    Promise = require('bluebird'),
    path = require('path'),
    basicPath = path.resolve('.'),

    sequence = require('../utils/sequence'),
    errors = require('../errors'),
    markBookshelf = require('./base'),

    Course,
    Courses;
Course = markBookshelf.Model.extend({
    tableName: 'courses',

    initialize: function initialize() {
        var self = this;
        markBookshelf.Model.prototype.initialize.apply(this, arguments);
    },

    saving: function saving(model, attr, options) {
        var self = this;

        options = options || {};
        // 保存
        markBookshelf.Model.prototype.saving.call(this, model, attr, options);
    },

    crateing: function creating(model, attr, options) {
        options = options || {};
        markBookshelf.Model.prototype.creating.call(this, model, attr, options);
    },

    toJSON: function toJSON(options) {
        options = options || {};

        var attrs = markBookshelf.Model.prototype.toJSON.call(this, options);
        return attrs;
    },
}, {
    orderDefaultOptions: function orderDefaultOptions() {
        return {
            start: 'DESC', // 按照时间排序
            id: 'DESC'
        };
    },
    // 处理filter参数 page, status ,可以添加where 搜索
    processOptions: function processOptions(options) {
        // This is the only place that 'options.where' is set now
        options.where = {
            statements: []
        };
        return options;
    },
    /**
     * Returns an array of keys permitted in a method's `options` hash, depending on the current method.
     * @param {String} methodName The name of the method to check valid options for.
     * @return {Array} Keys allowed in the `options` hash of the model's method.
     */
    permittedOptions: function permittedOptions(methodName) {
        var options = markBookshelf.Model.permittedOptions(),
            // whitelists for the `options` hash argument on methods, by method name.
            // these are the only options that can be passed to Bookshelf / Knex.
            validOptions = {
                findOne: ['id'],
                findPage: ['page', 'limit', 'order'],
            };
        if (validOptions[methodName]) {
            options = options.concat(validOptions[methodName]);
        }
        return options;
    },

    // /**
    //  * Filters potentially unsafe model attributes, so you can pass them to Bookshelf / Knex.
    //  * 过滤掉不安全的model参数
    //  * @param {Object} data Has keys representing the model's attributes/fields in the database.
    //  * @return {Object} The filtered results of the passed in data, containing only what's allowed in the schema.
    //  */
    // filterData: function filterData(data) {
    //     var permittedAttributes = this.prototype.permittedAttributes(),
    //         filteredData;
    //     filteredData = _.pick(data, permittedAttributes);
    //
    //     return filteredData;
    // },

    findOne: function findOne(data, options) {
        options = options || {};
        return markBookshelf.Model.findOne.call(this, data, options).then(function then(course) {
            return course;
        });
    },
    /**
     * ### Add
     */
    add: function add(data, options) {
        var self = this;
        options = options || {};
        return markBookshelf.Model.add.call(this, data, options).then(function then(idocument) {
            return self.findOne({
                id: idocument.id
            }, options);
        });
    }
});


Courses = markBookshelf.Collection.extend({
    model: Course
});

module.exports = {
    Course: markBookshelf.model('Course', Course),
    Courses: markBookshelf.model('Courese', Courses)
};
