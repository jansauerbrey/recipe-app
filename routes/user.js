var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var User = require('../models/User.js');

var auth = require('../auth/auth.js');

/* GET /user/info. */
router.get('/info', auth.verify, function(req, res, next) {
  User.findById( req._user.id, 'username fullname email is_admin', function (err, user) {
    if (err) return next(err);
    res.json(user);
  });
});

/* GET /user/info/id */
router.get('/info/:id', auth.verify, function(req, res, next) {
  User.findById(req.params.id, 'fullname', function (err, user) {
    if (err) return next(err);
    res.json(user);
  });
});


/* GET /user/check */
router.get('/check', auth.verify, function(req, res, next) {
    return res.sendStatus(200);
});

/* LOGIN */
router.post('/login', function(req, res) {
    //verify credential (use POST)
    var username = req.body.username || '';
    var password = req.body.password || '';
    var autologin = req.body.autologin || false;
 
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
 
        if (user.is_activated === false) {
            console.log("User not activated");
            return res.sendStatus(401);
        }

        user.comparePassword(password, function(isMatch) {
            if (!isMatch) {
                console.log("Attempt failed to login with " + user.username);
                return res.sendStatus(401);
            }
 
            var userData = {id: user._id, username: user.username, is_admin: user.is_admin, autologin: autologin};
            var expiration = 300; // 5 minutes

            if (autologin === true) {
              expiration = 60*60*24*30; //30 days
            }

            auth.createAndStoreToken(userData, expiration, function(err, token) {
                if (err) {
                    console.log(err);
                    return res.sendStatus(400);
                }

                //Send back token
                return res.json({token: token, is_admin: user.is_admin, fullname: user.fullname, _id: user._id, username: user.username});
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
    var email = req.body.email || '';
    var emailConfirmation = req.body.emailConfirmation || '';
    var fullname = req.body.fullname || '';

    if (username == '' || password == '' || password != passwordConfirmation || email == '' || fullname == '' || email != emailConfirmation) {
        return res.sendStatus(400);
    }


    var userData = {username: username, password: password, email:email, fullname:fullname};

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
                User.update({username: username}, {is_admin:true, is_activated: true}, function(err, nbRow) {
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
