var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var Tag = require('../models/Tag.js');

var auth = require('../auth/auth.js');

/* GET /tags listing. */
router.get('/', auth.verify, function(req, res, next) {
  Tag.find(function (err, tags) {
    if (err) return next(err);
    res.json(tags);
  });
});

/* POST /tags */
router.post('/', auth.verify, function(req, res, next) {
  Tag.create(req.body, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

/* GET /tags/id */
router.get('/:id', auth.verify, function(req, res, next) {
  Tag.findById(req.params.id, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

/* PUT /tags/:id */
router.put('/:id', auth.verify, function(req, res, next) {
  Tag.findByIdAndUpdate(req.params.id, req.body, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

/* DELETE /tags/:id */
router.delete('/:id', auth.verify, function(req, res, next) {
  Tag.findByIdAndRemove(req.params.id, req.body, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

module.exports = router;
