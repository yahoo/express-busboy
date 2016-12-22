/*
 * Copyright (c) 2014, Yahoo Inc. All rights reserved.
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
    os = require('os'),
    jsonBody = require('body/json');

var fixDups = function(item) {
    Object.keys(item).forEach(function(field) {
        if (Array.isArray(item[field])) {
            item['__' + field + '__'] = item[field];
            item[field] = item[field][0];
        }
    });
    return item;
};

var convertParams = function(item, name, data) {
    if (Array.isArray(item[name])) {
        item[name].push(data);
    } else if (item[name]) {
        item[name] = [item[name], data];
    } else {
        item[name] = data;
    }
};

exports.extend = function(app, options) {
    if (app[key]) { return app; }
    Object.defineProperty(app, key, { value: exports });
    options = options || {};
    options.immediate = false; //Remove if the user sets it
    options.path = options.path || path.join(os.tmpdir(), 'express-busboy');
    var restrictMultiple = options.restrictMultiple;
    delete options.restrictMultiple;
    var mimeTypeLimit = options.mimeTypeLimit;
    delete options.mimeTypeLimit;
    
    if (mimeTypeLimit) {
        if (!Array.isArray(mimeTypeLimit)) {
            mimeTypeLimit = [mimeTypeLimit];
        }
    }

    app.use(busboy(options));

    app.use(function(req, res, next) {
        req.body = req.body || {};
        req.files = req.files || {};

        if (req.is('json') && req.readable) {
            jsonBody(req, res, options, function(err, body) {
                req.body = body || {};
                next();
            });
            return;
        }

        var allowUpload = false;

        if (typeof options.allowedPath == 'function') {
            allowUpload = !!options.allowedPath(req.url);
        } else if (typeof options.allowedPath == 'object' && typeof options.allowedPath.test == 'function') {
            allowUpload = !!options.allowedPath.test(req.url);
        } else {
            allowUpload = true;
        }

        if (!req.busboy) { //Nothing to parse..
            return next();
        }
        if (options.upload && allowUpload) {
            req.busboy.on('file', function(name, file, filename, encoding, mimetype) {
                var fileUuid = uuid.v4(),
                    isValidMimeType,
                    out = path.join(options.path, '/', fileUuid, '/', name, filename);
                
                if (mimeTypeLimit) {
                    isValidMimeType = mimeTypeLimit.some(function(type) {
                        return type === mimetype;
                    });
                    
                    if (!isValidMimeType) {
                        file.resume();
                        return;
                    }
                }

                /*istanbul ignore next*/
                if (!filename || filename === '') {
                    file.on('data', function() {});
                    return;
                }


                mkdirp.sync(path.dirname(out));
                var writer = fs.createWriteStream(out);
                file.pipe(writer);
                var data = {
                    uuid: fileUuid,
                    field: name,
                    file: out,
                    filename: filename,
                    encoding: encoding,
                    mimetype: mimetype,
                    truncated: false
                };

                // Indicate whether the file was truncated
                /*istanbul ignore next*/
                file.on('limit', function() {
                    data.truncated = true;
                });
                
                convertParams(req.files, name, data);
            });
        }
        req.busboy.on('field', function(name, data) {
            convertParams(req.body, name, data);
        });
        req.busboy.on('finish', function() {
            req.body = qs.parse(qs.stringify(req.body));
            if (restrictMultiple) {
                [req.body, req.files].forEach(fixDups);
            }
            next();
        });
        req.pipe(req.busboy);
    });

    return app;
};
