const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const Tag = require('../models/Tag.js');
const Recipe = require('../models/Recipe.js');

const auth = require('../auth/auth.js');

/* GET /tags listing. */
router.get('/', auth.verify, function(req, res, next) {
  Tag.find(function (err, tags) {
    if (err) return next(err);
    res.json(tags);
  });
});

/* GET /tags listing incl. recipe count. */
router.get('/selected/', auth.verify, function(req, res, next) {
  Recipe.aggregate([
    {$match: { language: {'$in': req._user.settings.spokenLanguages} }},
    {$project: { _id: 0, tags: 1 } },
    {$unwind: '$tags' },
    {$group: { _id: '$tags', count: { $sum: 1 } }},
    {$project: { _id: 0,tags: '$_id', count: 1 } },
    {$sort: { count: -1 } }
  ]).exec( function (err, tags) {
    Recipe.populate(tags, {path: 'tags'}, function(err, response){
      if (err) return next(err);
      const finalResponse = [];
      response.forEach(function(item) {
        finalResponse.push({_id: item.tags._id, text: item.tags.text, author: item.tags.author, updated_at: item.tags.updated_at, count: item.count});
      });
      res.json(finalResponse);
    });
  });
});

/* POST /tags */
router.post('/', auth.verify, function(req, res, next) {
  req.body.author = req._user.id;
  Tag.create(req.body, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

/* GET /tags/:id */
router.get('/:id', auth.verify, function(req, res, next) {
  Tag.findById(req.params.id, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

/* PUT /tags/:id */
router.put('/:id', auth.verify, function(req, res, next) {
  req.body.author = req._user.id;
  Tag.findByIdAndUpdate(req.params.id, req.body, function (err, post) {
    if (err) return next(err);
    res.json(post);
  });
});

/* DELETE /tags/:id */
router.delete('/:id', auth.verify, function(req, res, next) {
  Tag.findById(req.params.id, function (err, tag) {
    if (err) return next(err);
    tag.remove();
    res.json(tag);
  });
});

module.exports = router;
