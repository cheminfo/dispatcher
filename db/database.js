// Performs sqlite database operation
// e.g. save a new device entry

var PromiseWrapper = require('../util/PromiseWrapper'),
    Promise = require('bluebird'),
    sqlite = require('sqlite3'),
    _ = require('lodash'),
    debug = require('debug')('database'),
    path = require('path');




exports = module.exports = {
    save: save,
    get: get,
    query: query,
    status: status
};


var means = [
    {
        name: 'minute',
        modulo: 60
    },
    {
        name: 'hour',
        modulo: 3600
    },
    {
        name: 'day',
        modulo: 86400
    }
];


function mapMeanCol(col) {
    return [
            col+'_min',
            col+'_max',
            col+'_sum',
            col+'_nb'
    ];
}

function createTables(wdb) {
    return function() {
        var promises = [];
        promises.push(wdb.run('CREATE TABLE IF NOT EXISTS entry(' +
            'id INTEGER PRIMARY KEY AUTOINCREMENT,' +
            'epoch INTEGER NOT NULL,' +
            'timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)'));

        for(var i=0; i<means.length; i++) {
            promises.push(wdb.run('CREATE TABLE IF NOT EXISTS ' + means[i].name + '(epoch INTEGER PRIMARY KEY NOT NULL)'));
        }

        debug('create all tables');
        return Promise.all(promises);
    }
}

function createIndexes(wdb) {
    return function() {
        var promises = [];

        promises.push(wdb.run('CREATE INDEX IF NOT EXISTS entry_epoch_idx ON entry(epoch)'));
        for(var i=0; i<means.length; i++) {
            promises.push(wdb.run('CREATE INDEX IF NOT EXISTS ' + means[i].name + '_epoch ON minute(epoch)'));
        }

        debug('create all indexes');
        return Promise.all(promises);
    }
}


function getTableInfo(wdb) {
    return function() {
        var promises = [];
        promises.push(wdb.all("PRAGMA table_info(entry);"));

        for(var i=0; i<means.length; i++) {
            promises.push(wdb.all("PRAGMA table_info(" + means[i].name + ");"));
        }

        debug('run get table info');
        return Promise.all(promises);
    }
}


function createMissingColumns(wdb, wantedColumns) {
    return function(res) {
        // result comes from getTableInfo
        // expected length of res is 4
        var names = _.pluck(means, 'name');
        var existingColumns = _.pluck(res[0], 'name');
        var missingColumns = _.difference(wantedColumns, existingColumns);

        var promises = [];
        var i=0;

        for(i=0; i<missingColumns.length; i++) {
            promises.push(wdb.run('ALTER TABLE entry ADD COLUMN ' + missingColumns[i] + " INT;"))
        }

        var meanWantedColumns = _.chain(wantedColumns).map(mapMeanCol).flatten().value();



        for(i=0; i<names.length; i++) {
            var ecol = _.pluck(res[i+1], 'name');
            var mcol = _.difference(meanWantedColumns, ecol);

            for(var j=0; j<mcol.length; j++) {
                promises.push(wdb.run('ALTER TABLE ' + names[i] + ' ADD COLUMN ' + mcol[j] + ' INT;'));
            }
        }
        debug('run create missing columns');
        return Promise.all(promises);
    }
}

function getAllEntryIds(wdb) {
    return function() {
        debug('Get all entry ids');
        return wdb.all('SELECT id FROM entry;');
    }
}

function getAllEntries(wdb) {
    return function() {
        debug('Get all entries');
        return wdb.all('SELECT * FROM entry');
    }
}

function getEntries(wdb, options) {
    return function() {
        var conditions = [];
        var fields = options.fields;

        if(options.epochFrom) {
            conditions.push('epoch>=' + options.epochFrom);
        }
        if(options.epochTo) {
            conditions.push('epoch<=' + options.epochTo);
        }

        if(options.from) {
            conditions.push('id>=' + options.from);
        }
        if(options.to) {
            conditions.push('id<=' + options.to);
        }


        var condition = (conditions.length) === 0 ? '' : ' WHERE ' + conditions.join(' AND ');
        if(fields.indexOf('*') === -1) fields.push('id', 'epoch');
        fields = _.unique(fields);
        var query = 'SELECT ' + fields + ' FROM entry';
        query += condition;
        query += ' ORDER BY epoch ' + options.order;
        query += ' LIMIT ' + options.limit;
        debug('Get entries');
        return wdb.all(query);
    };
}

function getMeanEntries(wdb, options) {
    return function() {
        var conditions = [];
        var fields = options.fields;
        if(!options.fields) fields = '*';
        else {
            fields = _.chain(fields).map(function(c) {return [c+'_min', c + '_max']}).push(
                _.map(fields, function(c) {return c + '_sum' +  '/' + c + '_nb as ' + c + '_mean'})
            ).flatten().value();
        }

        if(options.epochFrom) {
            conditions.push('epoch>=' + options.epochFrom);
        }
        if(options.epochTo) {
            conditions.push('epoch<=' + options.epochTo);
        }


        var condition = (conditions.length) === 0 ? '' : ' WHERE ' + conditions.join(' AND ');
        fields.push('epoch');
        fields = _.unique(fields);
        var query = 'SELECT ' + fields + ' FROM ' + options.mean;
        query += condition + ' LIMIT '  + options.limit;
        debug('Get mean values');
        return wdb.all(query);
    };

}

function keepRecentIds(wdb, maxIds) {
    return function(res) {
        var ids = _.pluck(res, 'id');
        ids.sort().reverse();
        if(ids.length > maxIds) {
            debug('keep recent ids');
            return wdb.run('DELETE FROM entry WHERE id<=' + ids[maxIds]);
        }
        else return true;
    }
}

function getAllMeanEpoch(wdb) {
    return function() {
        debug('get epoch from all mean tables');
        var promises = [];
        for(var i=0; i<means.length; i++) {
            promises.push(wdb.all("SELECT epoch FROM " + means[i].name + " ORDER BY epoch DESC"));
        }

        return Promise.all(promises);
    }
}

function keepRecentMeanEpoch(wdb, maxNb) {
    return function(res) {
        var promises = [];
        if(!(maxNb instanceof Array)) {
            maxNb = _.times(means.length, function() { return maxNb; });
        }

        if(maxNb.length !== means.length) {
            throw new Error('Unexpected length of parameter maxNb');
        }
        for(var i=0; i<means.length; i++) {
            if(res[i].length > maxNb) {
                debug('perform mean delete');
                promises.push(wdb.run('DELETE FROM ' + means[i].name + ' where epoch<=' + res[i][maxNb[i]].epoch))
            }
        }
        debug('Keep recent mean entries');
        return Promise.all(promises);
    }
}

function insertEntry(wdb, entry) {
    return function() {
        var keys = _.keys(entry.parameters);
        var values = [];
        for(var i=0; i<keys.length; i++) {
            var value = entry.parameters[keys[i]];
            if(typeof value === 'string') value = "'" + value + "'";
            values.push(entry.parameters[keys[i]]);
        }


        var command = 'INSERT INTO entry (epoch, ' + keys.join(',') + ')' +
            ' values(' + entry.epoch + ',' + values.join(',') + ')';
        debug('run insert entry');
        return wdb.run(command);
    }
}

function getEntryMean(wdb, entry) {
    return function() {

        var promises = [];

        for(var i=0; i<means.length; i++) {
            var epoch = entry.epoch-(entry.epoch%means[i].modulo);
            promises.push(wdb.all('SELECT * FROM ' + means[i].name + ' WHERE epoch=' + epoch));
        }

        debug('Get mean entries');
        return Promise.all(promises);
    }
}

function insertEntryMean(wdb, entry) {
    return function(res) {
        var columns = _.chain(entry.parameters)
            .keys()
            .map(mapMeanCol)
            .flatten().value();

        var promises = [];
        for(var i=0; i<means.length; i++) {

            var epoch = entry.epoch-(entry.epoch%means[i].modulo);
            var values;
            if(res[i].length === 0) {
                values = _.chain(entry.parameters)
                    .keys()
                    // Order is min, max, sum, nb
                    .map(function(col) {
                        return [
                            entry.parameters[col], entry.parameters[col], entry.parameters[col], 1
                        ]
                    })
                    .flatten().value();

            }
            else {
                values = _.chain(entry.parameters)
                    .keys()
                    .map(function(col) {
                        var meanCol = _.chain(col).map(mapMeanCol).flatten().value();
                        return [
                            Math.min(res[i][0][meanCol[0]], entry.parameters[col]), Math.max(res[i][0][meanCol[1]], entry.parameters[col]), res[i][0][meanCol[2]] + entry.parameters[col], res[i][0][meanCol[3]] + 1
                        ];
                    })
                    .flatten().value();
            }
            promises.push(wdb.run("INSERT OR REPLACE INTO " + means[i].name + "(epoch," + columns.join(',') + ")" + " VALUES(" + epoch + "," + values.join(',') + ");"));
        }
        debug('Insert entries mean');
        return Promise.all(promises);
    }
}

function handleError(err) {
    debug('Error: ', err);
}

function save(entry, options) {
    var wdb = getWrappedDB(entry.deviceId, options);
    if(!options.maxRecords) {
        return Promise.reject(new Error('maxRecords option is mandatory'));
    }
    var names = _.pluck(means, 'name');
    var maxRecords= [];
    for(var i=0; i<names.length; i++) {
        if(options.maxRecords[names[i]])
            maxRecords.push(options.maxRecords[names[i]])
    }
    return Promise.resolve()
        .then(createTables(wdb))
        .then(createIndexes(wdb))
        .then(getTableInfo(wdb))
        .then(createMissingColumns(wdb, _.keys(entry.parameters)))
        .then(insertEntry(wdb, entry))
        .then(getEntryMean(wdb, entry))
        .then(insertEntryMean(wdb, entry))
        .then(getAllEntryIds(wdb))
        .then(keepRecentIds(wdb, options.maxRecords.entry))
        .then(getAllMeanEpoch(wdb, maxRecords))
        .then(keepRecentMeanEpoch(wdb, 5))
        .catch(handleError);
}

function get(deviceId, options) {
    if(!deviceId) {
        throw new Error('Invalid device id');
    }
    var defaultOptions = {
        order: 'DESC',
        limit: 500,
        fields: ['*']
    };

    _.defaults(options, defaultOptions);

    var wdb = getWrappedDB(deviceId, sqlite.OPEN_READONLY);

    var fn;
    if(options.mean && options.mean !== 'entry') fn = getMeanEntries(wdb, options);
    else fn = getEntries(wdb, options);


    var res =  Promise.resolve()
        .then(fn);

    res.catch(handleError);
    
    return res;
}

function status(deviceId) {
    var wdb = getWrappedDB(deviceId);
    var first, last;

    var promises = [];
    promises.push(getEntries(wdb, {
        limit: 1,
        order: 'asc',
        fields: ['*']
    })());

    promises.push(getEntries(wdb, {
        limit: 1,
        order: 'desc',
        fields: ['*']
    })());

    promises.push(wdb.run('SELECT count(*) FROM entry'));

    return Promise.all(promises).then(function(res) {
        console.log('res', res);
    });
}

var count = 0;
function getWrappedDB(id, options, mode) {
    options = options || {};
    var dir = options.dir || './sqlite/';

    debug('count:', ++count);
    var dbloc = path.join(dir, id+'.sqlite');
    var db = new sqlite.cached.Database(dbloc, mode);
    return new PromiseWrapper(db, ['all', 'run', 'get']);
}

function query(id) {
    var wdb = getWrappedDB(id);
    [].shift.apply(arguments);
    return wdb.all.apply(wdb, arguments);
}