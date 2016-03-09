'use strict';
// API
//     1. 参数整理
//     2. 参数检查

var Promise = require('bluebird'),
    _       = require('lodash'),
    path    = require('path'),
    errors  = require('../errors'),
    validation  = require('../models/validation'),
    apis;
apis = {
    // 默认的参数选项
    globalDefaultOptions: ['include'],

    // dataDefaultOptions - 用data来存储表单数据
    dataDefaultOptions: ['data'],

    // These must be provided by the endpoint
    // browseDefaultOptions - valid for all browse api endpoints
    browseDefaultOptions: ['page', 'limit', 'fields', 'order', 'debug'],

    // idDefaultOptions - 默认的主键用户搜索使用
    idDefaultOptions: ['id'],

    /** 验证参数 */
    validate: function validate(docName, extras) {
        // 检查传送过来的object 和 options, 对多余的参数进行过滤
        return function doValidate() {
            var object, options, permittedOptions;

            // object for the body
            // options for the params
            if(arguments.length === 2) {
                object = arguments[0];
                options = _.clone(arguments[1]) || {};
            } else if (arguments.length === 1) {
                options = _.clone(arguments[0]) || {};
            } else {
                options = {};
            }

             // Setup permitted options, starting with the global defaults
            permittedOptions = apis.globalDefaultOptions;

            // 当作sql参数进行处理
            if(extras && extras.opts) {
                permittedOptions = permittedOptions.concat(extras.opts);
            }

            // 附加的需要验证的属性
            if ((extras && extras.attrs) || object) {
                permittedOptions = permittedOptions.concat(apis.dataDefaultOptions);
            }

            // 从请求参数中挑选出 attrs中规定的 (users.read 中)
            if(extras && extras.attrs) {
                options.data = _.pick(options, extras.attrs);
                options = _.omit(options, extras.attrs);
            }

            // 如何body参数存在 post put etc.
            if(object) {
                return apis.checkObject(object, docName, options.id)
                    .then(function(data) {
                        options.data = data;
                        return checkOptions(options);
                    });
            }

            function checkOptions(options) {
                options = _.pick(options, permittedOptions);

                var validationErrors = apis.validateOptions(options);

                if(_.isEmpty(validationErrors)) {
                    return Promise.resolve(options);
                }

                 // For now, we can only handle showing the first validation error
                return errors.rejectError(validationErrors[0]);
            }

            // otherwise just check options and return
            return checkOptions(options);
        };
    },

    // 验证数据的合法性
    validateOptions: function validateOptions(options) {
        var globalValidations = {
            id: {matches: /^\d+|me$/},
            page: {matches: /^\d+$/},
            limit: {matches: /^\d+|all$/},
            fields: {matches: /^[\w, ]+$/},
            order: {matches: /^[a-z0-9_,\. ]+$/i},
            name: {}
        },
        noValidation = ['data', 'include'],
        errors = [];

        _.each(options, function(value ,key) {
            if (noValidation.indexOf(key) === -1) {
                if (globalValidations[key]) {
                    errors = errors.concat(validation.validate(value, key, globalValidations[key]));
                } else {
                    // all other keys should be alpha-numeric with dashes/underscores, like tag, author, status, etc
                    errors = errors.concat(validation.validate(value, key, globalValidations.slug));
                }
            }
        });
    },

    trimAndLowerCase: function trimAndLowerCase(params) {
        params = params || '';
        if (_.isString(params)) {
            params = params.split(',');
        }

        return _.map(params, function (item) {
            return item.trim().toLowerCase();
        });
    },

    prepareInclude: function prepareInclude(include, allowedIncludes) {
        return _.intersection(this.trimAndLowerCase(include), allowedIncludes);
    },

    prepareFields: function prepareFields(fields) {
        return this.trimAndLowerCase(fields);
    },

    /**
     * ## Convert Options
     * @param {Array} allowedIncludes
     * @returns {Function} doConversion
     */
    convertOptions: function convertOptions(allowedIncludes) {
        /**
         * Convert our options from API-style to Model-style
         * @param {Object} options
         * @returns {Object} options
         */
        return function doConversion(options) {
            if (options.include) {
                options.include = apis.prepareInclude(options.include, allowedIncludes);
            }
            if (options.fields) {
                options.columns = apis.prepareFields(options.fields);
                delete options.fields;
            }
            return options;
        };
    },

    checkObject: function (object, docName, editId) {
        // 保证post 数据不为空
        if(_.isEmpty(object) || _.isEmpty(object[docName]) ) {
            return errors.rejectError(new errors.BadRequestError('No root key ('+ docName +') provided.'));
        }
        // 保证id为整数
        if (editId && object[docName].id && parseInt(editId, 10) !== parseInt(object[docName].id, 10)) {
            return errors.rejectError(new errors.BadRequestError('非法的id类型'));
        }

        return Promise.resolve(object);
    },

    checkFileIsValid: function (file, types, extensions) {
        var type = file.type,
            ext = path.extname(file.name).toLowerCase();

        if (_.contains(types, type) && _.contains(extensions, ext)) {
            return true;
        }
        return false;
    }
};

module.exports = apis;
