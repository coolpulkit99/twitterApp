require('dotenv').config();

var utils = require("./util/tweetUtil.js");
var dbutils = require("./util/databaseUtil.js");

var express = require('express');
var passport = require('passport');
var Strategy = require('passport-twitter').Strategy;

var trustProxy = false;
if (process.env.DYNO) {
  trustProxy = true;
}

var tokenV = "";
var tokenVSec = "";

var Twit = require('twit');

var T = undefined; //twit variable initialized after authentication


passport.use(new Strategy({
  consumerKey: process.env["consumerKey"],
  consumerSecret: process.env["consumerSecret"],
  callbackURL: '/oauth/callback',
  proxy: trustProxy
},
  function (token, tokenSecret, profile, cb) {
    tokenV = token;
    tokenVSec = tokenSecret;

    T = new Twit({
      consumer_key: process.env["consumerKey"],
      consumer_secret: process.env["consumerSecret"],
      access_token: token,
      access_token_secret: tokenSecret,
      timeout_ms: 60 * 1000,  // optional HTTP request timeout to apply to all requests.
      // strictSSL:            true,     // optional - requires SSL certificates to be valid.
    });

    return cb(null, profile);
  }));

passport.serializeUser(function (user, cb) {
  cb(null, user);
});

passport.deserializeUser(function (obj, cb) {
  cb(null, obj);
});


var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use(require('morgan')('combined'));
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));

app.use(passport.initialize());
app.use(passport.session());

//home endpoint for giving login options or other options if user is logged in
app.get('/',
  function (req, res) {
    res.render('home', { user: req.user });
  });

app.get('/login',
  function (req, res) {
    console.log('ENV');
    console.log(process.env);
    console.log('Headers:');
    console.log(req.headers)
    res.render('login');
  });

app.get('/login/twitter',
  passport.authenticate('twitter'));

app.get('/oauth/callback',
  passport.authenticate('twitter', { failureRedirect: '/login' }),
  function (req, res) {
    res.redirect('/');
  });

app.get('/profile',
  require('connect-ensure-login').ensureLoggedIn(),
  function (req, res) {
    console.log(req.user);
    res.render('profile', { user: req.user });
  });


//endpoint to test the main functionality
app.get('/test',
  require('connect-ensure-login').ensureLoggedIn(),
  function (req, res) {
    console.log(req.user+"%star%");
    T.get('statuses/home_timeline', {}, function (err, data, response) {


      var date7DaysAgo = utils.dateNDaysAgo(7);

      data = data.filter((elem) => {
        var tweetDate = new Date(elem["created_at"]);
        return tweetDate > date7DaysAgo;
      })

      var tweets = data.filter(utils.containsUrl).map(utils.extractTweetInfo);

      var users = tweets.map(utils.extractUser)

      var domains = data.map(utils.extractUrl)
        .filter(a => a.length > 0)
        .reduce(
          function (accumulator, user) {
            return accumulator = accumulator.concat(user);
          }
          , [])
        .map(utils.extractDomain)

      var consolidatedTweets = "";
      tweets.forEach(element => {
        consolidatedTweets += utils.formatTweet(element);
      });

      var user = req.user.username+"";
      
      var dbvalue = { "_id": user, "data":tweets }
      dbutils.deleteUserTweet(user);
      dbutils.createUserTweet(dbvalue,null);

      //render result as html elements
      var result = "<a href='/logout'>logout</a><br>The most popular url(domain) on your timeline is :" + utils.showMax(domains);
      result += "<br> The user that posts the most is :" + utils.showMax(users);
      result += "<br> The tweets are :\n" + consolidatedTweets;


      res.send(result);

    });
  });

//endpoint for logging out
app.get('/logout',
  function (req, res) {
    req.session.destroy(function (err) {
      res.redirect('/');
    });
  });

app.listen(process.env.PORT || 8980);
