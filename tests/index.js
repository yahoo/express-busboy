/*
 * Copyright (c) 2014, Yahoo! Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
var vows = require('vows'),
    assert = require('assert'),
    bb = require('../'),
    express = require('express'),
    app = express();

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
