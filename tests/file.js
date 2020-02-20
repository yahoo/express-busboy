/*
 * Copyright (c) 2015, Yahoo Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
var assert = require('assert'),
    bb = require('../'),
    express = require('express'),
    fs = require('fs'),
    request = require('request'),
    portfinder = require('portfinder');

var port, app, base;
var restartServer = (opts, cb) => {
    closeServer(() => {
        app = express();
        bb.extend(app, opts);
        base = 'http://127.0.0.1:';
        portfinder.getPort(function(e, p) {
            port = p;
            setup(app);
            base += p;
            cb();
        });
    });
};
var closeServer = (cb) => {
    if (app) {
        app._server.close(cb);
        app = undefined;
    } else {
        cb();
    }
};
var setup = function(app) {
    app._server = app.listen(port);
    app.all('/', function(req, res) {
        res.send({
            body: req.body,
            files: req.files
        });
    });
};

describe('express-busboy: file upload', function() {

    before(function(done) {
        restartServer({ upload: true }, done);
    });

    after(function(done) {
        closeServer(done);
    });

    it('should upload a file', function(done) {
        var r = request({
            method: 'POST',
            url: base + '/',
            json: true
        }, function(err, res, d) {
            assert.ok(d);
            assert.ok(d.body);
            assert.equal(d.body.foobar, 1);
            assert.ok(d.files);
            assert.ok(d.files['the-file']);
            assert.ok(d.files['the-file'].file);
            assert.ok(fs.existsSync(d.files['the-file'].file));
            done();
        });
        var form = r.form();
        form.append('foobar', 1);
        form.append('the-file', fs.createReadStream(__filename));
    });
        
    it('should upload files of the same name', function(done) {
        var r = request({
            method: 'POST',
            url: base + '/',
            json: true
        }, function(err, res, d) {
            assert.ok(d);
            assert.ok(d.body);
            assert.equal(d.body.foobar, 1);
            assert.ok(d.files);
            assert.ok(d.files['the-file']);
            assert.equal(true, Array.isArray(d.files['the-file']));
            assert.ok(d.files['the-file'][0].file);
            assert.ok(d.files['the-file'][1].file);
            assert.ok(d.files['the-file'][2].file);
            assert.ok(fs.existsSync(d.files['the-file'][0].file));
            assert.ok(fs.existsSync(d.files['the-file'][1].file));
            assert.ok(fs.existsSync(d.files['the-file'][2].file));
            done();
        });
        var form = r.form();
        form.append('foobar', 1);
        form.append('the-file', fs.createReadStream(__filename));
        form.append('the-file', fs.createReadStream(__filename));
        form.append('the-file', fs.createReadStream(__filename));
    });

    it('should strip name param for write', function(done) {
        const name = __dirname;
        // we want to change options for just this test, so restart the server
        restartServer({
            upload: true,
            strip: (value) => {
                return value.replace(/.*\//, '');
            }
        }, () => {
            var r = request({
                method: 'POST',
                url: base + '/',
                json: true
            }, function(err, res, d) {
                assert.ok(d);
                assert.ok(d.body);
                assert.equal(d.body.foobar, 1);
                assert.ok(d.files);
                assert.ok(d.files[name]);
                assert.ok(!d.files[name].file.match(new RegExp(name)));
                assert.ok(d.files[name].file.match(new RegExp(d.files[name].uuid)));
                assert.ok(fs.existsSync(d.files[name].file));
                done();
            });
            var form = r.form();
            form.append('foobar', 1);
            form.append(name, fs.createReadStream(__filename), 'hello/foobar');
        });
    });

});
