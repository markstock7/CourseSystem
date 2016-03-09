var express = require('express'),
    router = express.Router(),
    _ = require('lodash');

// 加载各个路由
_.each([
    './courses.js'
    // 此处罗列所有route
], function(r) {
    require(r)(router);
});

/**
 * 默认使用 default 模版
 */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
});

module.exports = router;
