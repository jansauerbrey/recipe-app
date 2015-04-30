var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var Shopitem = require('../models/Shopitem.js');

var auth = require('../auth/auth.js');

/* GET /shopitems listing. */
router.get('/', auth.verify, function(req, res, next) {
  Shopitem.find({author: req._user.id}).populate(['schedule', 'recipe', 'ingredient', 'unit']).exec( function (err, shopitems) {
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
