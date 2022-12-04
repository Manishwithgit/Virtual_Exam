const router = require('express').Router();
const pool = require('../config/database');
const passport = require('passport');

// Passport functionalities is included
require('../config/passport')(passport);

router.get('/',function(req,res){
  res.render('login2.ejs',{
    message: req.flash('message')
  });
});

router.post('/log', passport.authenticate('local', {

    successRedirect: '/dashboard',
    failureRedirect: '/'
  })
);

module.exports = router;
