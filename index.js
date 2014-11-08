/*
 * Copyright (c) 2014, Yahoo! Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

var busboy = require('connect-busboy'),
    key = '@express-busboy',
    path = require('path'),
    uuid = require('uuid'),
    fs = require('fs'),
    mkdirp = require('mkdirp'),
    qs = require('qs'),
    os = require('os');

exports.extend = function(app, options) {
    if (app[key]) { return app; }
    Object.defineProperty(app, key, { value: exports });
    options = options || {};
    options.immediate = false; //Remove if the user sets it
    options.path = options.path || path.join(os.tmpdir(), 'express-busboy');

    app.use(busboy(options));

    app.use(function(req, res, next) {
        req.body = {};
        req.files = {};

        if (!req.busboy) { //Nothing to parse..
            return next();
        }
        if (options.upload) {
            req.busboy.on('file', function(name, file, filename, encoding, mimetype) {
                var fileUuid = uuid.v4(),
                    out = path.join(options.path, '/', fileUuid, '/', name, filename);

                mkdirp.sync(path.dirname(out));
                var writer = fs.createWriteStream(out);
                file.pipe(writer);
                var file = {
                    uuid: fileUuid,
                    field: name,
                    file: out,
                    filename: filename,
                    encoding: encoding,
                    mimetype: mimetype
                };
                req.files[name] = file;
            });
        }
        req.busboy.on('field', function(fieldname, val) {
            req.body[fieldname] = val;
        });
        req.busboy.on('finish', function() {
            req.body = qs.parse(qs.stringify(req.body));
            next();
        });
        req.pipe(req.busboy);
    });

    return app;
};
