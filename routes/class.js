/**
 * Created by pc on 2015-07-30.
 */
var express = require('express');
var db = require('../db');
var router = express.Router();

/* GET users listing. */
router.get('/student/:c_user_id/:semester', function(req, res, next) {

    var c_user_id = req.params.c_user_id;
    var semester = req.params.semester;
    console.log(semester);
    var func = db.executeQuery(db.query_set.get_my_classes_for_student,[c_user_id,semester]);

    var r = {
    };

    func.on("success",function(results){
        r.myclasses = results;
        res.status(200).send(r);
    });

    func.on('error', function (error) {
        r.error = error;
        res.status(500).send(r);
        console.log('error in db.login : ' + error);
    });


});

router.get('/professor/:c_user_id/:semester', function(req, res, next) {

    var c_user_id = req.params.c_user_id;
    var semester = req.params.semester;
    console.log(semester);
    var func = db.executeQuery(db.query_set.get_my_classes_for_professor,[c_user_id,semester]);

    var r = {
    };

    func.on("success",function(results){
        r.myclasses = results;
        res.status(200).send(r);
    });

    func.on('error', function (error) {
        r.error = error;
        res.status(500).send(r);
        console.log('error in db.login : ' + error);
    });


});




module.exports = router;
