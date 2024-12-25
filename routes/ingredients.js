const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const Ingredient = require('../models/Ingredient.js');

const auth = require('../auth/auth.js');

/* GET /ingredients listing. */
router.get('/', auth.verify, function(req, res, next) {
  Ingredient.find(req.query, null, {sort:{'name.de': 1 }}, function (err, ingredients) {
    if (err) return next(err);
    res.json(ingredients);
  });
});

/* POST /ingredients */
router.post('/', auth.verifyAdmin, function(req, res, next) {
  req.body.author = req._user.id;
  Ingredient.create(req.body, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

/* GET /ingredients/:id */
router.get('/:id', auth.verify, function(req, res, next) {
  Ingredient.findById(req.params.id, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

/* PUT /ingredients/:id */
router.put('/:id', auth.verifyAdmin, function(req, res, next) {
  req.body.author = req._user.id;
  Ingredient.findByIdAndUpdate(req.params.id, req.body, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

/* DELETE /ingredients/:id */
router.delete('/:id', auth.verifyAdmin, function(req, res, next) {
  Ingredient.findByIdAndRemove(req.params.id, req.body, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});


module.exports = router;
