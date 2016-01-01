var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var Recipe = require('../models/Recipe.js');

var auth = require('../auth/auth.js');

/* GET /recipes listing. */
router.get('/', auth.verify, function(req, res, next) {
    //console.log("start");
  var preferredLanguage = (req._user.settings && req._user.settings.preferredLanguage) ? req._user.settings.preferredLanguage : 'en';
  if (Object.keys(req.query).length === 0) {
    //console.log("load recipes");
    Recipe.find({}, 'author updated_at dishType').populate('dishType', 'name.'+preferredLanguage+' order imagePath').lean().exec( function (err, recipes) {
      //console.log(err);
      if (err) return next(err);
      //console.log(recipes);
      var newIndicatorDate = new Date();
      newIndicatorDate.setDate(newIndicatorDate.getDate() - 14);
      for(i=0;i<recipes.length;i++){
				recipes[i].new_recipe = (new Date(recipes[i].updated_at) > newIndicatorDate) ? true : false;
					if (recipes[i].dishType && recipes[i].dishType.name) {
					recipes[i].dishType.name_translated = recipes[i].dishType.name[preferredLanguage];
					recipes[i].dishType.name = undefined;
				}
				//console.log(req._user);
				//console.log('recipes[i]._id: ' + recipes[i]._id);
				recipes[i].fav_recipe = (req._user.favoriteRecipes && req._user.favoriteRecipes.indexOf(recipes[i]._id) > -1) ? true : false;
      }
      res.json(recipes);
    });
  } else {
    if (req.query.updated_at) {
      req.query.updated_at = {'$gt': req.query.updated_at};
    };
    if (req.query._id) {
      req.query._id = {'$in': req._user.favoriteRecipes};
    };
    Recipe.find(req.query).populate(['tags']).populate('author', 'fullname').lean().exec( function (err, recipes) {
      if (err) return next(err);
      var newIndicatorDate = new Date();
      newIndicatorDate.setDate(newIndicatorDate.getDate() - 14);
      for(i=0;i<recipes.length;i++){
        recipes[i].new_recipe = (new Date(recipes[i].updated_at) > newIndicatorDate) ? true : false;
        recipes[i].fav_recipe = (req._user.favoriteRecipes && req._user.favoriteRecipes.indexOf(recipes[i]._id) > -1) ? true : false;
      }
      res.json(recipes);
    });
  }
});

/* POST /recipes */
router.post('/', auth.verify, function(req, res, next) {
  req.body.author = req._user.id;
  var recipe = new Recipe(req.body);
  recipe.save( function (err, recipe) {
    if (err) return next(err);
    res.json(recipe);
  });
});

/* GET /recipes/id */
router.get('/:id', auth.loadUser, function(req, res, next) {
  var preferredLanguage = (req._user && req._user.settings && req._user.settings.preferredLanguage) ? req._user.settings.preferredLanguage : 'en';
  Recipe.findById(req.params.id).populate(['tags', 'ingredients.ingredient', 'ingredients.unit']).populate('author', 'fullname').populate('dishType', 'name.'+preferredLanguage).lean().exec( function (err, recipe) {
    if (err) return next(err);
    recipe.dishType.name_translated = recipe.dishType.name[preferredLanguage];
    var newIndicatorDate = new Date();
    newIndicatorDate.setDate(newIndicatorDate.getDate() - 14);
    recipe.new_recipe = (new Date(recipe.updated_at) > newIndicatorDate) ? true : false;
    recipe.fav_recipe = (req._user && req._user.favoriteRecipes && req._user.favoriteRecipes.indexOf(recipe._id) > -1) ? true : false;
    res.json(recipe);
  });
});

/* PUT /recipes/:id */
router.put('/:id', auth.verify, function(req, res, next) {
  var preferredLanguage = (req._user.settings && req._user.settings.preferredLanguage) ? req._user.settings.preferredLanguage : 'en';
  Recipe.findById(req.params.id).populate('author', 'fullname').exec( function (err, recipe) {
    if (err) return next(err);
    if (req._user.id == recipe.author._id || req._user.is_admin === true) {
      Recipe.findByIdAndUpdate(req.params.id, req.body, { 'new': true}).populate(['tags', 'ingredients.ingredient', 'ingredients.unit']).populate('author', 'fullname').populate('dishType', 'name.'+preferredLanguage).lean().exec( function (err, recipe) {
        if (err) return next(err);
        recipe.dishType.name_translated = recipe.dishType.name[preferredLanguage];
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
