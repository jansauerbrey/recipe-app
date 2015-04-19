var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var User = require('../models/User.js');

var auth = require('../auth/auth.js');

/* LOGIN */
router.post('/login', function(req, res) {

    //verify credential (use POST)
    var username = req.body.username || '';
    var password = req.body.password || '';
 
    if (username == '' || password == '') {
        return res.send(401);
    }

    User.findOne({username: username}, function (err, user) {
        if (err) {
            console.log(err);
            return res.sendStatus(401);
        }

        if (user == undefined) {
            console.log("User undefined");
            return res.sendStatus(401);
        }
 
        user.comparePassword(password, function(isMatch) {
            if (!isMatch) {
                console.log("Attempt failed to login with " + user.username);
                return res.sendStatus(401);
            }
 
            var userData = {id: user._id, username: user.username, is_admin: user.is_admin};

            auth.createAndStoreToken(userData, 60*60, function(err, token) {
                if (err) {
                    console.log(err);
                    return res.sendStatus(400);
                }

                //Send back token
                return res.json({token: token, is_admin: user.is_admin});
            });
        });
    });
});

/* LOGOUT */
router.get('/logout', auth.verify, function(req, res) {
    auth.expireToken(req.headers);
    return res.sendStatus(200);
});


/* REGISTER */
router.post('/register', function(req, res) {
    var username = req.body.username || '';
    var password = req.body.password || '';
    var passwordConfirmation = req.body.passwordConfirmation || '';

    if (username == '' || password == '' || password != passwordConfirmation) {
        return res.sendStatus(400);
    }


    var userData = {username: username, password: password};

    User.create(userData, function(err) {
        if (err) {
            console.log(err);
            return res.sendStatus(500);
        }	

        User.count(function(err, counter) {
            if (err) {
                console.log(err);
                return res.sendStatus(500);
            }

            if (counter == 1) {
                User.update({username: username}, {is_admin:true}, function(err, nbRow) {
                    if (err) {
                        console.log(err);
                        return res.sendStatus(500);
                    }

                    console.log('First user created as an Admin');
                    return res.sendStatus(200);
                });
            } 
            else {
                return res.sendStatus(200);
            }
        });
    });
});




module.exports = router;