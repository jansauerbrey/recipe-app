var redisHelper = require('./redisHelper');
var tokenHelper = require('./tokenHelper');
var User = require('../models/User.js');
var TIME_TO_LIVE = 300; //5 minutes


/*
* Middleware to verify the token and store the user data in req._user
*/
exports.loadUser = function(req, res, next) {
	var headers = req.headers;
	var token;
	if (headers != null){
		// Get token
		try {
			token = tokenHelper.extractTokenFromHeader(headers);
		} catch (err) {
			console.log(err);
		}
	}

	//Verify it in redis, set data in req._user
	if (token) {
		redisHelper.getDataByToken(token, function(err, data) {
			if (!err){
		
				if (data.autologin === true){
					TIME_TO_LIVE = 60*60*24*30;
				}
		    
		    try {
					redisHelper.renewToken(token, TIME_TO_LIVE, function(err, success){
						return (err, success);
					});
				} catch (err) {
					console.log(err);
					next();
				}
				console.log(data);
				User.findOne({username: data.username}, function (err, user) {
					req._user = user;
				});
			}
		});
	}
	next();
};


exports.verify = function(req, res, next) {
	var headers = req.headers;
	if (headers == null) return res.sendStatus(401);

	// Get token
	try {
		var token = tokenHelper.extractTokenFromHeader(headers);
	} catch (err) {
		console.log(err);
		return res.sendStatus(401);
	}

	//Verify it in redis, set data in req._user
	redisHelper.getDataByToken(token, function(err, data) {
		if (err) return res.sendStatus(401);

		if (data.autologin === true){
			TIME_TO_LIVE = 60*60*24*30;
		}
                try {
			redisHelper.renewToken(token, TIME_TO_LIVE, function(err, success){
				return (err, success);
			});
		} catch (err) {
			console.log(err);
			return res.sendStatus(401);
		}
		User.findOne({username: data.username}, function (err, user) {
			req._user = user;
			next();
		});
	});
};

/*
* Middleware to verify the token and admin level and store the user data in req._user
*/
exports.verifyAdmin = function(req, res, next) {
	var headers = req.headers;
	if (headers == null) return res.send(401);

	// Get token
	try {
		var token = tokenHelper.extractTokenFromHeader(headers);
	} catch (err) {
		console.log(err);
		return res.sendStatus(401);
	}

	//Verify it in redis, set data in req._user
	redisHelper.getDataByToken(token, function(err, data) {
		if (err) return res.sendStatus(401);

		if (data.is_admin) {
			if (data.autologin === true){
				TIME_TO_LIVE = 60*60*24*30;
			}
		        try {
				redisHelper.renewToken(token, TIME_TO_LIVE, function(err, success){
					return (err, success);
				});
			} catch (err) {
				console.log(err);
				return res.sendStatus(401);
			}
			User.findOne({username: data.username}, function (err, user) {
				req._user = user;
				next();
			});
		}
		else {
			return res.sendStatus(401);
		}
	});
};

/*
* Create a new token, stores it in redis with data during ttl time in seconds
* callback(err, token);
*/
exports.createAndStoreToken = function(data, ttl, callback) {
	data = data || {};
	ttl = ttl || TIME_TO_LIVE;

	if (data != null && typeof data !== 'object') callback(new Error('data is not an Object'));
	if (ttl != null && typeof ttl !== 'number') callback(new Error('ttl is not a valid Number'));

	tokenHelper.createToken(function(err, token) {
		if (err) callback(err);

		redisHelper.setTokenWithData(token, data, ttl, function(err, success) {
			if (err) callback(err);

			if (success) {
				callback(null, token);
			}
			else {
				callback(new Error('Error when saving token'));
			}
		});
	});
};

/*
* Expires the token (remove from redis)
*/
exports.expireToken = function(headers, callback) {
	if (headers == null) callback(new Error('Headers are null'));
	// Get token
	try {
		var token = tokenHelper.extractTokenFromHeader(headers);

		if (token == null) callback(new Error('Token is null'));

		redisHelper.expireToken(token, callback);
	} catch (err) {
		console.log(err);
		return callback(err);
	}	
}
