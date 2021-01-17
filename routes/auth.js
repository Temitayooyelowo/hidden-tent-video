const express = require('express');
const path = require('path');
const router = express.Router();

const passport = require('passport');

const User = require('../db/models/User');

router.post('/register', (req,res) => {
  User.register({username: req.body.username, videoRatings: []}, req.body.password, (err,user) => {
      if(err){
          console.log(err);
          return res.status(401).send({
            message: 'User unauthorized or credentials mismatch',
          });
          // res.redirect('/auth/register');
      }else{
          passport.authenticate('local')(req,res, () => {
            return res.status(200).send({
              message: 'Authentication Successful',
            });
            // res.redirect('/')
          });
      }
  });
});

router.post('/login', (req,res) => {
  const user = new User({
      username: req.body.username,
      password: req.body.password
  });

  req.login(user, (err) => {
      if(err){
          console.log(err);
          return res.status(401).send({
            message: 'User unauthorized or credentials mismatch',
          });
      }else {
          console.log('success');
          passport.authenticate('local')(req,res, () => {
              // res.redirect('/');
              // console.log("Corrrect authentication");
              return res.status(200).send({
                message: 'Authentication Successful',
              });
          });
      }
  });
});

// // /* LOGIN ROUTER */
// router.get('/login',function(req, res, next) {
//   console.log("In login router");
//   if (req.isAuthenticated()) {
//     return res.redirect('/');
//   }
//   res.sendFile(path.join(__dirname, '../public', 'login.html'));
// });

// router.get('/register',function(req, res, next) {
//   console.log("In register router");
//   if (req.isAuthenticated()) {
//     return res.redirect('/');
//     //res.status(400).send('Registration invalid...');
//   }
//   res.sendFile(path.join(__dirname, '../public', 'register.html'));
// });

// router.get('/logout2',function(req, res, next) {
//   console.log("In logout router");
//   if (!req.isAuthenticated()) {
//     return res.redirect('/auth/login');
//   }
//   res.sendFile(path.join(__dirname, '../public', 'logout.html'));
// });

/* LOGOUT ROUTER */
router.get('/logout', function(req, res){
  req.logout();
  res.redirect('/auth/login');
});

module.exports = router;
