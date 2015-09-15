/**
 * Created by pc on 2015-07-19.
 */

var mysql = require('mysql');
//var util = require('../util');


var pool = mysql.createPool({

    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '582546Gn',
    database: 'smartclass',
    connectionLimit:20,
    waitForConnections:false
});

exports.query_set = {
    get_user: 'select * from user where user_id = ?',
    //[user_id]

    get_sugang_users :'select * from user where c_user_i        d in (select c_user_id from sugang where c_class_id = ?)',
    //[c_class_id]

    update_gcm : 'update user set gcm_id  = ?,active = 1 where user_id = ?',
    //[gcm_id,user_id]

    add_attendance : 'insert into attendance(uuid,c_class_id,attendance_time,valid_time) values(?,?,?,?)',
    //[uuid,c_class_id,attendance_time,valid_time]

    get_active_attendance : 'select * from attendance where c_class_id = ? and ? <= valid_time',
    //[c_class_id, attendance_time]

    get_attendance : 'select * from attendance where uuid = ?',
    //[uuid]

    get_attendances : 'select * from attendance where c_class_id = ?',
    //[c_class_id]




    add_attendance_result : 'insert into attendancebook(uuid,c_user_id,result,reply_time) values(?,?,?,?)',
    //[uuid, c_user_id, result,reply_time]

    add_attendance_result_pic : 'insert into attendancebook(uuid,c_user_id,result,reply_time,pic_path) values(?,?,?,?,?)',
    //[uuid, c_user_id, result,reply_time]

    add_attendance_result_no_time : 'insert into attendancebook(uuid,c_user_id,result) values(?,?,?)',
    //[uuid, c_user_id, result]


    update_attendance_result: 'update smartclass.attendancebook set result = ? where attendancebook.uuid = ? and attendancebook.c_user_id = ?',
    //[result,uuid,c_user_id]

    get_attendance_result : 'select * from smartclass.attendancebook where attendancebook.uuid = ? and attendancebook.c_user_id = ?',


    get_attendance_results_for_student : 'select attendancebook.uuid as uuid, IFNULL(attendancebook.result,3) as result,'+
    'IFNULL(attendancebook.c_user_id,?) as c_user_id,'+
    'attendance.attendance_time as attendance_time,'+
    'attendancebook.reply_time as reply_time,'+
    'attendance.c_class_id as c_class_id from (select * from smartclass.attendance where attendance.c_class_id = ?) as attendance '+
    'left join smartclass.attendancebook on attendance.uuid = attendancebook.uuid and attendancebook.c_user_id=?;',
    //[c_user_id,c_class_id,c_user_id]

    get_attendance_results_for_professor : 'select s.c_user_id,s.user_id,s.name,IFNULL(ab.uuid,?) as uuid,IFNULL(ab.result,3) as result,ab.reply_time ' +
    'from ((select user.c_user_id,user.user_id,user.name from smartclass.sugang,smartclass.user where c_class_id = ? and sugang.c_user_id = user.c_user_id) as s)' +
    ' left join (select * from smartclass.attendancebook where attendancebook.uuid =?) as ab  on s.c_user_id = ab.c_user_id; ',
    //[uuid,c_class_id , uuid]

    get_my_classes_for_professor : 'select * from classes,classtime where '+
    'classes.c_user_id = ? '+
    'and classes.c_class_id = classtime.c_class_id and classes.semester = ?;',
    //[c_user_id,semester]

    get_my_classes_for_student : 'select * from classes,classtime where '+
    'classes.c_class_id in (select c_class_id from sugang where sugang.c_user_id = ?)'+
    'and classes.c_class_id = classtime.c_class_id and classes.semester = ?;',
    //[c_user_id,semester]




};

var EventEmitter = require('events').EventEmitter;


exports.executeQuery =function (query,params) {
    var evt = new EventEmitter();
    pool.getConnection(function(err,conn){
        conn.query(query, params, function (error, results) {

            if (error) {
                evt.emit('error', error);
            } else {
                evt.emit('success', results);
            }

            conn.release();
        });
    });
    return evt;

};


/*
module.exports = {

    executeQuery: function (query,params) {
        var evt = new EventEmitter();
        pool.getConnection(function(err,conn){
            conn.query(query, params, function (error, results) {

                if (error) {
                    evt.emit('error', error);
                } else {
                    evt.emit('success', results);
                }

                conn.release();
            });
        });
        return evt;

    },
    getSugangUsers: function(c_class_id){
        var evt = new EventEmitter();
        pool.getConnection(function(err,conn){
            conn.query('select * from user where c_user_id in (select c_user_id from sugang where c_class_id = ?)', [c_class_id], function (error, results) {

                if (error) {
                    evt.emit('error', error);
                } else {
                    evt.emit('success', results);
                }

                conn.release();
            });
        });
        return evt;
    },

    addGcmId: function (user_id,gcm_id){
        var evt = new EventEmitter();
        pool.getConnection(function(err,conn){
            conn.query('update user set gcm_id  = ?,active = 1 where user_id = ?',[gcm_id,user_id] , function (error, results) {

                if (error) {
                    evt.emit('error', error);
                } else {
                    evt.emit('success', results);
                }

                conn.release();
            });
        });
        return evt;
    },
    getStudnetClasses: function (c_user_id,semester){
        var evt = new EventEmitter();
        pool.getConnection(function(err,conn){
            conn.query('select * from classes,classtime where '+
            'classes.c_class_id in (select c_class_id from sugang where sugang.c_user_id = ?)'+
            'and classes.c_class_id = classtime.c_class_id and classes.semester = ?;', [c_user_id,semester], function (error, results) {

                if (error) {
                    evt.emit('error', error);
                } else {
                    evt.emit('success', results);
                }

                conn.release();
            });
        });
        return evt;
    },

    addAttendance: function (uuid,c_class_id,attendance_time,valid_time){
        var evt = new EventEmitter();
        pool.getConnection(function(err,conn){
            conn.query('insert into attendance(uuid,c_class_id,attendance_time,valid_time) values(?,?,?,?)',[uuid,c_class_id,attendance_time,valid_time] , function (error, results) {

                if (error) {
                    evt.emit('error', error);
                } else {
                    evt.emit('success', results);
                }

                conn.release();
            });
        });
        return evt;
    },

    getCurrentAttendance: function(c_class_id,attendance_time){
        var evt = new EventEmitter();
        pool.getConnection(function(err,conn){
            conn.query('select * from attendance where c_class_id = ? and ? <= valid_time',[c_class_id,attendance_time] , function (error, results) {

                if (error) {
                    evt.emit('error', error);
                } else {
                    evt.emit('success', results);
                }

                conn.release();
            });
        });
        return evt;
    },

    getAttendance: function(c_class_id,attendance_time){
        var evt = new EventEmitter();
        pool.getConnection(function(err,conn){
            conn.query('select * from attendance where c_class_id = ? and ? <= valid_time',[c_class_id,attendance_time] , function (error, results) {

                if (error) {
                    evt.emit('error', error);
                } else {
                    evt.emit('success', results);
                }

                conn.release();
            });
        });
        return evt;
    },

    addAttendanceResult: function (uuid,c_user_id,result,reply_time){
        var evt = new EventEmitter();
        pool.getConnection(function(err,conn){
            conn.query('insert into attendancebook(uuid,c_user_id,result,reply_time) values(?,?,?,?)',[uuid,c_user_id,result,reply_time] , function (error, results) {

                if (error) {
                    evt.emit('error', error);
                } else {
                    evt.emit('success', results);
                }

                conn.release();
            });
        });
        return evt;
    },

    getStudnetAttendanceResult: function (c_class_id,c_user_id){
        var evt = new EventEmitter();
        var params = [c_user_id,c_class_id,c_user_id];

        pool.getConnection(function(err,conn){
            conn.query('select attendancebook.uuid as uuid, IFNULL(attendancebook.result,3) as result,'+
            'IFNULL(attendancebook.c_user_id,?) as c_user_id,'+
            'attendance.attendance_time as attendance_time,'+
            'attendancebook.reply_time as reply_time,'+
            'attendance.c_class_id as c_class_id from (select * from smartclass.attendance where attendance.c_class_id = ?) as attendance '+
            'left join smartclass.attendancebook on attendance.uuid = attendancebook.uuid and attendancebook.c_user_id=?;',params , function (error, results) {

                if (error) {
                    evt.emit('error', error);
                } else {
                    evt.emit('success', results);
                }

                conn.release();
            });
        });
        return evt;
    },


    getProfessorClasses: function (c_user_id,semester){
        var evt = new EventEmitter();
        pool.getConnection(function(err,conn){
            conn.query('select * from classes,classtime where '+
                'classes.c_user_id = ? '+
                'and classes.c_class_id = classtime.c_class_id and classes.semester = ?;', [c_user_id,semester], function (error, results) {

                if (error) {
                    evt.emit('error', error);
                } else {
                    evt.emit('success', results);
                }

                conn.release();
            });
        });
        return evt;
    },



};

*/