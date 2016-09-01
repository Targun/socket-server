
var sessionService         = require('./session-service');

var listen = function(server, sessionMiddleware) {
    var io = require('socket.io').listen(server);

    io.use(function(socket, next) {
        sessionMiddleware(socket.request, {}, next);
    })

    io.on('connection', function(socket){

        sessionService.getSessionBySessionID(socket.request.sessionID, function(err, session){
            // NOT LOGGED IN AND CONSOLES AS AS EXPECTED
            console.log(session)
            // Session {
            //   cookie: 
            //    { path: '/',
            //      _expires: 2016-09-16T02:37:50.299Z,
            //      originalMaxAge: 1296000000,
            //      httpOnly: false }
            // }
        })

        // ...

        // LOGIN SOMETIME BEFORE THE MESSAGE EVENT

        // ...

        socket.on('message', function(req){
            sessionService.getSessionBySessionID(socket.request.sessionID, function(err, session){
                // NOW LOGGED IN AND STILL CONSOLES OUTDATED SESSION
                console.log(session)
                // Session {
                //   cookie: 
                //    { path: '/',
                //      _expires: 2016-09-16T02:37:50.299Z,
                //      originalMaxAge: 1296000000,
                //      httpOnly: false }
                // }

                // HOWEVER, IF I REFRESH THE BROWSER, I GET WHAT I WANT
                // Session {
                //   cookie: 
                //    { path: '/',
                //      _expires: 2016-09-16T02:37:50.299Z,
                //      originalMaxAge: 1296000000,
                //      httpOnly: false },
                //   passport: { user: 'mongodbID123' }
                // }
                
                
                // I understand this is becuase it reinstantiates the middleware and connection.
                // Trying to figure out an elegent solution to keep the sessions in sysnc.
            })
        })

        socket.on('disconnect', function(){
            console.log('DISCONNECTED to socket.io');
        })
    })


}

module.exports = {
    listen: listen
}
