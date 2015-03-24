var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

//var routes = require('./routes/index');
//var todos = require('./routes/todos');
var main = require('./routes/index');
var units = require('./routes/units');
var ingredients = require('./routes/ingredients');
var recipes = require('./routes/recipes');
var tags = require('./routes/tags');
var schedules = require('./routes/schedules');
var shopitems = require('./routes/shopitems');

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

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', main);
app.use('/units', units);
app.use('/ingredients', ingredients);
app.use('/recipes', recipes);
app.use('/tags', tags);
app.use('/schedules', schedules);
app.use('/shopitems', shopitems);

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


