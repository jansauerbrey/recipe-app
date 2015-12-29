var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var Shopitem = require('../models/Shopitem.js');
var Ingredient = require('../models/Ingredient.js');
var Unit = require('../models/Unit.js');

var auth = require('../auth/auth.js');

/* GET /shopitems/frequent most common manual added ingredients */
router.get('/', auth.verify, function(req, res, next) {
  Shopitem.aggregate([
        { $match: {
            $and: [ {recipe: null},
            				{ingredient: { $exists:true }},
            				{ingredient: { $ne: null }},
            				{author: mongoose.Types.ObjectId(req._user.id)}
	    						]
        	}
       	},
        { $group: {
            _id: {ingredient: "$ingredient", unit: "$unit"},
            count: { $sum: 1  }
        	}
        },
				{ $sort : { count : -1 } },
				{ $limit: 36 },
				{ $project: {
						_id: 0,
						ingredient: "$_id.ingredient",
						unit: "$_id.unit"
					}
				}
    	], function (err, result) {
        if (err) {
            console.log(err);
            return;
        }
				Ingredient.populate(result, {path: "ingredient"}, function(err, ingredients){
					Unit.populate(ingredients, {path: "unit"}, function(err, response){
						res.json(response);
				});
				});
    });
});

module.exports = router;
