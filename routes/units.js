var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var Unit = require('../models/Unit.js');

var auth = require('../auth/auth.js');

/* GET /units listing. */
router.get('/', auth.verify, function(req, res, next) {
  Unit.find( null, null, {sort:{'name.de': 1 }},function (err, units) {
    if (err) return next(err);
    res.json(units);
  });
});

/* POST /units */
router.post('/', auth.verify, function(req, res, next) {
  Unit.create(req.body, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

/* GET /units/id */
router.get('/:id', auth.verify, function(req, res, next) {
  Unit.findById(req.params.id, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

/* PUT /units/:id */
router.put('/:id', auth.verify, function(req, res, next) {
  Unit.findByIdAndUpdate(req.params.id, req.body, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

/* DELETE /units/:id */
router.delete('/:id', auth.verify, function(req, res, next) {
  Unit.findByIdAndRemove(req.params.id, req.body, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

module.exports = router;
