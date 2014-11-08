/*
 * Copyright (c) 2014, Yahoo! Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
var vows = require('vows'),
    assert = require('assert'),
    bb = require('../'),
    express = require('express'),
    fs = require('fs'),
    request = require('request'),
    portfinder = require('portfinder');

var port;
var app = express();
var base = 'http://127.0.0.1:';
var setup = function(app) {
    app._server = app.listen(port);
    app.all('/', function(req, res) {
        res.send({
            body: req.body,
            files: req.files
        });
    });
};

var tests = {
    'should export': {
        topic: function() {
            return bb;
        },
        'an extend method': function(d) {
            assert.isFunction(d.extend);
        }
    },
    'should extend': {
        topic: function() {
            return bb.extend(app, { upload: true });
        },
        'app': function(d) {
            assert.equal(d, app);
        }
    },
    'should not extend': {
        topic: function() {
            return bb.extend(app);
        },
        'app twice': function(d) {
            assert.equal(d, app);
        }
    },
    'setup hack': {
        topic: function() {
            var done = this.callback;
            portfinder.getPort(function(e, p) {
                port = p;
                setup(app);
                base += p;
                done();
            });
        },
        'complete': function() {},
        'and should not populate body': {
            topic: function() {
                var done = this.callback;
                request({
                    method: 'GET',
                    url: base + '/',
                    json: true
                }, function(err, res, body) {
                    done(err, body);
                });
            },
            'on get request': function(d) {
                assert.ok(d);
                assert.ok(d.body);
                assert.ok(d.files);
                assert.equal(Object.keys(d.files).length, 0);
                assert.equal(Object.keys(d.body).length, 0);
            }
        },
        'and should parse post body': {
            topic: function() {
                var done = this.callback;
                request({
                    method: 'POST',
                    url: base + '/',
                    json: true,
                    form: {
                        obj: { one: 1, two: 2, three: 3, four: 4 },
                        data: [1, 2, 3, 4],
                        foo: 1,
                        bar: 2,
                        baz: 3
                    }
                }, function(err, res, body) {
                    done(err, body);
                });
            },
            'properly': function(d) {
                assert.ok(d);
                assert.ok(d.body);
                assert.ok(d.files);
                assert.equal(Object.keys(d.files).length, 0);
                assert.equal(d.body.foo, 1);
                assert.equal(d.body.bar, 2);
                assert.equal(d.body.baz, 3);
                assert.ok(d.body.data);
                assert.ok(Array.isArray(d.body.data));
                assert.equal(d.body.data[0], 1);
                assert.equal(d.body.data[1], 2);
                assert.equal(d.body.data[2], 3);
                assert.equal(d.body.data[3], 4);
                assert.ok(d.body.obj);
                assert.equal(typeof d.body.obj, 'object');
                assert.equal(d.body.obj.one, 1);
                assert.equal(d.body.obj.two, 2);
                assert.equal(d.body.obj.three, 3);
                assert.equal(d.body.obj.four, 4);
            }
        },
        'and should upload a file': {
            topic: function() {
                var done = this.callback;
                var r = request({
                    method: 'POST',
                    url: base + '/',
                    json: true
                }, function(err, res, body) {
                    done(err, body);
                });
                var form = r.form();
                form.append('foobar', 1);
                form.append('the-file', fs.createReadStream(__filename));
            },
            'properly': function(d) {
                assert.ok(d);
                assert.ok(d.body);
                assert.equal(d.body.foobar, 1);
                assert.ok(d.files);
                assert.ok(d.files['the-file']);
                assert.ok(d.files['the-file'].file);
                assert.ok(fs.existsSync(d.files['the-file'].file));
            },
            'and should not upload a file': {
                topic: function() {
                    var done = this.callback;
                    app._server.close();
                    app = express();
                    bb.extend(app);
                    setup(app);
                    var r = request({
                        method: 'POST',
                        url: base + '/',
                        json: true
                    }, function(err, res, body) {
                        done(err, body);
                    });
                    var form = r.form();
                    form.append('foobar', 1);
                    form.append('the-file', fs.createReadStream(__filename));
                },
                'with no config': function(d) {
                    assert.ok(d);
                    assert.equal(d.body.foobar, 1);
                    assert.ok(d.body);
                    assert.ok(d.files);
                    assert.equal(Object.keys(d.files).length, 0);
                }
            }
        }
    }
};

vows.describe('express-busboy').addBatch(tests).export(module);
