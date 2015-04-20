var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var Schedule = require('../models/Schedule.js');

var auth = require('../auth/auth.js');

/* GET /schedules listing. */
router.get('/', auth.verify, function(req, res, next) {
  Schedule.find({author: req._user.id, date: {'$gte': req.query.startDate, '$lt': req.query.endDate}}, function (err, schedules) {
    if (err) return next(err);
    res.json(schedules);
  });
});

/* POST /schedules */
router.post('/', auth.verify, function(req, res, next) {
  req.body.author = req._user.id;
  console.log(req.body.author);
  Schedule.create(req.body, function (err, schedule) {
    if (err) return next(err);
    res.json(schedule);
  });
});

/* GET /schedules/:id */
router.get('/:id', auth.verify, function(req, res, next) {
  Schedule.findById(req.params.id, function (err, schedule) {
    if (err) return next(err);
    res.json(schedule);
  });
});

/* PUT /schedules/:id */
router.put('/:id', auth.verify, function(req, res, next) {
  req.body.author = req._user.id;
  Schedule.findByIdAndUpdate(req.params.id, req.body, function (err, schedule) {
    if (err) return next(err);
    res.json(schedule);
  });
});

/* DELETE /schedules/:id */
router.delete('/:id', auth.verify, function(req, res, next) {
  Schedule.findByIdAndRemove(req.params.id, req.body, function (err, schedule) {
    if (err) return next(err);
    res.json(schedule);
  });
});

module.exports = router;
