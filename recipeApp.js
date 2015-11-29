var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var auth = require('./auth/auth');

var admin = require('./routes/admin');
var user = require('./routes/user');
var dishtypes = require('./routes/dishtypes');
var units = require('./routes/units');
var ingredients = require('./routes/ingredients');
var categories = require('./routes/categories');
var recipes = require('./routes/recipes');
var tags = require('./routes/tags');
var schedules = require('./routes/schedules');
var shopitems = require('./routes/shopitems');
var frequentshopitems = require('./routes/frequentshopitems');
var typeahead = require('./routes/typeahead');
var upload = require('./routes/upload');

var PORT = 3000;

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/recipeApp', function(err) {
    if(err) {
        console.log('connection error', err);
    } else {
        console.log('connection successful');
    }
});
mongoose.set('debug', true)


var app = express();
app.disable("X-powered-by")

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
//app.use(express.static(path.join(__dirname, 'cordova-app/www/')));


//app.get('/', function(req, res, next) {
//  res.render('index', { title: 'Recipe App' });
//});

app.all('/api/*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS");
  return next();
});

app.use('/api/admin', admin);
app.use('/api/user', user);
app.use('/api/dishtypes', dishtypes);
app.use('/api/units', units);
app.use('/api/ingredients', ingredients);
app.use('/api/categories', categories);
app.use('/api/recipes', recipes);
app.use('/api/tags', tags);
app.use('/api/schedules', schedules);
app.use('/api/shopitems', shopitems);
app.use('/api/frequentshopitems', frequentshopitems);
app.use('/api/typeahead', typeahead);
app.use('/api/upload', upload);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;

/**
 * Module dependencies.
 */

var debug = require('debug')('recipeApp:server');
var http = require('http');

/**
 * Get port and store in Express.
 */

app.set('port', PORT);

/**
 * Create HTTP server.
 */

var server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(PORT);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof PORT === 'string'
    ? 'Pipe ' + PORT
    : 'Port ' + PORT;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.PORT;
  debug('Listening on ' + bind);
}
