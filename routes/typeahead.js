const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const Ingredient = require('../models/Ingredient.js');
const Recipe = require('../models/Recipe.js');
const Tags = require('../models/Tag.js');

const auth = require('../auth/auth.js');

/* GET /ingredients listing. */
router.get('/ingredients/', auth.verify, function(req, res, next) {
  const searchTerm = new RegExp(req.query.search, 'i');
  const language = req.query.language ? req.query.language : req._user.settings.spokenLanguages;
  let query ={};
  if (language === 'de') {
    query = {'name.de': searchTerm};
  }
  else if (language === 'fi') {
    query = {'name.fi': searchTerm};
  }
  else {
    query = {'name.en': searchTerm};
  }

  Ingredient.find(query).limit(10).exec( function (err, ingredients) {
    if (err) return next(err);
    res.json(ingredients);
  });
});

/* GET /recipe listing. */
router.get('/recipes/', auth.verify, function(req, res, next) {
  const searchTerm = new RegExp(req.query.search, 'i');
  const query = {'name': searchTerm, language: {'$in': req._user.settings.spokenLanguages}};
  Recipe.find(query).populate('author', 'fullname').limit(10).exec( function (err, recipes) {
    if (err) return next(err);
    res.json(recipes);
  });
});

/* GET /tags listing. */
router.get('/tags/', auth.verify, function(req, res, next) {
  const searchTerm = new RegExp(req.query.search, 'i');
  Tags.find({text: searchTerm}).limit(10).exec( function (err, tags) {
    if (err) return next(err);
    res.json(tags);
  });
});

module.exports = router;
