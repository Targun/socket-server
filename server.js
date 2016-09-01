// REQUIRE FILES =============================================

// ===========================================================
// 3rd-party Modules
var express           = require('express');
var session           = require('express-session');
var bodyParser        = require('body-parser');
var cookieParser      = require('cookie-parser');
var mongoose          = require('mongoose'); 
var morgan            = require('morgan');
var passport          = require('passport');
var path              = require('path');

// ===========================================================

// CONFIGURATION =============================================

// ===========================================================
var port              = process.env.PORT || 5000; // set our port
var app               = express();
var http              = require('http').Server(app);

// BOILERPLATE
app.use(morgan('dev'));
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
    // MONGODB
    mongoose.connection.on('open', function (ref) {
        console.log('Connected to: MongoDB');
        http.listen(port, function(){
          console.log('Server listening on port ' + port);
        });
    });
    mongoose.connection.on('error', function (err) {
        console.log('Could not connect to mongo server!');
        console.log(err);
        process.exit(1);
    });
    mongoose.connect(process.env.COMPOSE_URI);

    // REDIS
    redisClient.on('connect', function () {
        console.log('Connected to: Redis');
        // redisClient.set('string key', 'string val', redis.print);
    });
    redisClient.on('error', function (err) {
        console.log('Redis error occurred: ' + err);
    });
}();