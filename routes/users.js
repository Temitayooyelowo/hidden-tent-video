const express = require('express');
const router = express.Router();

const path = require('path');



function ensureAuthenticated(req, res, next) {
  console.log("In ensure authenticated")
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/auth/login')
}

module.exports = router;
