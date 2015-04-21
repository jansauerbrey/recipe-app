var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var Ingredient = require('../models/Ingredient.js');

var auth = require('../auth/auth.js');

/* GET /ingredients listing. */
router.get('/ingredients/', auth.verify, function(req, res, next) {
  var searchTerm = new RegExp(req.query.search, 'i');
  Ingredient.find({'name.de': searchTerm}, function (err, ingredients) {
    if (err) return next(err);
    res.json(ingredients);
  });
});

module.exports = router;
