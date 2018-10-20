const TimeWatcher = require('./time.watcher');

let timeWatcher = new TimeWatcher();

let index = 1;

let timeTest = () => {
    timeWatcher.start();
    setTimeout(() => {
        console.log(timeWatcher.fix());
        if(index++ < 100) timeTest();
    }, 30);
}

timeTest();