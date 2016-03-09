'use strict';
var path = require('path'),
    basicPath = path.resolve('.'),
    schema = require('../../data/schema').tables,
    errors = require('../../errors'),
    _ = require('lodash'),
    validator = require('validator'),
    Promise = require('bluebird'),

    validateSchema,
    validate;

validator.extend = function(type, fn) {
    validator[type] = function() {
        return fn.apply(validator, arguments);
    }
};

// 自定义检查
// //
validator.extend('empty', function empty(str) {
    return _.isEmpty(str);
});

validator.extend('notContains', function notContains(str, badString) {
    return !_.contains(str, badString);
});

validator.extend('isEmptyOrURL', function isEmptyOrURL(str) {
    return (_.isEmpty(str) || validator.isURL(str, {
        require_protocol: false
    }));
});


// 通过schema来验证数据的正确性
// values are checked against the validation objects from schema.js
validateSchema = function validateSchema(tableName, model) {
    var columns = _.keys(schema[tableName]),
        validationErrors = [];

    _.each(columns, function each(columnKey) {
        var message = '';

        // 值为空
        if (model.hasOwnProperty(columnKey) && schema[tableName][columnKey].hasOwnProperty('nullable') && schema[tableName][columnKey].nullable !== true) {
            // 确保检查参数为字符串
            model[columnKey] += '';
            if (validator.isNull(model[columnKey]) || validator.empty(model[columnKey])) {
                message = 'column '+ columnKey + ' can\' be blank';
                validationErrors.push(new errors.ValidationError(message, tableName + '.' + columnKey));
            }
        }
        if (model[columnKey] !== null && model[columnKey] !== undefined) {
            // 超过最大长度
            if (schema[tableName][columnKey].hasOwnProperty('maxlength')) {
                if (!validator.isLength(model[columnKey], 0, schema[tableName][columnKey].maxlength)) {
                    message = columnKey + ' 最大长度为: '+ schema[tableName][columnKey].maxlength;
                    validationErrors.push(new errors.ValidationError(message, tableName + '.' + columnKey));
                }
            }
            // check validations objects
            if (schema[tableName][columnKey].hasOwnProperty('validations'))  {
                validationErrors = validationErrors.concat(validate(model[columnKey], columnKey, schema[tableName][columnKey].validations));
            }

            // 类型检查
            if (schema[tableName][columnKey].hasOwnProperty('type'))  {
                if (schema[tableName][columnKey].type === 'integer' && !validator.isInt(model[columnKey])) {
                    message = columnKey + " 必须为整形数字";
                    validationErrors.push(new errors.ValidationError(message, tableName + '.' + columnKey));
                }
            }
        }

    });

    if (validationErrors.length !== 0) {
        return Promise.reject(validationErrors);
    }

    return Promise.resolve();
};


// Validate default settings using the validator module.
// Each validation's key is a method name and its value is an array of options
//
// eg:
//      validations: { isURL: true, isLength: [20, 40] }
//
// will validate that a setting's length is a URL between 20 and 40 chars.
//
// If you pass a boolean as the value, it will specify the "good" result. By default
// the "good" result is assumed to be true.
//
// eg:
//      validations: { isNull: false }  // means the "good" result would
//                                      // fail the `isNull` check, so
//                                      // not null.
//
// available validators: https://github.com/chriso/validator.js#validators
validate = function validate(value, key, validations) {
    var validationErrors = [];

    _.each(validations, function each(validationOptions, validationName) {
        var goodResult = true;

        if (_.isBoolean(validationOptions)) {
            goodResult = validationOptions;
            validationOptions = [];
        } else if (!_.isArray(validationOptions)) {
            validationOptions = [validationOptions];
        }

        validationOptions.unshift(value);

        // equivalent of validator.isSomething(option1, option2)
        if (validator[validationName].apply(validator, validationOptions) !== goodResult) {
            validationErrors.push(new errors.ValidationError("非法的值:" + key + " : " + validationName));
        }

        validationOptions.shift();
    }, this);

    return validationErrors;
};

module.exports = {
    validate: validate,
    validator: validator,
    validateSchema: validateSchema,
};
