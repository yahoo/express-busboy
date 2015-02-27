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
    }
};

vows.describe('express-busboy').addBatch(tests).export(module);
