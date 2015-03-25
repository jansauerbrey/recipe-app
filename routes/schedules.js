var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var Schedule = require('../models/Schedule.js');

/* GET /schedules listing. */
router.get('/', function(req, res, next) {
  Schedule.find(function (err, schedules) {
    if (err) return next(err);
    res.json(schedules);
  });
});

/* POST /schedules */
router.post('/', function(req, res, next) {
  Schedule.create(req.body, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

/* GET /schedules/id */
router.get('/:id', function(req, res, next) {
  Schedule.findById(req.params.id, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

/* PUT /schedules/:id */
router.put('/:id', function(req, res, next) {
  Schedule.findByIdAndUpdate(req.params.id, req.body, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

/* DELETE /schedules/:id */
router.delete('/:id', function(req, res, next) {
  Schedule.findByIdAndRemove(req.params.id, req.body, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

module.exports = router;
