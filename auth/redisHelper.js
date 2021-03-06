var redis = require('redis');
var redisClient = redis.createClient();
var auth = require('./auth');

redisClient.on('error', function(err) {
	throw err;
});

/*
* Stores a token with user data for a ttl period of time
* token: String - Token used as the key in redis 
* data: Object - value stored with the token 
* ttl: Number - Time to Live in seconds (default: 24Hours)
* callback: Function
*/
exports.setTokenWithData = function(token, data, ttl, callback) {
	if (token == null) throw new Error('Token is null');
	if (data != null && typeof data !== 'object') throw new Error('data is not an Object');

	var userData = data || {};
	userData._ts = new Date();

	var timeToLive = ttl || auth.TIME_TO_LIVE;
	if (timeToLive != null && typeof timeToLive !== 'number') throw new Error('TimeToLive is not a Number');


	redisClient.setex(token, timeToLive, JSON.stringify(userData), function(err, reply) {
		if (err) callback(err);

		if (reply) {
			callback(null, true);
		} else {
			callback(new Error('Token not set in redis'));
		}
	});
	
};

/*
* Gets the associated data of the token.
* token: String - token used as the key in redis
* callback: Function - returns data
*/
exports.getDataByToken = function(token, callback) {
	if (token == null) callback(new Error('Token is null'));

	redisClient.get(token, function(err, userData) {
		if (err) callback(err);

		if (userData != null) callback(null, JSON.parse(userData));
		else callback(new Error('Token Not Found'));
	});
};

/*
* Renew a token by updating the entry in redis
* callback(null, true) if successfuly updated
*/
exports.renewToken = function(token, ttl, callback) {
	if (token == null) callback(new Error('Token is null'));

	redisClient.expire(token, ttl, function(err, reply) {
		if (err) callback(err);

		if (reply) callback(null, true);
		else callback(new Error('Token not found'));
	});
};

/*
* Expires a token by deleting the entry in redis
* callback(null, true) if successfuly deleted
*/
exports.expireToken = function(token, callback) {
	if (token == null) callback(new Error('Token is null'));

	redisClient.del(token, function(err, reply) {
		if (err) callback(err);
		/*if (reply) console.log(err);
		if (reply) callback(null, true);*/
		if (!reply) callback(new Error('Token not found'));
	});
};
