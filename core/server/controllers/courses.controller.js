'use strict';
var path = require('path'),
    basicPath = path.resolve('.'),
    Promise = require('bluebird'),
    _ = require('lodash'),
    models = require('../models'),
    errors = require('../errors'),
    pipeline = require('../utils/pipeline'),
    apiHandler = require('../utils/api'),

    docName = 'course',
    allowedIncludes = [],

    courses;
courses = {
    add: function add(object, options) {
        var tasks = [];
        function doQuery(options) {
            var newCourse = options.data.course;
            return models.Course.add(newCourse, _.omit(options, ['data']));
        }

        tasks = [
            apiHandler.validate(docName),
            apiHandler.convertOptions(allowedIncludes),
            doQuery
        ];

        return pipeline(tasks, object, options).then(function(course) {
            return {
                course: course
            }
        });
    },

    browser: function browser(options) {
        var permittedOptions = apiHandler.browseDefaultOptions,
            tasks;

        function doQuery(options) {
            return models.Course.findAll(options);
        }

        tasks = [
            apiHandler.validate(docName, {
                opts: permittedOptions
            }),
            apiHandler.convertOptions(allowedIncludes),
            doQuery
        ];

        return pipeline(tasks, options);
    },

    read: function read(options) {
        var tasks;
        function doQuery(options) {
            return models.Course.findOne(options.data);
        }

        tasks = [
            apiHandler.validate(docName, {
                attrs: apiHandler.idDefaultOptions
            }),
            apiHandler.convertOptions(allowedIncludes),
            doQuery
        ];

        return pipeline(tasks, options).then(function formatResponse(course) {
            if(course) {
                return course;
            }
             return Promise.reject(new errors.NotFoundError('课程没有找到'));
        });
    },

    edit: function edit(object, options) {
        function doQuery(options) {
            var editCourse = options.data['courses'];
            return models.Course.edit(editCourse, _.omit(options, ['data']));
        }

        var tasks = [
           apiHandler.validate(docName, {
               opts: apiHandler.idDefaultOptions
           }),
           apiHandler.convertOptions(allowedIncludes),
           doQuery
       ];

       return pipeline(tasks, object, options).then(function formatResponse(course) {
          if(course) {
              return course;
          }
          return Promise.reject(new errors.NotFoundError('课程没有找到'));
       });

   },
   destroy: function destroy(options) {
       function doQuery(options) {
           return models.Course.destroy(options);
       }
       var tasks = [
           apiHandler.validate(docName, {
               opts:  apiHandler.idDefaultOptions,
           }),
           doQuery
       ];

       return pipeline(tasks, options).then(function(ret) {
           return {
               message: "删除成功"
           };
      }).catch(function() {
          return Promise.reject(new errors.NotFoundError('课程没有找到'));
      })
   }
};

module.exports = courses;
