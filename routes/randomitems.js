var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var Recipe = require('../models/Recipe.js');

var auth = require('../auth/auth.js');

/* GET /randomitems/recipes/:number */
router.get('/recipes/:number', auth.verify, function(req, res, next) {
  //var preferredLanguage = (req._user.settings && req._user.settings.preferredLanguage) ? req._user.settings.preferredLanguage : 'en';
  Recipe.aggregate({ $sample: { size: parseInt(req.params.number) } }).exec( function (err, recipes) {
    if (err) return next(err);
    res.json(recipes);
  });
});


module.exports = router;
