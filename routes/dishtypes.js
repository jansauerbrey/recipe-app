const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const DishType = require('../models/DishType.js');

const auth = require('../auth/auth.js');

/* GET /dishtypes listing. */
router.get('/', auth.verify, function(req, res, next) {
  DishType.find( null, null, {sort:{'order': 1 }},function (err, dishtypes) {
    if (err) return next(err);
    res.json(dishtypes);
  });
});

/* POST /dishtypes */
router.post('/', auth.verifyAdmin, function(req, res, next) {
  req.body.author = req._user.id;
  DishType.create(req.body, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

/* GET /dishtypes/id */
router.get('/:id', auth.verify, function(req, res, next) {
  DishType.findById(req.params.id, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

/* PUT /dishtypes/:id */
router.put('/:id', auth.verifyAdmin, function(req, res, next) {
  req.body.author = req._user.id;
  DishType.findByIdAndUpdate(req.params.id, req.body, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

/* DELETE /dishtypes/:id */
router.delete('/:id', auth.verifyAdmin, function(req, res, next) {
  DishType.findByIdAndRemove(req.params.id, req.body, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

module.exports = router;
