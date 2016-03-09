// 定义所有的数据库表
var db = {
    courses: {
        id: {type: 'increments', nullable: false, primary: true},
        name: {type: 'string', maxlength: 150, nullable: false},
        start:{type: 'dateTime', nullable: false},
        end: {type: 'dateTime', nullable: false},
        extimatedTime:{type: 'integer', nullable: false},
        facilitator: {type: 'string', maxlength: 150, nullable: false}
    }
};
module.exports.tables = db;
