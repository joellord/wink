var fs = require('fs');
var async = require('async');
var npmconf = require('npmconf');
var RegClient = require('silent-npm-registry-client');
var validateModule = require('nsp-api').validateModule;

var traverse = require('./traverse');

var MAX_ASYNC_THROTTLING = 20;

module.exports = auditPackage;

function auditPackage(pkgPath, cb) {
    async.waterfall([
        async.parallel.bind(async, [
            loadPkg.bind(null, pkgPath),
            buildRegClient,
        ]),
        function(res, cb) {
            var pkg = res[0];
            var reg = res[1];
            traverse(reg, pkg, then);

            function then(err, pkgs) {
                if (err) {
                    return cb(err);
                }

                async.mapLimit(pkgs, MAX_ASYNC_THROTTLING, verifyModule, cb);
            }
        },
        function(all, cb) { cb(null, all.filter(function(x) { return x; })); }
    ], cb);
}

function loadPkg(pkgPath, cb) {
    async.waterfall([
        assertPkgFileExists,
        fs.readFile.bind(fs, pkgPath, {encoding: 'utf8'}),
        function(pkgText, cb) { cb(null, JSON.parse(pkgText)); }
    ], cb);

    function assertPkgFileExists(cb) {
        fs.exists(pkgPath, then);

        function then(exists) {
            cb(exists ? null :
                new Error('Can\'t load ' + pkgPath +
                          '\nMake sure you have a package.json available'));
        }
    }
}

function buildRegClient(cb) {
    async.waterfall([
        npmconf.load.bind(npmconf),
        function build(config, cb) { cb(null, new RegClient(config)); }
    ], cb);
}

function getAncestry(module, list) {
    list = list || [];

    if (!module) {
        return list;
    }

    list.push(module);

    return getAncestry(module.parent, list);
}

function verifyModule(module, cb) {
    validateModule(module.name, module.version, validated);

    function validated(err, result) {
        if (err) {
            return cb(err);
        }

        if (!Array.isArray(result)) {
            return cb(new TypeError('Unexpected API response format.'));
        }

        if (!result.length) {
            return cb();
        }

        cb(null, {
            module: module.name,
            version: module.version,
            advisory: result[0],
            advisories: result,
            dependencyOf: getAncestry(module)
                .map(function(d) { return d.name + '@' + d.version; })
                .reverse()
        });
    }
}
