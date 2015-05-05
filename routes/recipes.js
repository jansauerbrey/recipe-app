var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var Recipe = require('../models/Recipe.js');

var auth = require('../auth/auth.js');

/* GET /recipes listing. */
router.get('/', auth.verify, function(req, res, next) {
  Recipe.find(req.query, function (err, recipes) {
    if (err) return next(err);
    res.json(recipes);
  });
});

/* POST /recipes */
router.post('/', auth.verify, function(req, res, next) {
  req.body.author = req._user.id;
  Recipe.create(req.body, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

/* GET /recpes/id */
router.get('/:id', auth.verify, function(req, res, next) {
  Recipe.findById(req.params.id).populate(['tags', 'ingredients.ingredient', 'ingredients.unit']).exec( function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

/* PUT /recipes/:id */
router.put('/:id', auth.verify, function(req, res, next) {
  Recipe.findByIdAndUpdate(req.params.id, req.body, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

/* DELETE /recipes/:id */
router.delete('/:id', auth.verify, function(req, res, next) {
  Recipe.findByIdAndRemove(req.params.id, req.body, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

module.exports = router;
