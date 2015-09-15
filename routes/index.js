var express = require('express');
var router = express.Router();
var db = require('../db');
var gcm = require('node-gcm');

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: 'Express'});
});





router.post('/login', function (req, res) {
    var user_id = req.body.user_id;
    var password = req.body.password;
    var gcm_id = req.body.gcm_id;
    var type = req.body.type;
/*
    console.log('user_id : '+ user_id);
    console.log('password : '+ password );
    console.log('gcm_id : '+ gcm_id);
*/
    var r = {
        login : false,
        c_user_id : -1
    };


    var func = db.executeQuery(db.query_set.get_user, [user_id]);

    func.on('success', function (results) {
        if (results == '') {
            res.status(200).send(r);
        } else {
            if (results[0].password == password && results[0].type == type) {
                r.login = true;
                r.c_user_id = results[0].c_user_id;

                var func_1 = db.executeQuery(db.query_set.update_gcm,[gcm_id,user_id]);
                func_1.on('success', function (results) {
                    //추가작업 필요
                    res.status(200).send(r);
                });
                func_1.on('error', function (error) {
                    //추가작업 필요
                    console.log(error);
                    res.status(500).send(error);
                });

                //okay
            } else {
                res.status(200).send(r);
            }
        }



    });

    func.on('error', function (error) {
        r.error = error;
        res.status(500).send(r);
        console.log('error in db.login : ' + error);
    });

});


module.exports = router;
