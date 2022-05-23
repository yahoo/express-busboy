'use strict';
/*
 * Copyright (c) 2014, Yahoo Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

const busboy = require('connect-busboy');
const key = '@express-busboy';
const path = require('path');
const uuid = require('uuid');
const fs = require('fs');
const mkdirp = require('mkdirp');
const qs = require('qs');
const os = require('os');
const jsonBody = require('body/json');

const fixDups = (item) => {
    Object.keys(item).forEach((field) => {
        if (Array.isArray(item[field])) {
            item[`__${field}__`] = item[field];
            item[field] = item[field][0];
        }
    });
    return item;
};

const stripRegexp = /.*\//;
const strip = (value) => {
    return value.replace(stripRegexp, '');
};

var convertParams = (item, name, data) => {
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
    options.strip = (options.strip && options.strip instanceof Function) ? options.strip : strip;
    const restrictMultiple = options.restrictMultiple;
    const mimeTypeLimit = options.mimeTypeLimit ? !Array.isArray(options.mimeTypeLimit) ? [options.mimeTypeLimit] : options.mimeTypeLimit : null;
    delete options.restrictMultiple;
    delete options.mimeTypeLimit;
    
    app.use(busboy(options));

    app.use((req, res, next) => {
        var allowUpload = true;
        
        req.body = req.body || {};
        req.files = req.files || {};

        if (req.is('json') && req.readable) {
            jsonBody(req, res, options, (err, body) => {
                req.body = body || {};
                next();
            });
            return;
        }
        
        if (!req.busboy) { //Nothing to parse..
            return next();
        }

        if (options.allowedPath) {
            allowUpload = false;
            /*istanbul ignore else - else case is the default case*/
            if (options.allowedPath === req.url) {
                allowUpload = true;
            } else if (typeof options.allowedPath === 'function') {
                allowUpload = !!options.allowedPath(req.url);
            } else if (typeof options.allowedPath.test === 'function') {
                allowUpload = !!options.allowedPath.test(req.url);
            }
        }

        let bbDone = false;

        const finish = () => {
            /*istanbul ignore next*/
            if (!bbDone) {
                return; //bail busboy is still running
            }
            //Busboy is done, check the files
            let complete = true;
            Object.keys(req.files).forEach((name) => {
                let file = req.files[name];
                if (!Array.isArray(file)) {
                    file = [file];
                }
                file.forEach((f) => {
                    if (!f.done) { //file is not done writing
                        complete = false;
                    }
                });
            });
            if (complete) { //all files are done writing..
                next();
            }
        };

        if (options.upload && allowUpload) {
            req.busboy.on('file', (name, file, info) => {
                const { filename, encoding, mimeType } = info;
                const fileUuid = uuid.v4();
                const nameStripped = options.strip(name, 'name');
                const filenameStripped = options.strip(filename || /*istanbul ignore next*/ '', 'filename');
                const out = path.join(options.path, '/', fileUuid, '/', nameStripped, filenameStripped);
                
                if (mimeTypeLimit && !mimeTypeLimit.some(type => { return type === mimeType; })) {
                    return file.resume();
                }

                /*istanbul ignore next*/
                if (!filename || filenameStripped === '') {
                    return file.on('data', () => { });
                }
                
                const data = {
                    uuid: fileUuid,
                    field: name,
                    file: out,
                    filename: filename,
                    encoding: encoding,
                    mimetype: mimeType,
                    truncated: false,
                    done: false
                };

                mkdirp.sync(path.dirname(out));
                const writer = fs.createWriteStream(out);
                writer.on('finish', () => {
                    data.done = true;
                    finish();
                });
                file.pipe(writer);

                // Indicate whether the file was truncated
                /*istanbul ignore next*/
                file.on('limit', () => {
                    data.truncated = true;
                });
                
                convertParams(req.files, name, data);
            });
        }
        req.busboy.on('field', (name, data) => {
            convertParams(req.body, name, data);
        });
        req.busboy.on('close', () => {
            req.body = qs.parse(qs.stringify(req.body), { arrayLimit: options.arrayLimit });
            if (restrictMultiple) {
                [req.body, req.files].forEach(fixDups);
            }
            bbDone = true;
            finish();
        });
        req.pipe(req.busboy);
    });

    return app;
};
