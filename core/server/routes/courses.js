var courseController = require('../controllers/courses.controller'),
    apiHeader = require('../utils/header');

module.exports = function(router) {
    // 查看课程列表
    router.get('/courses', apiHeader.http(courseController.browser));

    // 创建课程
    router.post('/courses', apiHeader.http(courseController.add));

    // 查看课程
    router.get('/courses/:id', apiHeader.http(courseController.read));
    //
    // // 删除一个课程
    router.delete('/courses/:id', apiHeader.http(courseController.destroy));

    // 修改一个课程信息
    router.put('/courses/:id', apiHeader.http(courseController.edit));
};
