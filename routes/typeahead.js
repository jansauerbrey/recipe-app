var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var Ingredient = require('../models/Ingredient.js');
var Recipe = require('../models/Recipe.js');

var auth = require('../auth/auth.js');

/* GET /ingredients listing. */
router.get('/ingredients/', auth.verify, function(req, res, next) {
  var searchTerm = new RegExp(req.query.search, 'i');
  var language = (!req.query.language) ? 'en' : req.query.language;
  var query ={};
  if (language === 'de') {
    query = {'name.de': searchTerm};
  }
  else if (language === 'fi') {
    query = {'name.fi': searchTerm};
  }
  else {
    query = {'name.en': searchTerm};
  }

  Ingredient.find(query, function (err, ingredients) {
    if (err) return next(err);
    res.json(ingredients);
  });
});

/* GET /ingredients listing. */
router.get('/recipes/', auth.verify, function(req, res, next) {
  var searchTerm = new RegExp(req.query.search, 'i');
  var query = {'name': searchTerm};
  Recipe.find(query, function (err, ingredients) {
    if (err) return next(err);
    res.json(ingredients);
  });
});

module.exports = router;
