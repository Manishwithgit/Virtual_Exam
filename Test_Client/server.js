const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
const session = require('express-session');
var flash = require('connect-flash');
const path = require("path")
const moment = require("moment")


// Routes Being Set Here
const login = require('./routes/login');

//Client Side Routes
const manage_exam = require('./routes/manage_exam');
const checker = require('./routes/manage_checker');
const dashboard = require('./routes/dashboard')
const manage_qa = require('./routes/manage_qa');
const students = require('./routes/manage_students');




//Student Side routes
var app = express();
const port = 7171||process.env.PORT;

var genLog = (request, response, next) => {
  console.log(`${request.method} ${request.originalUrl}`);
  next();
}

app.set('view engine', 'ejs');
// app.use('/images',express.static(__dirname + '/public'));
app.use(express.static(path.join(__dirname, "public")));

let reqPath = path.join(__dirname, '../tus/files');
app.use('/files',express.static(reqPath));

app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  name: 'test_client',
  secret: 'ilovecarsandbikes',
  resave: false,
  saveUninitialized: true,
}));

//Flash message//
app.use(flash());

//Middleware to create log for the user
app.use(genLog);

app.use(passport.initialize());
app.use(passport.session());

// Middleware to check if the user is logged in
function ensureAuthenticated(request, response, next) {
  if(request.isAuthenticated()) {
    return next();
  }

  else{
    request.logout();
    response.redirect('/');
  }
}

//Client Side Pages
app.use('/', login);
app.use('/dashboard', ensureAuthenticated, dashboard);
app.use('/manage_exam', ensureAuthenticated, manage_exam);
app.use('/manage_checker', ensureAuthenticated, checker);
app.use('/manage_qa', ensureAuthenticated, manage_qa);
app.use('/manage_students',ensureAuthenticated, students);



app.get('/logout', (request, response) => {
   request.logout();
  request.session.destroy();
  response.redirect('/');
});

app.listen(port, () => {
  console.log(`Port: ${port}`);
  console.log(`Env: ${process.env.NODE_ENV}`);
});