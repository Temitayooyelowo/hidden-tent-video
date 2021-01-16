const express = require('express');
const path = require('path');
const router = express.Router();

const passportGoogle = require('./auth/google');

/* LOGIN ROUTER */
router.get('/login',function(req, res, next) {
  console.log("In login router");
  res.sendFile(path.join(__dirname, '../public/', 'login.html'));
});

/* LOGOUT ROUTER */
router.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

/* GOOGLE ROUTER */
router.get('/google',
  passportGoogle.authenticate('google', { scope: ['profile'] }));

router.get('/google/callback',
  passportGoogle.authenticate('google', { failureRedirect: '/login'}),
  function(req, res) {
    res.redirect('/');
  });

module.exports = router;
