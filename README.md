不好意思哈，由于最近比较忙，只实现的基本的增删改除的功能

###部署
环境 node/5.4.0, Mac Os 10.10.1

npm install

node bin/initTables (默认可以不允许这个命令, content/data/course.db 为测试数据)

npm start

(无需连接数据库, 使用的是sqlite)

然后便可以利用postman进行api测试了 :>

地址为 localhost:3001

### api
* 获取所有课程 POST /courses

* 创建课程 POST /courses


```` {
        course: {
            name: 'course name',
            start: 'start time',
            end: 'end time',
            extimatedTime: '',
            facilitator: ''
        }
    } ````

* 查看课程 /courses/:id

* 删除一个课程 /courses/:id

* 修改一个课程信息 /courses/:id
