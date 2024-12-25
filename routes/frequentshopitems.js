'use strict';

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Shopitem = require('../models/Shopitem');
const auth = require('../auth/auth');

router.use(auth.isAuthenticated);

// Get all frequent shop items
router.get('/', function(req, res, next) {
  Shopitem.find({ user: req.user._id })
    .sort('-frequency')
    .limit(10)
    .exec()
    .then(items => {
      res.json(items);
    })
    .catch(err => {
      res.status(500).json({ error: err.message });
    });
});

// Add a new frequent shop item
router.post('/', function(req, res) {
  const shopitem = new Shopitem({
    name: req.body.name,
    user: req.user._id,
    frequency: 1
  });

  shopitem.save()
    .then(item => {
      res.status(201).json(item);
    })
    .catch(err => {
      res.status(500).json({ error: err.message });
    });
});

// Update frequency of shop items
router.put('/batch', function(req, res) {
  const updates = req.body.items.map(item => ({
    updateOne: {
      filter: { _id: item._id, user: req.user._id },
      update: { $inc: { frequency: 1 } }
    }
  }));

  Shopitem.bulkWrite(updates)
    .then(() => {
      res.status(200).json({ message: 'Frequencies updated successfully' });
    })
    .catch(err => {
      res.status(500).json({ error: err.message });
    });
});

module.exports = router;
