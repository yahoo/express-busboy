/*
 * Copyright (c) 2015, Yahoo Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
var assert = require('assert'),
    bb = require('../'),
    express = require('express'),
    request = require('request'),
    http = require('http'),
    portfinder = require('portfinder');

var port;
var app = express();
bb.extend(app, {
    restrictMultiple: true
});
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

describe('express-busboy: json -> restrictMultiple', function() {

    before(function(done) {
        portfinder.getPort(function(e, p) {
            port = p;
            setup(app);
            base += p;
            done();
        });
    });

    after(function() {
        app._server.close();
    });


    it('should parse post body properly', function(done) {
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
        }, function(err, res, d) {
            assert.ok(d);
            assert.ok(d.body);
            assert.ok(d.files);
            assert.equal(Object.keys(d.files).length, 0);
            assert.equal(d.body.foo, 1);
            assert.equal(d.body.bar, 2);
            assert.equal(d.body.baz, 3);
            assert.ok(d.body.data);
            assert.equal(d.body.data, 1);
            assert.ok(Array.isArray(d.body.__data__));
            assert.equal(d.body.__data__[0], 1);
            assert.equal(d.body.__data__[1], 2);
            assert.equal(d.body.__data__[2], 3);
            assert.equal(d.body.__data__[3], 4);
            assert.ok(d.body.obj);
            assert.equal(typeof d.body.obj, 'object');
            assert.equal(d.body.obj.one, 1);
            assert.equal(d.body.obj.two, 2);
            assert.equal(d.body.obj.three, 3);
            assert.equal(d.body.obj.four, 4);
            done();
        });
    });


    it('should parse post body with JSON', function(done) {
        request({
            method: 'POST',
            url: base + '/',
            json: {
                obj: { one: 1, two: 2, three: 3, four: 4 },
                data: [1, 2, 3, 4],
                foo: 1,
                bar: 2,
                baz: 3
            }
        }, function(err, res, d) {
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
            done();
        });
    });

    it('should parse post body inline', function(done) {
        var p = require('url').parse(base + '/');
        p.method = 'POST';
        p.headers = {
            'content-type': 'application/x-www-form-urlencoded; charset=utf-8'
        };
        var req = http.request(p, function(res) {
            var data = '';
            res.on('data', function(c) {
                data += c;
            });

            res.on('end', function() {
                var d = JSON.parse(data);
                assert.ok(d);
                assert.ok(d.body);
                assert.ok(d.files);
                assert.equal(Object.keys(d.files).length, 0);
                assert.equal(d.body.foo, 1);
                assert.equal(d.body.bar, 2);
                assert.equal(d.body.baz, 3);
                assert.ok(d.body.data);
                assert.equal(d.body.data, 1);
                assert.ok(Array.isArray(d.body.__data__));
                assert.equal(d.body.__data__[0], 1);
                assert.equal(d.body.__data__[1], 2);
                assert.equal(d.body.__data__[2], 3);
                assert.equal(d.body.__data__[3], 4);
                done();
            });
        });
        req.write('foo=1&bar=2&baz=3&data=1&data=2&data=3&data=4&string=This+is+a+test');
        req.end();
    });

});
