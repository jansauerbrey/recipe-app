var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var Recipe = require('../models/Recipe.js');

var auth = require('../auth/auth.js');

/* GET /recipes listing. */
router.get('/', auth.verify, function (req, res, next) {
  //console.log("start");
  var preferredLanguage = (req._user.settings && req._user.settings.preferredLanguage)
    ? req._user.settings.preferredLanguage
    : 'en';

  if (req.query.updated_at) {
    req.query.updated_at = { '$gt': req.query.updated_at };
  }
  if (req.query._id) {
    req.query._id = { '$in': req._user.favoriteRecipes };
  }
  if (req.query.author == 'self') {
    req.query.author = req._user._id;
  }
  req.query.language = { '$in': req._user.settings.spokenLanguages };
  Recipe.find(req.query).populate(['tags']).populate('author', 'fullname').lean().exec(
    function (err, recipes) {
      if (err) return next(err);
      var newIndicatorDate = new Date();
      newIndicatorDate.setDate(newIndicatorDate.getDate() - 14);
      for (i = 0; i < recipes.length; i++) {
        recipes[i].new_recipe = (new Date(recipes[i].updated_at) > newIndicatorDate) ? true : false;
        recipes[i].fav_recipe =
          (req._user.favoriteRecipes && req._user.favoriteRecipes.indexOf(recipes[i]._id) > -1)
            ? true
            : false;
      }
      res.json(recipes);
    },
  );
});

/* GET /recipes count. */
router.get('/count', auth.verify, function (req, res, next) {
  Recipe.aggregate([{
    $match: {
      language: { '$in': req._user.settings.spokenLanguages },
    },
  }, {
    $group: {
      _id: '$dishType',
      count: { $sum: 1 },
    },
  }, { $project: { dishType: '$_id', count: 1, _id: 0 } }]).exec(function (err, recipes) {
    Recipe.populate(
      recipes,
      { path: 'dishType', select: 'identifier imagePath' },
      function (err, response) {
        if (err) return next(err);
        var finalResponse = {};
        response.forEach(function (item) {
          finalResponse[item.dishType.identifier] = item.count;
        });
        Recipe.count({ language: { '$in': req._user.settings.spokenLanguages } }).exec(
          function (err, count) {
            if (err) return next(err);
            finalResponse.all = count;

            Recipe.count({
              author: req._user.id,
              language: { '$in': req._user.settings.spokenLanguages },
            }).exec(function (err, count) {
              if (err) return next(err);
              finalResponse.my = count;

              var updatedAtDate = new Date();
              updatedAtDate.setDate(updatedAtDate.getDate() - 14);
              Recipe.count({
                updated_at: { '$gt': updatedAtDate },
                language: { '$in': req._user.settings.spokenLanguages },
              }).exec(function (err, count) {
                if (err) return next(err);
                finalResponse.new = count;

                Recipe.count({
                  _id: { '$in': req._user.favoriteRecipes },
                  language: { '$in': req._user.settings.spokenLanguages },
                }).exec(function (err, count) {
                  if (err) return next(err);
                  finalResponse.favorites = count;

                  res.json(finalResponse);
                });
              });
            });
          },
        );
      },
    );
  });
});

/* GET /recipes count. */
router.get('/counttags', auth.verify, function (req, res, next) {
  Recipe.aggregate([
    { $match: { language: { '$in': req._user.settings.spokenLanguages } } },
    { $project: { _id: 0, tags: 1 } },
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $project: { _id: 0, tags: '$_id', count: 1 } },
    { $sort: { count: -1 } },
  ]).exec(function (err, tags) {
    Recipe.populate(tags, { path: 'tags' }, function (err, response) {
      if (err) return next(err);
      var finalResponse = [];
      response.forEach(function (item) {
        finalResponse.push({
          _id: item.tags._id,
          text: item.tags.text,
          author: item.tags.author,
          updated_at: item.tags.updated_at,
          count: item.count,
        });
      });
      res.json(finalResponse);
    });
  });
});

/* POST /recipes */
router.post('/', auth.verify, function (req, res, next) {
  req.body.author = req._user.id;
  var recipe = new Recipe(req.body);
  recipe.save(function (err, recipe) {
    if (err) return next(err);
    res.json(recipe);
  });
});

/* GET /recipes/id */
router.get('/:id', auth.loadUser, function (req, res, next) {
  console.log('accessing recipe id: ', req.params.id);
  var preferredLanguage = (req._user && req._user.settings && req._user.settings.preferredLanguage)
    ? req._user.settings.preferredLanguage
    : 'en';
  Recipe.findById(req.params.id).populate(['tags', 'ingredients.ingredient', 'ingredients.unit'])
    .populate('author', 'fullname').populate('dishType', 'name.' + preferredLanguage).lean().exec(
      function (err, recipe) {
        if (err) return next(err);
        recipe.dishType.name_translated = recipe.dishType.name[preferredLanguage];
        var newIndicatorDate = new Date();
        newIndicatorDate.setDate(newIndicatorDate.getDate() - 14);
        recipe.new_recipe = (new Date(recipe.updated_at) > newIndicatorDate) ? true : false;
        recipe.fav_recipe = (req._user && req._user.favoriteRecipes &&
            req._user.favoriteRecipes.indexOf(recipe._id) > -1)
          ? true
          : false;
        res.json(recipe);
      },
    );
});

/* PUT /recipes/:id */
router.put('/:id', auth.verify, function (req, res, next) {
  var preferredLanguage = (req._user.settings && req._user.settings.preferredLanguage)
    ? req._user.settings.preferredLanguage
    : 'en';
  Recipe.findById(req.params.id).populate('author', 'fullname').exec(function (err, recipe) {
    if (err) return next(err);
    if (req._user.id == recipe.author._id || req._user.is_admin === true) {
      Recipe.findByIdAndUpdate(req.params.id, req.body, { 'new': true }).populate([
        'tags',
        'ingredients.ingredient',
        'ingredients.unit',
      ]).populate('author', 'fullname').populate('dishType', 'name.' + preferredLanguage).lean()
        .exec(function (err, recipe) {
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
router.delete('/:id', auth.verify, function (req, res, next) {
  Recipe.findById(req.params.id).populate('author', 'fullname').exec(function (err, recipe) {
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
