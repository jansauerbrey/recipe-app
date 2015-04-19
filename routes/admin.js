var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var User = require('../models/User.js');

var auth = require('../auth/auth.js');

/* GET /user listing. */
router.get('/user', auth.verifyAdmin, function(req, res, next) {
  User.find({}, '_id username is_admin created', function (err, users) {
    if (err) return next(err);
    res.json(users);
  });
});

/* GET /user/id */
router.get('/user/:id', auth.verifyAdmin, function(req, res, next) {
  User.findById(req.params.id, function (err, user) {
    if (err) return next(err);
    user.password = null;
    res.json(user);
  });
});

/* PUT /user/:id */
router.put('/user/:id', auth.verifyAdmin, function(req, res, next) {
  User.findByIdAndUpdate(req.params.id, req.body, function (err, user) {
    if (err) return next(err);
    user.password = null;
    res.json(user);
  });
});

/* DELETE /user/:id */
router.delete('/user/:id', auth.verifyAdmin, function(req, res, next) {
  User.findByIdAndRemove(req.params.id, req.body, function (err, user) {
    if (err) return next(err);
    user.password = null;
    res.json(user);
  });
});

module.exports = router;
