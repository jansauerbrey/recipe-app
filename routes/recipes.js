var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var Recipe = require('../models/Recipe.js');

/* GET /recipes listing. */
router.get('/', function(req, res, next) {
  Recipe.find(function (err, recipes) {
    if (err) return next(err);
    res.json(recipes);
  });
});

/* POST /recipes */
router.post('/', function(req, res, next) {
  Recipe.create(req.body, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

/* GET /recpes/id */
router.get('/:id', function(req, res, next) {
  Recipe.findById(req.params.id, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

/* PUT /recipes/:id */
router.put('/:id', function(req, res, next) {
  Recipe.findByIdAndUpdate(req.params.id, req.body, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

/* DELETE /recipes/:id */
router.delete('/:id', function(req, res, next) {
  Recipe.findByIdAndRemove(req.params.id, req.body, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

module.exports = router;
