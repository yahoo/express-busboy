# express-busboy [![npm version](https://badge.fury.io/js/express-busboy.svg)](http://badge.fury.io/js/express-busboy) ![Build Status](https://github.com/yahoo/express-busboy/actions/workflows/test.yml/badge.svg)

A simple `body-parser` like module for express that
uses [`connect-busboy`](https://github.com/mscdex/connect-busboy) under the hood.

It's designed to be more of a "drop in" replacement for `body-parser`.
With it populating `req.body`, there is very minimal code change needed to use it.

usage
-----

```js
import bb from 'express-busboy';
const app = express();

bb.extend(app);
```

The module will populate `req.body` and `req.files` like the `body-parser` module does.

configuration
-------------

```js
bb.extend(app, {
    //options can go here
});
```

By default this module will create an `Array` when it finds multiple fields with the
same name in the POST parameters. You can set `restrictMultiple` to `true` to 
not parse mutiple POST values into `Array`'s

file uploads
------------

By default file uploads are disabled, the `req.files` object will always be empty. You can activate them with:

```js
bb.extend(app, {
    upload: true,
    path: '/path/to/save/files',
    allowedPath: /./
});
```

`path` will default to: `os.tmpdir()/express-busboy/<uuid>/<the field name>/<filename>`.

allowedPath can contain a regular expression limiting the upload function to given urls. For example `/^\/upload$/` would only allow uploads in the /upload path.


You can have a function returning true/false if you prefer that:

```js
options.allowedPath = function(url) {
    return url == '/upload';
}
```

You can restrict uploads to specific mimetypes as well:

```js
options.mimeTypeLimit = [
    'text/x-markdown',
    'application/javascript',
    'image/jpeg',
    'image/png'
];
```

Name and filename inputs will be sanitized before determining path for the file on disk.  If you want to change this behavior you can provide a strip function of your own:

```js
// this will not sanitize the inputs
options.strip = function(value, type) {
    return value;
}
```

When files are not uploaded due to path or mimetype checks, no error is returned (so the other data in the request can be handled) the restricted item
will simply not appear in the `req.files` `Object`.
