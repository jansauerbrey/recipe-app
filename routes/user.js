const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const User = require('../models/User.js');

const auth = require('../auth/auth.js');
const tokenHelper = require('../auth/tokenHelper.js');

const nodemailer = require('nodemailer');
// create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: 'localhost',
  port: 1025,  // Default port for Mailhog
  ignoreTLS: true
});

/* GET /user/info. */
router.get('/info', auth.verify, function(req, res, next) {
  User.findById( req._user.id, 'username fullname email is_admin settings favoriteRecipes', function (err, user) {
    if (err) return next(err);
    res.json(user);
  });
});

/* PUT /user/info */
router.put('/info/:id', auth.verify, function(req, res, next) {
  const fullname = req.body.fullname || '';
  const settings = req.body.settings || '';
  
  if (fullname == '' || settings == '') {
    return res.send(401);
  }
  const userInfo = {fullname: req.body.fullname, settings: req.body.settings};
  User.findByIdAndUpdate(req._user.id, userInfo, { 'new': true}).select('username fullname email is_admin settings favoriteRecipes').exec( function (err, user) {
    if (err) return next(err);
    res.json(user);
  });
});

/* GET /user/info/id */
router.get('/info/:id', auth.verify, function(req, res, next) {
  User.findById(req.params.id, 'fullname', function (err, user) {
    if (err) return next(err);
    res.json(user);
  });
});

/* ADD or DELETE /user/favorites/:id */
router.put('/favorites/:id', auth.verify, function(req, res, next) {
  if (req.body.method == 'delete'){
    User.findByIdAndUpdate(req._user.id, {$pull: {favoriteRecipes: req.params.id}}, { 'new': true}).select('username fullname email is_admin settings favoriteRecipes').exec( function (err, user) {
      if (err) return next(err);
      res.json(user);
    });
  } else if (req.body.method == 'add'){
    User.findByIdAndUpdate(req._user.id, {$push: {favoriteRecipes: req.params.id}}, { 'new': true}).select('username fullname email is_admin settings favoriteRecipes').exec( function (err, user) {
      if (err) return next(err);
      res.json(user);
    });
  }
});


/* GET /user/check */
router.get('/check', auth.verify, function(req, res, next) {
  return res.sendStatus(200);
});

/* LOGIN */
router.post('/login', function(req, res, next) {
  //verify credential (use POST)
  const username = req.body.username.toLowerCase() || '';
  const password = req.body.password || '';
  const autologin = req.body.autologin || false;
 
  if (username == '' || password == '') {
    return res.send(401);
  }

  User.findOne({username_lower: username}, function (err, user) {
    if (err) {
      console.log(err);
      return res.sendStatus(401);
    }

    if (user == undefined) {
      console.log('User undefined');
      return res.sendStatus(401);
    }
 
    if (user.is_activated === false) {
      console.log('User not activated');
      return res.sendStatus(401);
    }

    console.log(user);
    user.comparePassword(password, function(isMatch) {
      if (!isMatch) {
        console.log('Attempt failed to login with ' + user.username);
        return res.sendStatus(401);
      }
 
      const userDataForRedis = {id: user._id, username: user.username, is_admin: user.is_admin, autologin: autologin};
      const userData = user;
      let expiration = 300; // 5 minutes

      if (autologin === true) {
        expiration = 60*60*24*30; //30 days
      }

      auth.createAndStoreToken(userDataForRedis, expiration, function(err, token) {
        if (err) {
          console.log(err);
          return res.sendStatus(400);
        }

        //Send back token
        return res.json({token: token, is_admin: userData.is_admin, email: userData.email, fullname: userData.fullname, _id: userData._id, username: userData.username, settings: userData.settings});
      });
    });
  });
});

/* LOGOUT */
router.get('/logout', auth.verify, function(req, res) {
  auth.expireToken(req.headers);
  return res.sendStatus(200);
});


/* REGISTER */
router.post('/register', function(req, res, next) {
  const username = req.body.username || '';
  const username_lower = username.toLowerCase();
  const password = req.body.password || '';
  const passwordConfirmation = req.body.passwordConfirmation || '';
  const email = req.body.email || '';
  const emailConfirmation = req.body.emailConfirmation || '';
  const fullname = req.body.fullname || '';
  const preferredLanguage = req.body.settings.preferredLanguage  || 'en';
  const spokenLanguages = req.body.settings.spokenLanguages || ['en'];
  
  if (username == '' || password == '' || password != passwordConfirmation || email == '' || fullname == '' || email != emailConfirmation) {
    return res.sendStatus(400);
  }
  
  const userData = {
    username: username,
    username_lower: username_lower,
    password: password,
    emailNotConfirmed: email,
    fullname: fullname,
    settings: {
      preferredLanguage: preferredLanguage,
      spokenLanguages: spokenLanguages,
      autoupdate: true,
      preferredWeekStartDay: 1,
      categoryOrder: ['Obst \u0026 Gem\xFCse','Fr\xFChst\xFCck','Servicetheke','Nahrungsmittel','Weitere Bereiche','Drogerie','Baby \u0026 Kind','K\xFChlprodukte','S\xFCssigkeiten','Getr\xE4nke','Haushalt','Tiefk\xFChl']
    }
  };
  
  // First check if username already exists (case-insensitive)
  User.findOne({ username_lower: username_lower }, function(err, existingUser) {
    if (err) {
      console.error('Registration error:', err);
      return res.status(400).json({
        error: 'Registration failed. Please try again.'
      });
    }
    
    if (existingUser) {
      return res.status(400).json({
        error: 'Username already exists (case-insensitive). Please choose a different username.'
      });
    }
    
    // If username is unique, create token and proceed with user creation
    tokenHelper.createToken(function(err, token) {
      if (err) {
        console.error('Token creation error:', err);
        return res.status(400).json({
          error: 'Registration failed. Please try again.'
        });
      }
      
      userData.emailConfirmationToken = token;
      
      // Create the user
      User.create(userData, function(err) {
        if (err) {
          console.error('User creation error:', err);
          if (err.code === 11000) {
            // Extract the duplicate key field from the error message
            const field = err.message.match(/index: ([^\s]+)/)[1];
            const value = err.message.match(/{ ([^:]+): "([^"]+)"/)[2];
            return res.status(400).json({
              error: `Username "${value.trim()}" is already taken. Please choose a different username.`
            });
          }
          return res.status(400).json({
            error: 'Registration failed. Please try again.'
          });
        }
        
        // Check if this is the first user
        User.count(function(err, counter) {
          if (err) {
            return next(err);
          }
          
          if (counter == 1) {
            // First user becomes admin
            User.update({username: username}, {is_admin: true, is_activated: true}, function(err, nbRow) {
              if (err) {
                return next(err);
              }
              console.log('First user created as an Admin');
              return res.sendStatus(200);
            });
          } else {
            // Auto-activate the account for development
            User.update({username: username}, {is_activated: true, email: email}, function(err, nbRow) {
              if (err) {
                return next(err);
              }
              console.log('User account auto-activated');
              return res.sendStatus(200);
            });
          }
        });
      });
    });
  });
});

/* CONFIRM EMAIL ADDRESS */
router.get('/confirm/:token', function(req, res, next) {
  User.findOne({emailConfirmationToken: req.params.token}, function (err, user) {
    if (err) return next(err);
    if (user == undefined) {
      console.log('User undefined');
      return res.sendStatus(401);
    }
    user.is_activated = true;
    user.email = user.emailNotConfirmed;
    user.emailConfirmationToken = null;
    user.save(user, function (err, updatedUser) {
      if (err) return next(err);
      return res.sendStatus(200);
    });
  });
});

/* RESET PASSWORD */
router.post('/forgot', function(req, res) {
  //verify credential (use POST)
  const username = req.body.username.toLowerCase() || '';
  
  if (username == '') {
    return res.send(401);
  }
  
  User.findOne({username_lower: username}, function (err, user) {
    if (err) {
      console.log(err);
      return res.sendStatus(401);
    }
    
    if (user == undefined) {
      console.log('User undefined');
      return res.sendStatus(401);
    }
    
    if (user.is_activated === false) {
      console.log('User not activated');
      return res.sendStatus(401);
    }

    tokenHelper.createToken(function(err, token) {
      if (err) callback(err);
      resetPasswordExpires = Date.now() + 3600000; // 1 hour
      User.findByIdAndUpdate(user.id, {resetPasswordToken: token, resetPasswordExpires: resetPasswordExpires}, { 'new': true}, function (err, user) {
        if (err) return next(err);
        const mailOptions = {
          from: 'rezept-planer.de <admin@rezept-planer.de>', // sender address
          to: user.email, // list of receivers
          subject: 'Reset Password', // Subject line
          text: 'Please, use the following link to reset your password:\n\nhttps://www.rezept-planer.de/#/user/reset/'+user.resetPasswordToken+'\n\nYour rezept-planer.de Team', // plaintext body
        };
        transporter.sendMail(mailOptions, function(error, info){
          if(error){
            return console.log(error);
          }
          console.log('Message sent: ' + info.response);
          return res.sendStatus(200);
        });
      });
    });
  });
});

/* RESET PASSWORD FINAL */
router.put('/reset/:token', function(req, res, next) {
  const password = req.body.password || '';
  const passwordConfirmation = req.body.passwordConfirmation || '';

  if (password == '' || password != passwordConfirmation) {
    return res.sendStatus(400);
  }

  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() }}, function (err, user) {
    if (err) {
      console.log(err);
      return res.sendStatus(401);
    }

    if (user == undefined) {
      console.log('User undefined');
      return res.sendStatus(401);
    }
 
    if (user.is_activated === false) {
      console.log('User not activated');
      return res.sendStatus(401);
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = Date.now();
    const userToUpdate = new User(user);
    userToUpdate.isNew = false;
        
    userToUpdate.save(user, function (err, user) {
      if (err) return next(err);
      return res.sendStatus(200);
    });
  });
});

module.exports = router;
