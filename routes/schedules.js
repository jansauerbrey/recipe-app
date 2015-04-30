var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var Schedule = require('../models/Schedule.js');
var Shopitem = require('../models/Shopitem.js');

var auth = require('../auth/auth.js');

/* GET /schedules listing. */
router.get('/', auth.verify, function(req, res, next) {
  Schedule.find({author: req._user.id, date: {'$gte': req.query.startDate, '$lt': req.query.endDate}}).populate('recipe').exec( function (err, schedules) {
    if (err) return next(err);
    res.json(schedules);
  });
});

/* POST /schedules */
router.post('/', auth.verify, function(req, res, next) {
  req.body.author = req._user.id;
  Schedule.create(req.body, function (err, schedule) {
    if (err) return next(err);
    Schedule.findOne(schedule).populate('recipe').exec( function (err, schedulePop) {
      for(i=0;i<schedulePop.recipe.ingredients.length;i++){
        var amount = schedulePop.recipe.ingredients[i].qty/schedulePop.recipe.yield*schedulePop.factor;
        Shopitem.create({author: req._user.id, schedule: schedulePop, recipe: schedulePop.recipe, ingredient: schedulePop.recipe.ingredients[i].ingredient, unit: schedulePop.recipe.ingredients[i].unit, amount: amount})
      }
      res.json(schedulePop);
    });
  });
});

/* GET /schedules/:id */
router.get('/:id', auth.verify, function(req, res, next) {
  Schedule.findById(req.params.id, function (err, schedule) {
    if (err) return next(err);
    res.json(schedule);
  });
});

/* PUT /schedules/:id */
router.put('/:id', auth.verify, function(req, res, next) {
  req.body.author = req._user.id;
  Schedule.findByIdAndUpdate(req.params.id, req.body, function (err, schedule) {
    if (err) return next(err);
    res.json(schedule);
  });
});

/* DELETE /schedules/:id */
router.delete('/:id', auth.verify, function(req, res, next) {
  Schedule.findByIdAndRemove(req.params.id, req.body, function (err, schedule) {
    if (err) return next(err);
    Shopitem.remove({schedule: schedule._id}, function(shopitem) {
      res.json(schedule);
    });
  });
});

module.exports = router;
