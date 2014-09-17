var sqlite = require('sqlite3'),
    Promise = require('bluebird'),
    database = require('./database'),
    argv = require('minimist')(process.argv.slice(2));


var dbname = '1000';
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
        deviceId: dbname,
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
    database.get(dbname, {
        limit: 10,
        mean: 'entry'
    }).then(function(res) {
        console.log(res);
    });
}

if(argv.query) {
    console.log('query');
    database.query(dbname, 'SELECT * FROM entry').then(function(res) {
        console.log(res);
    });
}

if(argv.status) {
    console.log('status');
    database.status(dbname);
}

//database.getLastId('1000').then(function( res) {
//    console.log('last id', res);
//});




