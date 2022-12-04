const router = require('express').Router();
const pool = require('../config/database');


router.get('/', function(req,res){ 
console.log(req.user)
  res.render('index.ejs',{
     id:1,
     type:req.user.type,
     name:req.user.user_name
   });
});


module.exports = router;
