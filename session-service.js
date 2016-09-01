var redisStore = null;

var self = module.exports = {
    initializeRedis: function (store) {
        redisStore = store;
    },
    getSessionBySessionID: function (sessionId, callback) {
        redisStore.load(sessionId, function (err, session) {
            if (err) callback(err);
            if (callback != undefined)
                callback(null, session);
        });
    }
};
