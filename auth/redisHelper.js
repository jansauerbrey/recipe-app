var redis = require('redis');
var auth = require('./auth');

const redisClient = redis.createClient({
    url: 'redis://localhost:6379'
});

// Connect to Redis
(async () => {
    redisClient.on('error', function(err) {
        console.error('Redis Client Error', err);
    });
    await redisClient.connect();
})();

/*
* Stores a token with user data for a ttl period of time
* token: String - Token used as the key in redis 
* data: Object - value stored with the token 
* ttl: Number - Time to Live in seconds (default: 24Hours)
* callback: Function
*/
exports.setTokenWithData = async function(token, data, ttl, callback) {
	if (token == null) throw new Error('Token is null');
	if (data != null && typeof data !== 'object') throw new Error('data is not an Object');

	var userData = data || {};
	userData._ts = new Date();

	var timeToLive = ttl || auth.TIME_TO_LIVE;
	if (timeToLive != null && typeof timeToLive !== 'number') throw new Error('TimeToLive is not a Number');


	try {
		await redisClient.setEx(token, timeToLive, JSON.stringify(userData));
		callback(null, true);
	} catch (err) {
		callback(err);
	}
	
};

/*
* Gets the associated data of the token.
* token: String - token used as the key in redis
* callback: Function - returns data
*/
exports.getDataByToken = async function(token, callback) {
	if (token == null) callback(new Error('Token is null'));

	try {
		const userData = await redisClient.get(token);
		if (userData != null) callback(null, JSON.parse(userData));
		else callback(new Error('Token Not Found'));
	} catch (err) {
		callback(err);
	}
};

/*
* Renew a token by updating the entry in redis
* callback(null, true) if successfuly updated
*/
exports.renewToken = async function(token, ttl, callback) {
	if (token == null) callback(new Error('Token is null'));

	try {
		const reply = await redisClient.expire(token, ttl);
		if (reply) callback(null, true);
		else callback(new Error('Token not found'));
	} catch (err) {
		callback(err);
	}
};

/*
* Expires a token by deleting the entry in redis
* callback(null, true) if successfuly deleted
*/
exports.expireToken = async function(token, callback) {
	if (token == null) callback(new Error('Token is null'));

	try {
		const reply = await redisClient.del(token);
		if (reply) callback(null, true);
		else callback(new Error('Token not found'));
	} catch (err) {
		callback(err);
	}
};
