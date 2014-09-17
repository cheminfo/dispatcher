var sqlite = require('sqlite3'),
    Promise = require('bluebird'),
    database = require('./database'),
    argv = require('minimist')(process.argv.slice(2));


function openDatabase(name) {
    return new Promise(function(resolve, reject) {
        var db = new sqlite.Database(name, function(err) {
            if(err) {
                return reject(err);
            }
            return resolve(db);
        })
    });
}

if(argv.save) {
    database.save({
        deviceId: 'test1',
        epoch: Math.round((Math.random() + 1)*400000),
        parameters: {
            A: 1000000000,
            B:456
        }
    }).then(function() {
        console.log('ok');
    }, function(err) {
        console.log('rejected error', err);
    }).catch(function() {
        console.log('failed');
    });
}

if(argv.getAll) {
    console.log('get');
    database.get('9281', {
        limit: 10,
        fields: ['K'],
        mean: 'minute'
    }).then(function(res) {
        console.log(res);
    });
}

if(argv.query) {
    console.log('query');
    database.query('test1', 'SELECT * FROM entry').then(function(res) {
        console.log(res);
    });
}

if(argv.status) {
    console.log('status');
    database.status('test1');
}

//database.getLastId('1000').then(function( res) {
//    console.log('last id', res);
//});

database.test();

//openDatabase('./sqlite/test.sqlite').then(function(db) {
//    var wdb = new Wrapper(db, ['all', 'get', 'run']);
//    console.log(wdb.all);
//    wdb.run("SELECT name FROM sqlite_master WHERE type='table' AND name='tbl1';").then(function() {
//        console.log(res);
//    }).catch(function(err) {
//        console.log('An error occured', err);
//        console.log(err.trace());
//    });
//}).catch(function(err) {
//    console.log('An error occured', err);
//    console.log(err.trace());
//});


