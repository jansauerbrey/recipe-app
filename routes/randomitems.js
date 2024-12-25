const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const Recipe = require('../models/Recipe.js');

const auth = require('../auth/auth.js');

/* GET /randomitems/recipes/:number */
router.get('/recipes/:number', auth.verify, function(req, res, next) {
  //var preferredLanguage = (req._user.settings && req._user.settings.preferredLanguage) ? req._user.settings.preferredLanguage : 'en';
  Recipe.aggregate({ $sample: { size: parseInt(req.params.number) } }).exec( function (err, recipes) {
    if (err) return next(err);
    res.json(recipes);
  });
});


module.exports = router;
