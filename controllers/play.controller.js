class PlayController{
    constructor(dbService, cacheService, logger, configs){
        this._db = dbService;
        this._cache = cacheService;
        this._logger = logger;
        this._configs = configs;
    }

    setAction(action, cb){
        return cb ? cb() : null;
    }

    logError(err){
        if(this._logger) this._logger.error(err);
    }
}

module.exports = PlayController;