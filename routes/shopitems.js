const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const Shopitem = require('../models/Shopitem.js');
const Ingredient = require('../models/Ingredient.js');

const auth = require('../auth/auth.js');

/* GET /shopitems listing. */
router.get('/', auth.verify, function(req, res, next) {
  Shopitem.find({author: req._user.id, expire_date: {'$gte': new Date()}}, 'schedule recipe ingredient unit amount updated_at completed').populate('schedule', 'date').populate('recipe', 'name').populate('ingredient','category subcategory subsubcategory name').populate('unit','name').lean().exec( function (err, shopitems) {
    if (err) return next(err);
    res.json(shopitems);
  });
});

/* POST /shopitems */
router.post('/', auth.verify, function(req, res, next) {
  req.body.author = req._user.id;
  Shopitem.create(req.body, function (err, shopitems) {
    if (err) return next(err);
    res.json(shopitems);
  });
});

/* GET /shopitems/id */
router.get('/:id', auth.verify, function(req, res, next) {
  Shopitem.findById(req.params.id).populate(['schedule', 'recipe', 'ingredient', 'unit']).exec( function (err, shopitems) {
    if (err) return next(err);
    res.json(shopitems);
  });
});

/* PUT /shopitems/:id */
router.put('/:id', auth.verify, function(req, res, next) {
  req.body.author = req._user.id;
  req.body.updated_at = new Date();
  req.body.expire_date = new Date();
  if (req.body.completed === true) {
    req.body.expire_date.setHours(req.body.expire_date.getHours() + 1);
  }
  else if (req.body.schedule && req.body.schedule.date) {
    req.body.expire_date = new Date(req.body.schedule.date);
    req.body.expire_date.setHours(req.body.expire_date.getHours() + 12);
  } else {
    req.body.expire_date.setDate(req.body.expire_date.getDate() + 14);
  }
  Shopitem.findByIdAndUpdate(req.params.id, req.body, function (err, shopitems) {
    if (err) return next(err);
    res.json(shopitems);
  });
});


/* DELETE /shopitems */
router.delete('/:id', auth.verify, function(req, res, next) {
  Shopitem.findByIdAndRemove(req.params.id, req.body, function (err, shopitems) {
    if (err) return next(err);
    res.json(shopitems);
  });
});

/* DELETE ALL /shopitems/:id */
router.delete('/', auth.verify, function(req, res, next) {
  Shopitem.remove({author: req._user.id, expire_date: {'$gte': new Date()}}, function (err, shopitems) {
    if (err) return next(err);
    res.json(shopitems);
  });
});

module.exports = router;
