var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var Shopitem = require('../models/Shopitem.js');

/* GET /shopitems listing. */
router.get('/', function(req, res, next) {
  Shopitem.find(function (err, shopitems) {
    if (err) return next(err);
    res.json(shopitems);
  });
});

/* POST /shopitems */
router.post('/', function(req, res, next) {
  Shopitem.create(req.body, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

/* GET /shopitems/id */
router.get('/:id', function(req, res, next) {
  Shopitem.findById(req.params.id, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

/* PUT /shopitems/:id */
router.put('/:id', function(req, res, next) {
  Shopitem.findByIdAndUpdate(req.params.id, req.body, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

/* DELETE /shopitems/:id */
router.delete('/:id', function(req, res, next) {
  Shopitem.findByIdAndRemove(req.params.id, req.body, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

module.exports = router;
