/*
 * Copyright (c) 2014, Yahoo Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
var assert = require('assert'),
    bb = require('../'),
    express = require('express'),
    app = express();

describe('express-busboy', function() {
    
    it('should export an extend method', function() {
        assert.equal(typeof bb.extend, 'function');
    });

    it('should extend', function() {
        var d = bb.extend(app, { upload: true });
        assert.equal(d, app);
    });
    it('should not extend app twice', function() {
        var d = bb.extend(app);
        assert.equal(d, app);
    });
});

