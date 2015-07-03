var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var Shopitem = require('../models/Shopitem.js');

var auth = require('../auth/auth.js');

/* GET /shopitems listing. */
router.get('/', auth.verify, function(req, res, next) {
  Shopitem.find({author: req._user.id, expire_date: {'$gte': new Date()}}).populate(['schedule', 'recipe', 'ingredient', 'unit']).exec( function (err, shopitems) {
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
  Shopitem.findById(req.params.id).populate().exec( function (err, shopitems) {
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

/* DELETE /shopitems/:id */
router.delete('/:id', auth.verify, function(req, res, next) {
  Shopitem.findByIdAndRemove(req.params.id, req.body, function (err, shopitems) {
    if (err) return next(err);
    res.json(shopitems);
  });
});

module.exports = router;
