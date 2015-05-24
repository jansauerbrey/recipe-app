var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var Recipe = require('../models/Recipe.js');

var auth = require('../auth/auth.js');

/* GET /recipes listing. */
router.get('/', auth.verify, function(req, res, next) {
  Recipe.find(req.query).populate(['tags']).exec( function (err, recipes) {
    if (err) return next(err);
    res.json(recipes);
  });
});

/* POST /recipes */
router.post('/', auth.verify, function(req, res, next) {
  req.body.author = req._user.id;
  Recipe.create(req.body, function (err, recipe) {
    if (err) return next(err);
    res.json(recipe);
  });
});

/* GET /recpes/id */
router.get('/:id', auth.verify, function(req, res, next) {
  Recipe.findById(req.params.id).populate(['tags', 'ingredients.ingredient', 'ingredients.unit']).populate('author', 'fullname').exec( function (err, recipe) {
    if (err) return next(err);
    res.json(recipe);
  });
});

/* PUT /recipes/:id */
router.put('/:id', auth.verify, function(req, res, next) {
  Recipe.findById(req.params.id).populate('author', 'fullname').exec( function (err, recipe) {
    if (err) return next(err);
    if (req._user.id == recipe.author._id || req._user.is_admin === true) {
      Recipe.findByIdAndUpdate(req.params.id, req.body, function (err, recipe) {
        if (err) return next(err);
        res.json(recipe);
      });
    } else {
      res.sendStatus(401);
    }
  });
});

/* DELETE /recipes/:id */
router.delete('/:id', auth.verify, function(req, res, next) {
  Recipe.findById(req.params.id).populate('author', 'fullname').exec( function (err, recipe) {
    if (err) return next(err);
    if (req._user.id == recipe.author._id || req._user.is_admin === true) {
      Recipe.findByIdAndRemove(req.params.id, req.body, function (err, recipe) {
        if (err) return next(err);
        res.json(recipe);
      });
    } else {
      res.sendStatus(401);
    }
  });
});

module.exports = router;
