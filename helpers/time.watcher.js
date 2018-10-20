class TimeWatcher{
    constructor(){
        this._start = 0;
    }
    start(){
        this._start = Date.now();
    }
    fix(){
        let result = Date.now() - this._start;
        this._start = Date.now();
        return result;
    }
}

module.exports = TimeWatcher;