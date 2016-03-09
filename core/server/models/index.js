'use strict';
var Promise = require('bluebird'),
    _ = require('lodash'),
    exports,
    models;

exports = module.exports;

// 所有的model 放在此处加载
models = [
    'course',
    // 'student'
];

function init() {
    exports.Base = require('./base');
    models.forEach(function(name) {
        _.extend(exports, require('./' + name));
    });
    return Promise.resolve();
}
init();
