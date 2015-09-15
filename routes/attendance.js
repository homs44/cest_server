/**
 * Created by pc on 2015-07-30.
 */
var express = require('express');
var db = require('../db');
var gcm = require('node-gcm');
var uuid_obj = require('node-uuid');
var fs = require('fs');


var router = express.Router();
var absence = 1000 * 60 * 1; //10분
var late = 1000 * 60 * 2
var valid_limit = 1000 * 60 * 3; //


var c_absence  = 1000*60*2;
var c_late  = 1000*60*1;


/* GET users listing. */

var getLongTime = function (datetime) {
    var a = datetime.split(" ");
    var d = a[0].split("-");
    var t = a[1].split(":");

    var result = new Date(d[0], (d[1] - 1), d[2], t[0], t[1], t[2]);
    return result.getTime();

};
var getStringTime = function (date) {
    return date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
}

//출석응답 - 학생
router.post('/reply', function (req, res, next) {
    console.log("come");
    var uuid = req.body.uuid;
    var c_user_id = req.body.c_user_id;
    var attendance_time = req.body.attendance_time;
    //var valid_time = req.body.valid_time;
   // var receive_time = req.body.receive_time;
    var reply_time = req.body.reply_time;



    //valid_time -( reply_time - (receive_time - attendance_time))
    var r = {
        result: 0,
        error: '',
        status: 0
    };
    try {

        var gca = db.executeQuery(db.query_set.get_attendance, [uuid]);
        gca.on('success', function (results) {
            if (results == '') {
                // error
                r.status = 500;
                r.error = "not exist the uuid : " + uuid;
                res.status(500).send(r);
            } else {
                //출석 불렀음

                var result;
                var attendance_time = results[0].attendance_time;
                var t = new Date(attendance_time);
                var temp = getLongTime(reply_time) - t.getTime();

                if( temp < c_late){
                    result = 1;
                }else if( temp >=c_late && temp < c_absence){
                    result = 2;
                }else{
                    result = 3;
                }

                var func = db.executeQuery(db.query_set.add_attendance_result, [uuid, c_user_id, result, reply_time]);
                func.on('success', function (results) {
                    r.uuid = uuid;
                    r.result = result;
                    r.status = 200;
                    res.status(200).send(r);
                });
                func.on('error', function (error) {
                    console.log("in addAttendanceResult");
                    r.error = error;
                    r.status = 500;
                    console.log(error);
                    res.status(500).send(r);
                });

            }
        });
        gca.on('error', function (error) {
            r.status = 500;
            r.error = error;
            res.status(500).send(r);
        });

    } catch (e) {
        console.log(e);
        r.status = 500;
        r.error = e;
        res.status(500).send(r);
    }

});
//pic
router.post('/reply1', function (req, res, next) {
    console.log("come");
    var img = req.files.image;
    var uuid = req.files.uuid;
    var c_user_id = req.files.c_user_id;
    var attendance_time = req.files.attendance_time;
    var valid_time = req.files.valid_time;
    var receive_time = req.files.receive_time;
    var reply_time = req.files.reply_time;
    //valid_time -( reply_time - (receive_time - attendance_time))
    var r = {
        result: 0,
        error: '',
        status: 0
    };
    try {

        var result;
        var temp = (getLongTime(valid_time) + ((getLongTime(receive_time) - getLongTime(attendance_time)))) - (getLongTime(reply_time));
        console.log("time = " + temp);
        if (temp <= absence) {
            console.log("attendance - a");
            result = 3;
        } else if (temp > absence && temp <= late) {
            console.log("attendance - b");
            result = 2;
        } else {
            console.log("attendance - c");
            result = 1;
        }

        fs.readFile(img,function(error,data){

            var filePath = __dirname+"\\pics\\"+img.name;
            fs.writeFile(filePath,data,function(error){
                if(error){
                    console.log(error);
                }else{

                    var func = db.executeQuery(db.query_set.add_attendance_result_pic, [uuid, c_user_id, result, reply_time,filePath]);
                    func.on('success', function (results) {
                        r.uuid = uuid;
                        r.result = result;
                        r.status = 200;
                        res.status(200).send(r);
                    });
                    func.on('error', function (error) {
                        console.log("in addAttendanceResult");
                        r.error = error;
                        r.status = 500;
                        console.log(error);
                        res.status(500).send(r);
                    });



                }
            })
        });






    } catch (e) {
        console.log(e);
        r.status = 500;
        r.error = e;
        res.status(500).send(r);
    }

});

//출석 수정 - 교수
router.post('/professor/result', function (req, res) {

    var uuid = req.body.uuid;
    var c_user_id = req.body.c_user_id;
    var result = req.body.result;
    var r = {
        success: 0,
        status: -1
    };

    var func = db.executeQuery(db.query_set.update_attendance_result, [result, uuid, c_user_id]);
    func.on('success', function (results) {
        if (results.affectedRows == 0) {
            var func1 = db.executeQuery(db.query_set.add_attendance_result_no_time, [uuid, c_user_id, result]);
            func1.on('success', function (results) {
                r.success = 1;
                r.status = 200;
                res.status(200).send(r);
            });
            func1.on('error', function (error) {
                r.error = error;
                r.status = 500;
                console.log(error);
                res.status(500).send(r);
            });
        }else{
            r.success = 1;
            r.status = 200;
            res.status(200).send(r);
        }
    });
    func.on('error', function (error) {

        console.log(error);
        r.error = error;
        r.status = 500;
        res.status(500).send(r);
    });


});


//출석결과 - 학생
router.get('/student/result/:c_class_id/:c_user_id', function (req, res) {
    var c_class_id = req.params.c_class_id;
    var c_user_id = req.params.c_user_id;

    var r = {
        results: '',
        status: 0,
        error: ''
    };
    var func = db.executeQuery(db.query_set.get_attendance_results_for_student, [c_user_id, c_class_id, c_user_id]);

    func.on('success', function (results) {
        r.results = results;
        r.status = 200;
        res.status(200).send(r);
    });
    func.on('error', function (error) {
        console.log(error);
        r.error = error;
        r.status = 500;
        res.status(500).send(r);
    });


});

//출석 정보 - 교수
router.get('/professor/:c_class_id', function (req, res) {
    var c_class_id = req.params.c_class_id;

    var r = {
        results: '',
        status: 0,
        error: ''
    };
    var func = db.executeQuery(db.query_set.get_attendances, [c_class_id]);

    func.on('success', function (results) {
        r.results = results;
        r.status = 200;
        res.status(200).send(r);
    });
    func.on('error', function (error) {
        console.log(error);
        r.error = error;
        r.status = 500;
        res.status(500).send(r);
    });

});
//출석결과 - 교수
router.get('/professor/result/:c_class_id/:uuid', function (req, res) {
    var uuid = req.params.uuid;
    var c_class_id = req.params.c_class_id;

    var r = {
        results: '',
        status: 0,
        error: ''
    };

    var func = db.executeQuery(db.query_set.get_attendance_results_for_professor, [uuid, c_class_id, uuid]);

    func.on('success', function (results) {
        r.results = results;
        r.status = 200;
        res.status(200).send(r);
    });
    func.on('error', function (error) {
        console.log(error);
        r.error = error;
        r.status = 500;
        res.status(500).send(r);
    });

});


//학생 출석 가능여부
router.post('/available',function(req,res){


    var c_class_id = req.body.c_class_id;
    var c_user_id = req.body.c_user_id;
    //var c_class_id = req.params.c_class_id;
    var current = new Date();
    var current_time = getStringTime(current);

    var r = {
        status: -1,
        flag: -1,
        uuid:'',
        error: ''
        //flag  1: 출석부름 2: uuid 중복, 3: 이미 출석부름 4:그냥 error
    };
    var gca = db.executeQuery(db.query_set.get_active_attendance, [c_class_id, current_time]);
    gca.on('success', function (results) {
        if (results == '') {
            //출석 안불렀음
            r.status = 200;
            r.flag = 1;
            res.status(200).send(r);
        } else {
            //출석 불렀음
            r.uuid = results[0].uuid;
            r.attendance_time = results[0].attendance_time;
            r.c_class_id = results[0].c_class_id;
            r.valid_time = results[0].valid_time;



            //내가 출석했는지 확인인

            var gar = db.executeQuery(db.query_set.get_attendance_result,[r.uuid,c_user_id]);
            gar.on('success',function(re){
                if(re==''){
                    r.status = 200;
                    r.flag = 2;

                }else{
                    r.status = 200;
                    r.flag = 3;

                }
                res.status(200).send(r);
            });
            gar.on('error',function(error){
                r.flag = 4;
                r.status = 500;
                r.error = error;
                res.status(500).send(r);
            });

        }
    });
    gca.on('error', function (error) {
        r.flag = 4;
        r.status = 500;
        r.error = error;
        res.status(500).send(r);
    });



});

//출석시작 -교수
router.post('/', function (req, res) {

    var uuid = uuid_obj.v1();
    var c_class_id = req.body.c_class_id;
    var name = req.body.name;
    var current = new Date();
    var after10 = new Date(current.getTime() + valid_limit);

    var attendance_time = getStringTime(current);
    var valid_time = getStringTime(after10);

    var r = {
        status: -1,
        flag: -1,
        error: ''
        //flag  1: 출석부름 2: uuid 중복, 3: 이미 출석부름 4:그냥 error
    };
    var gca = db.executeQuery(db.query_set.get_active_attendance, [c_class_id, attendance_time]);
    gca.on('success', function (results) {
        if (results == '') {
            //사용가능
            var sa = db.executeQuery(db.query_set.add_attendance, [uuid, c_class_id, attendance_time, valid_time]);
            sa.on('success', function (results) {
                r.status = 200;
                r.flag = 1;
                callGcm(uuid, c_class_id, attendance_time, valid_time, name);
                res.status(200).send(r);
            });


            sa.on('error', function (error) {
                r.status = 500;
                r.flag = 2;
                r.error = error;
                res.status(500).send(r);
            });


        } else {
            r.status = 200;
            r.flag = 3;
            res.status(200).send(r);
        }
    });
    gca.on('error', function (error) {
        r.flag = 4;
        r.status = 500;
        r.error = error;
        res.status(500).send(r);
    });


});


var callGcm = function (uuid, c_class_id, attendance_time, valid_time, name) {

    var server_access_key = 'AIzaSyDyVWLSCi5a7LitV4opcU4QrMTROGIpFSs';
    var sender = new gcm.Sender(server_access_key);
    var registrationIds = [];
    console.log("c_class_id : " + c_class_id);
    var message = new gcm.Message({
        collapseKey: 'demo',
        delayWhileIdle: true,
        timeToLive: 3,
        data: {
            uuid: uuid,
            c_class_id: c_class_id,
            attendance_time: attendance_time,
            valid_time: valid_time,
            name: name

        }
    });

    var gsu = db.executeQuery(db.query_set.get_sugang_users, [c_class_id]);

    gsu.on('success', function (results) {
        for (var i in results) {
            registrationIds.push(results[i].gcm_id);
        }
        sender.send(message, registrationIds, 4, function (err, result) {
            console.log(result);
        });

    });
    gsu.on('error', function (error) {
        console.log('in call cgm');
        console.log(error);
    });
}


module.exports = router;
