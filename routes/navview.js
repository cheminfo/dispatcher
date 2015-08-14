var router = require('express').Router(),
    middleware = require('../middleware/common'),
    fs = require('fs-extra'),
    path = require('path'),
    debug = require('debug')('navview');

exports = module.exports = router;

var viewDirectory = './static/views';

router.get('/list', middleware.validateParameters({name: 'dir', required: false}), function (req, res) {
    var dir = viewDirectory;
    if (res.locals.parameters.dir) {
        if (res.locals.parameters.dir.indexOf('..') > -1) {
            return res.status(400).json({});
        }
        dir = path.join(viewDirectory, res.locals.parameters.dir);
    }
    var list = getDirectories(dir, res.locals.parameters.dir);
    if (!list) {
        return res.status(404).json({});
    }
    list.map(function (el) {
        el.rel = res.locals.parameters.dir ? path.normalize(res.locals.parameters.dir) + '/' : './';
        return el;
    });
    return res.status(200).json(list);
});

router.post('/mkdir',
    middleware.validateParameters([{name: 'dir', required: true}, {name: 'name', required: true}]),
    checkFile('name'),
    checkDir('dir'),
    function (req, res) {
        var dir = res.locals.parameters.dir;
        var name = res.locals.parameters.name;


        try {
            fs.mkdirSync(path.join(dir, name));
            return res.status(200).json({});
        } catch (err) {
            debug('Error creating directory', err);
            return res.status(400).json({});
        }
    });

router.post('/touch',
    middleware.validateParameters([{name: 'dir'}, {name: 'name'}]),
    checkDir('dir'),
    checkFile('name'),
    checkFileNotExist('dir', 'name'),
    function (req, res) {
        debug('touch');
        var dir = res.locals.parameters.dir;
        var name = res.locals.parameters.name;
        fs.writeFile(path.join(dir, name), '{}', function (err) {
            if (err) {
                debug('error writing file', err);
                return res.status(400).json({});
            }
            return res.status(200).json({});
        });
    });

// "Safe" delete. Won't remove directories
router.delete('/file',
    middleware.validateParameters([{name: 'dir'}, {name: 'name'}]),
    checkDir('dir'),
    checkFile('name'),
    checkFileExist('dir', 'name'),
    function (req, res) {
        var dir = res.locals.parameters.dir;
        var name = res.locals.parameters.name;
        fs.unlink(path.join(dir, name), function (err) {
            if (err) {
                debug('Error removing file');
                return res.status(400).json({});
            }
            return res.status(200).json({});
        })
    }
);

// This will actually work both for files and directories
// !!! Acts as rm -rf
router.delete('/dir',
    middleware.validateParameters({name: 'dir'}),
    checkDir('dir'),
    function (req, res) {
        // remove the directory
        var dir = res.locals.parameters.dir;
        fs.remove(dir, function (err) {
            if (err) {
                debug('Error removing directory');
                return res.status(400).json({});
            }
            return res.status(200).json({});
        })
    }
);

router.post('/copy',
    middleware.validateParameters([{name: 'dir'}, {name: 'name'}, {name: 'newDir'}, {name: 'newName'}]),
    checkDir('dir'),
    checkDir('newDir'),
    checkFile('name'),
    checkFile('newName'),
    checkFileExist('dir', 'name'),
    checkFileNotExist('newDir', 'newName'),
    function (req, res) {
        var dir = res.locals.parameters.dir;
        var newDir = res.locals.parameters.newDir;
        var name = res.locals.parameters.name;
        var newName = res.locals.parameters.newName;

        copyFile(path.join(dir, name), path.join(newDir, newName), function (err) {
            if (err) {
                return res.status(400).json({});
            }
            return res.status(200).json({});
        });
    }
);

router.post('/save',
    middleware.validateParameters([{name: 'dir'}, {name: 'name'}, {name: 'content'}]),
    checkDir('dir'),
    checkFileExist('dir', 'name'),
    function (req, res) {
        var content = res.locals.parameters.content;
        var dir = res.locals.parameters.dir;
        var name = res.locals.parameters.name;
        fs.writeFile(path.join(dir, name), content, function (err) {
            if (err) {
                return res.status(400).json({});
            }
            return res.status(200).json({});
        });
    }
);

router.put('/rename',
    middleware.validateParameters([{name: 'dir'}, {name: 'name'}, {name: 'newName'}]),
    checkDir('dir'),
    checkFile('name'),
    checkFile('newName'),
    checkFileExist('dir', 'name'),
    function (req, res) {
        var dir = res.locals.parameters.dir;
        var name = res.locals.parameters.name;
        var newName = res.locals.parameters.newName;

        fs.rename(path.join(dir, name), path.join(dir, newName), function (err) {
            if (err) return res.status(400).json({});
        });
        return res.status(200).json({});
    }
);

router.put('/move',
    middleware.validateParameters([{name: 'dir'}, {name: 'name'}, {name: 'newDir'}, {name: 'newName'}]),
    checkDir('dir'),
    checkDir('newDir'),
    checkFile('name'),
    checkFile('newName'),
    checkFileExist('dir', 'name'),
    checkFileNotExist('newDir', 'newName'),
    function (req, res) {
        var dir = res.locals.parameters.dir;
        var newDir = res.locals.parameters.newDir;
        var name = res.locals.parameters.name;
        var newName = res.locals.parameters.newName;

        fs.rename(path.join(dir, name), path.join(newDir, newName), function (err) {
            if (err) return res.status(400).json({});
        });
        return res.status(200).json({});
    }
);

function getDirectories(dir, relDir) {
    try {
        return fs.readdirSync(dir).filter(function (file) {
            return file[0] !== '.';
        }).map(function (file) {
            return {
                name: file,
                isDir: fs.statSync(path.join(dir, file)).isDirectory(),
                rel: dir,
                url: path.join('/views/', relDir || '', file)
            };
        });
    }
    catch (err) {
        console.log(err);
        return null;
    }
}

function checkDir(name) {
    return function (req, res, next) {
        if (res.locals.parameters[name].indexOf('..') > -1) {
            debug('The directory cannot contain ".."');
            return res.status(400).json({});
        }

        // Check that the directory exists
        res.locals.parameters[name] = path.join(viewDirectory, res.locals.parameters[name]);
        var dir = res.locals.parameters[name];
        if (!fs.existsSync(dir)) {
            debug('Dir does not exist', dir);
            return res.status(400).json({});
        }
        next();
    };
}


function checkFile(file) {
    return function (req, res, next) {
        // check file has no slashed and no ..
        var f = res.locals.parameters[file];
        if (!f || f.indexOf('..') > -1 || f.indexOf('/') > -1) {
            debug('File did not pass check');
            return res.status(400).json({});
        }
        next();
    }
}


function checkFileNotExist(dir, name) {
    return function (req, res, next) {
        var file = path.join(res.locals.parameters[dir], res.locals.parameters[name]);
        fs.exists(file, function (exists) {
            if (!exists) {
                next();
                return;
            }
            debug('Error: file already exists');
            return res.status(400).json({});
        });
    };
}

function checkFileExist(dir, name) {
    return function (req, res, next) {
        var file = path.join(res.locals.parameters[dir], res.locals.parameters[name]);
        fs.exists(file, function (exists) {
            if (exists) {
                next();
                return;
            }
            debug('Error: file does not exist', file, process.cwd());
            return res.status(400).json({});
        });
    }
}


function copyFile(source, target, cb) {
    var cbCalled = false;

    var rd = fs.createReadStream(source);
    rd.on("error", function (err) {
        done(err);
    });
    var wr = fs.createWriteStream(target);
    wr.on("error", function (err) {
        done(err);
    });
    wr.on("close", function (ex) {
        done();
    });
    rd.pipe(wr);

    function done(err) {
        if (!cbCalled) {
            cb(err);
            cbCalled = true;
        }
    }
}

function getDuplicateFile(file) {
    var regex = /(.*?)(_\d+)?(\..*)?$/

    var m = regex.exec(file);
    var root = m[1];
    var rev = m[2];
    var ext = m[3];

    if (!rev) {
        rev = '_1';
    }
    else {
        rev = '_' + (+rev.slice(1) + 1).toString();
    }
    ext = ext || '';

    return root + rev + ext;
}