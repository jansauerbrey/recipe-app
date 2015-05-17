var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var Category = require('../models/Category.js');

var auth = require('../auth/auth.js');

/* GET /categories listing. */
router.get('/', auth.verify, function(req, res, next) {
  Category.find( function (err, categories) {
    if (err) return next(err);
    res.json(categories);
  });
});

/* POST /units */
router.post('/', auth.verify, function(req, res, next) {
  req.body.author = req._user.id;
  Category.create(req.body, function (err, category) {
    if (err) return next(err);
    res.json(category);
  });
});

/* GET /units/id */
router.get('/:id', auth.verify, function(req, res, next) {
  Category.findById(req.params.id, function (err, category) {
    if (err) return next(err);
    res.json(category);
  });
});

/* PUT /units/:id */
router.put('/:id', auth.verify, function(req, res, next) {
  req.body.author = req._user.id;
  Category.findByIdAndUpdate(req.params.id, req.body, function (err, category) {
    if (err) return next(err);
    res.json(category);
  });
});

/* DELETE /units/:id */
router.delete('/:id', auth.verify, function(req, res, next) {
  Category.findByIdAndRemove(req.params.id, req.body, function (err, category) {
    if (err) return next(err);
    res.json(category);
  });
});

module.exports = router;
