// ===========================================================

// REQUIRE FILES =============================================

// ===========================================================
// 3rd-party Modules
var express           = require('express')
var session           = require('express-session')
var bodyParser        = require('body-parser')
var cookieParser      = require('cookie-parser')
var passport          = require('passport')
var path              = require('path')
var mongoose          = require('mongoose')
global.Promise        = require('bluebird')
mongoose.Promise      = global.Promise

// ===========================================================

// CONFIGURATION =============================================

// ===========================================================
var port              = process.env.PORT || 5000; // set our port
var app               = express();
var http              = require('http').Server(app);

// BOILERPLATE
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

// REDIS CONFIG
var RedisStore        = require('connect-redis')(session);
var redisClient       = require('redis').createClient(process.env.REDIS_URI)
var redisStore        = new RedisStore({client: redisClient})

// SESSIONS and PASSPORT
var sessionMiddleware = session({
    name: process.env.SESSION_KEY,
    secret: process.env.SESSION_SECRET, 
    cookie: {
        httpOnly: false,
        maxAge: 1000 * 60 * 60 * 24 * 15
    },
    resave: true, 
    saveUninitialized: true,
    store: redisStore,
}) 

var parseCookie = cookieParser(process.env.SESSION_SECRET);
app.use(parseCookie);
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());


// ===========================================================

// SOCKET.IO STUFF ===========================================

// ===========================================================

var io           = socketio.listen(http);

// Intercept Socket.io's handshake request
io.use(function (socket, next) {
	cookieParser(process.env.SESSION_SECRET)(socket.request, {}, function (err) {
		// Get the session id from the request cookies
		var sessionId = socket.request.signedCookies ? socket.request.signedCookies[process.env.SESSION_KEY] : undefined;

		if (!sessionId) return next(new Error('sessionId was not found in socket.request'), false);
		// Use the redisStore instance to get the Express session information
		redisStore.load(sessionId, function (err, session) {

			if (err) return next(err, false);

			if (!session) return next(new Error('session was not found for ' + sessionId), false);

			// Set the Socket.io session information
			socket.request.session = session

			// Use Passport to populate the user details
			passport.initialize()(socket.request, {}, function () {
				passport.session()(socket.request, {}, function () {
					if (socket.request.user) {
						next(null, true);
					} else {
						next(new Error('User is not authenticated'), false);
					}
				})
			})
		})
	})
})

// Add an event listener to the 'connection' event
io.on('connection', function (socket) {
	console.log('CONNECTED to socket.io')

	// FILE
	socket.on('/api/create', function(req){
		console.log(req)
		console.log(socket.request.user)
	})

	socket.on('disconnect', function(){
		console.log('DISCONNECTED to socket.io')
	})
})


// ===========================================================

// Connect to db and start app ===============================

// ===========================================================
var startServer = function() {
	// MONGODB
	mongoose.connection.on('open', function (ref) {
		console.log('Connected to: MongoDB');
        	http.listen(port, function(){
			console.log('Server listening on port ' + port);
		})
	})
	mongoose.connection.on('error', function (err) {
		console.log('Could not connect to mongo server!')
		console.log(err
		process.exit(1)
	})
	mongoose.connect(process.env.MONGODB_URI);

	// REDIS
	redisClient.on('connect', function () {
		console.log('Connected to: Redis');
	});
	redisClient.on('error', function (err) {
		console.log('Redis error occurred: ' + err);
	});
}();
