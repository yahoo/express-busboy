/*
 * Copyright (c) 2016, Yahoo Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
var assert = require('assert'),
    bb = require('../'),
    express = require('express'),
    fs = require('fs'),
    path = require('path'),
    request = require('request'),
    portfinder = require('portfinder');

var setup = function(app, port) {
    app._server = app.listen(port);
    app.all('*', function(req, res) {
        res.send({
            url: req.url,
            body: req.body,
            files: req.files
        });
    });
};

describe('express-busboy: file upload - allowedPath regex', function() {
    var app;
    var base = 'http://127.0.0.1:';
    before(function(done) {
        app = express();
        bb.extend(app, {
            upload: true,
            allowedPath: /allowed/
        });
        portfinder.getPort(function(e, port) {
            setup(app, port);
            base += port;
            done();
        });
    });

    after(function() {
        app._server.close();
    });

    it('should upload a file to an allowed path', function(done) {
        var r = request({
            method: 'POST',
            url: base + '/allowed/',
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
        
});

describe('express-busboy: file upload - allowedPath function', function() {
    var app;
    var base = 'http://127.0.0.1:';
    before(function(done) {
        app = express();
        bb.extend(app, {
            upload: true,
            allowedPath: function(url) {
                return url.indexOf('allowed') > -1;
            }
        });
        portfinder.getPort(function(e, port) {
            setup(app, port);
            base += port;
            done();
        });
    });

    after(function() {
        app._server.close();
    });

    it('should upload a file to an allowed path', function(done) {
        var r = request({
            method: 'POST',
            url: base + '/allowed/',
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
        
});

describe('express-busboy: file upload - allowedPath string', function() {
    var app;
    var base = 'http://127.0.0.1:';
    before(function(done) {
        app = express();
        bb.extend(app, {
            upload: true,
            allowedPath: '/allowed/'
        });
        portfinder.getPort(function(e, port) {
            setup(app, port);
            base += port;
            done();
        });
    });

    after(function() {
        app._server.close();
    });

    it('should upload a file to an allowed path', function(done) {
        var r = request({
            method: 'POST',
            url: base + '/allowed/',
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
        
});

describe('express-busboy: NO file upload - allowedPath regex', function() {
    var app;
    var base = 'http://127.0.0.1:';
    before(function(done) {
        app = express();
        bb.extend(app, {
            upload: true,
            allowedPath: /allowed/
        });
        portfinder.getPort(function(e, port) {
            setup(app, port);
            base += port;
            done();
        });
    });

    after(function() {
        app._server.close();
    });

    it('should NOT upload a file to an allowed path', function(done) {
        var r = request({
            method: 'POST',
            url: base + '/upload/',
            json: true
        }, function(err, res, d) {
            assert.ok(d);
            assert.ok(d.body);
            assert.equal(d.body.foobar, 1);
            assert.ok(d.files);
            assert.equal(d.files['the-file'], undefined);
            done();
        });
        var form = r.form();
        form.append('foobar', 1);
        form.append('the-file', fs.createReadStream(__filename));
    });
        
});

describe('express-busboy: NO file upload - allowedPath function', function() {
    var app;
    var base = 'http://127.0.0.1:';
    before(function(done) {
        app = express();
        bb.extend(app, {
            upload: true,
            allowedPath: function(url) {
                return url.indexOf('allowed') > -1;
            }
        });
        portfinder.getPort(function(e, port) {
            setup(app, port);
            base += port;
            done();
        });
    });

    after(function() {
        app._server.close();
    });

    it('should NOT upload a file to an allowed path', function(done) {
        var r = request({
            method: 'POST',
            url: base + '/upload/',
            json: true
        }, function(err, res, d) {
            assert.ok(d);
            assert.ok(d.body);
            assert.equal(d.body.foobar, 1);
            assert.ok(d.files);
            assert.equal(d.files['the-file'], undefined);
            done();
        });
        var form = r.form();
        form.append('foobar', 1);
        form.append('the-file', fs.createReadStream(__filename));
    });
        
});

describe('express-busboy: allowed mime type', function() {
    var app;
    var base = 'http://127.0.0.1:';
    before(function(done) {
        app = express();
        bb.extend(app, {
            upload: true,
            mimeTypeLimit: ['application/javascript']
        });
        portfinder.getPort(function(e, port) {
            setup(app, port);
            base += port;
            done();
        });
    });

    after(function() {
        app._server.close();
    });

    it('should upload a file with a valid mime type', function(done) {
        var r = request({
            method: 'POST',
            url: base + '/upload/',
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
        
});

describe('express-busboy: NOT allowed mime type', function() {
    var app;
    var base = 'http://127.0.0.1:';
    before(function(done) {
        app = express();
        bb.extend(app, {
            upload: true,
            mimeTypeLimit: 'application/javascript'
        });
        portfinder.getPort(function(e, port) {
            setup(app, port);
            base += port;
            done();
        });
    });

    after(function() {
        app._server.close();
    });
        
    it('should NOT upload a file with an invalid mime type', function(done) {
        var r = request({
            method: 'POST',
            url: base + '/upload/',
            json: true
        }, function(err, res, d) {
            assert.ok(d);
            assert.ok(d.body);
            assert.equal(d.body.foobar, 1);
            assert.ok(d.files);
            assert.equal(d.files['the-file'], undefined);
            done();
        });
        var form = r.form();
        form.append('foobar', 1);
        form.append('the-file', fs.createReadStream(path.join(__dirname, '../README.md')));
    });
        
});
