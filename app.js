var express = require('express'),
    path    = require('path'),
    favicon = require('serve-favicon'),
    logger  = require('morgan'),
    cookieParser = require('cookie-parser'),
    bodyParser   = require('body-parser'),

    // 加载所有的route
    routes = require('./core/server/routes'),

    // 记载错误处理
    errors = require('./core/server/errors'),

    // 创建服务程序
    app = express();

// 此处应该作为动态的，可以替换theme
app.set('views', 'content/themes/default');
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(bodyParser.json());
// 这个会讲参数中的的object进行合并
app.use(bodyParser.urlencoded({ extended: true}));
app.use(cookieParser());


// 静态自传
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'bower_components')));

app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});


// 处理所有的api错误
app.use(function(err, req, res, next) {
    if(!err) return next();
    errors.handleAPIError(err, req, res, next);
});

module.exports = app;
