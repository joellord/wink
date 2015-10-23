var async = require('async');
var semver = require('semver');

var MAX_ASYNC_THROTTLING = 20;

module.exports = traverse;

function traverse(registry, pkg, cb) {
    var modules = {};

    var q = async.queue(work, 1);

    q.drain = done;
    q.push(pkg);

    function work(pkg, cb) {
        var id = pkg.name + '@' + pkg.version;
        if (id in modules) {
            return cb();
        }

        modules[id] = pkg;

        var dependencies =
            (pkg.dependencies ? Object.keys(pkg.dependencies) : [])
            .map(function(name) {
                return {name: name, version: pkg.dependencies[name]};
            });

        queryRegistry(registry, dependencies, then);

        function then(err, pkgs) {
            if (err) {
                q.kill();
                return cb(err);
            }

            pkgs.forEach(add);
            cb();
        }

        function add(p) {
            if (!p) {
                return;
            }

            p.parent = pkg;
            q.push(p);
        }
    }

    function done() {
        cb(null, Object.keys(modules).map(function(m) { return modules[m]; }));
    }
}

function queryRegistry(registry, modules, cb) {
    async.mapLimit(modules, MAX_ASYNC_THROTTLING, query, cb);

    function query(module, cb) {
        var name = module.name;
        var version = module.version;

        if (version === 'latest') {
            version = '*';
        }

        if (shouldIgnore(version)) {
            console.warn('Warning: ignoring dependency [' +
                name + '@' + version + '].');
            return cb();
        }

        registry.get(name, version, queried);

        function queried(err, pkg) {
            if (err) {
                return cb(err);
            }

            if (!pkg || !pkg.versions) {
                return cb();
            }

            var versions = Object.keys(pkg.versions);
            var version = semver.maxSatisfying(versions, module.version);

            var versionPkg = pkg.versions[version];
            if (!versionPkg) {
                console.warn('Error processing: [' +
                             pkg.name + '@' +
                             pkg.version + '] not in the registry.');
            }

            cb(null, versionPkg);
        }
    }
}

function shouldIgnore(version) {
    return [
        /^file:/,
        /^git:/i,
        /^git+ssh:/i,
        /^https:/i,
        /git+https:/i,
        /^[^\/]+\/[^\/]+$/ // shortUrl
    ].some(test);

    function test(regex) { return regex.test(version); }
}
