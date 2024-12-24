/**
 * Main application entry point for the Recipe App
 * Sets up Express server, database connection, routes, and middleware
 * Handles API endpoints for recipe management, meal planning, and shopping lists
 */

// Load environment variables
require('dotenv').config();

// Core dependencies
var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var helmet = require('helmet');
var rateLimit = require('express-rate-limit');

// Authentication middleware
var auth = require('./auth/auth');

// Configure API rate limiter
const apiLimiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MS || 900000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX_REQUESTS || 1000, // Limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Route handlers for different features

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
var randomitems = require('./routes/randomitems');

var PORT = process.env.PORT || 3000;

// Database connection
var mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connection successful'))
  .catch(err => console.log('MongoDB connection error:', err));
mongoose.set('debug', true)


// Initialize Express application
var app = express();
app.disable("X-powered-by") // Security: Hide Express

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Security middleware
app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    imgSrc: ["'self'", "data:", "blob:"],
    connectSrc: ["'self'", "https://www.rezept-planer.de"],
    formAction: ["'self'"],
    frameAncestors: ["'none'"]
  }
}));

// Apply rate limiting only to API routes
app.use('/api/', apiLimiter);

// Request size limits
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: false, limit: '10mb' }));

app.use(logger(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));
app.use(cookieParser(process.env.SESSION_SECRET));
app.use(express.static(path.join(__dirname, 'cordova-app/www/'), {
  maxAge: '1d',
  etag: true
}));


// CORS middleware with more secure configuration
app.all('/api/*', function(req, res, next) {
  // In production, replace * with specific origin
  const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000', 'http://127.0.0.1:3000'];
    
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Credentials", "true");
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  return next();
});

// Security headers middleware
app.use((req, res, next) => {
  res.header("X-XSS-Protection", "1; mode=block");
  res.header("X-Frame-Options", "DENY");
  res.header("X-Content-Type-Options", "nosniff");
  res.header("Referrer-Policy", "strict-origin-same-origin");
  next();
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
app.use('/api/randomitems', randomitems);


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
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}
