// REQUIRE FILES =============================================

// ===========================================================
// 3rd-party Modules
var express           = require('express');
var session           = require('express-session');
var bodyParser        = require('body-parser');
var cookieParser      = require('cookie-parser');
var mongoose          = require('mongoose'); 
var passport          = require('passport');

// ===========================================================

// CONFIGURATION =============================================

// ===========================================================
var port              = process.env.PORT || 5000; // set our port
var app               = express();
var http              = require('http').Server(app);

// BOILERPLATE
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
mongoose.Promise = require('bluebird')

// REDIS CONFIG
var RedisStore        = require('connect-redis')(session);
var redisClient       = require('redis').createClient(process.env.REDIS_URI)
var redisStore        = new RedisStore({client: redisClient})

// SESSIONS and PASSPORT
var sessionMiddleware = session({
    name: process.env.SESSION_NAME,
    key: process.env.SESSION_KEY, 
    secret: process.env.SESSION_SECRET, 
    cookie: {
        httpOnly: false,
        maxAge: 1000 * 60 * 60 * 24 * 15
    },
    resave: true, 
    saveUninitialized: true,
    store: redisStore,
}) 

app.use(cookieParser(process.env.SESSION_SECRET));
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

// ===========================================================

// SOCKETS  ==================================================

// ===========================================================

require('./session-service').initializeRedis(redisStore);
require('./socket').listen(http, sessionMiddleware)


// ===========================================================

// Connect to db and start app ===============================

// ===========================================================
var startServer = function() {
    // CONNETING TO MONGODB & REDIS HERE
}();
