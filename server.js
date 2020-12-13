require('dotenv').config();

var utils = require("./util/tweetUtil.js");
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
// const { formatTweet } = require('./util/tweetUtil.js');

var T = undefined;


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
      consumer_key: "xnr1GSQB0UUozfSzcUN7xL2VP",
      consumer_secret: "SqgsiIEQ909vqT9IIpRcf00VAyPjpqTq3bUpfLmpw9BbMNRG81",
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

app.get('/test',
  require('connect-ensure-login').ensureLoggedIn(),
  function (req, res) {
    // console.log(tokenV);
    // res.render("asd");
    T.get('statuses/home_timeline', {}, function (err, data, response) {
      // console.log(data)
      var tweets = data.filter(utils.containsUrl).map(utils.extractTweetInfo);

      var users = tweets.map(utils.extractUser)
      // .reduce(
      //   function (accumulator, user) {
      //     return accumulator[user] = (accumulator[user] ? accumulator[user] : 0) + 1;
      //   }
      //   , {});
      
      var domains = data.map(utils.extractUrl)
        .filter(a => a.length > 0)
        .reduce(
          function (accumulator, user) {
            return accumulator = accumulator.concat(user);
          }
          , [])
        .map(utils.extractDomain)
        // .reduce(
        //   function (accumulator, user) {
        //     return accumulator[user] = (accumulator[user]==undefined ? 0:accumulator[user]) + 1;
        //   }
        //   , {});
      

      var consolidatedTweets="";
      tweets.forEach(element => {
       
        consolidatedTweets+=utils.formatTweet(element); 
  
      });
      // ((acc,tweet)=>{
      //   acc+=utils.formatTweet(tweet);
      // },"");

      console.log(consolidatedTweets);


      var result="The most popular url(domain) on your timeline is :"+utils.showMax(domains);
      result+="<br> The user that posts the most is :"+ utils.showMax(users);
      result+="<br> The tweets are :\n"+ consolidatedTweets;
      // console.log(data.map(utils.extractUrl).filter(a=>a.length>0));
      // res.send(utils.showMax(domains));
      // res.send(data);
      res.send(result);
      
    });
  });

app.get('/logout',
  function (req, res) {
    req.session.destroy(function (err) {
      res.redirect('/');
    });
  });

app.listen(process.env.PORT||8980);
