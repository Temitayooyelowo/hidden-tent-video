const express = require('express');
const path = require('path');
const router = express.Router();

const passportLocal = require('../auth/local');


/* LOCAL ROUTER */
router.post('/login',
  passportLocal.authenticate('local', {  failureRedirect: '/auth/login'}),
  function(req, res) {
    res.redirect('/');
  });

/* LOGIN ROUTER */
router.get('/login',function(req, res, next) {
  console.log("In login router");
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

/* LOGOUT ROUTER */
router.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

module.exports = router;
