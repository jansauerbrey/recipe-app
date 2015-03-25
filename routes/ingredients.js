var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var Ingredient = require('../models/Ingredient.js');

/* GET /ingredients listing. */
router.get('/', function(req, res, next) {
  Ingredient.find(function (err, ingredients) {
    if (err) return next(err);
    res.json(ingredients);
  });
});

/* POST /ingredients */
router.post('/', function(req, res, next) {
  Ingredient.create(req.body, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

/* GET /ingredients/id */
router.get('/:id', function(req, res, next) {
  Ingredient.findById(req.params.id, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

/* PUT /ingredients/:id */
router.put('/:id', function(req, res, next) {
  Ingredient.findByIdAndUpdate(req.params.id, req.body, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

/* DELETE /ingredients/:id */
router.delete('/:id', function(req, res, next) {
  Ingredient.findByIdAndRemove(req.params.id, req.body, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

module.exports = router;
