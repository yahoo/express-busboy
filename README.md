express-busboy
--------------

A simple `body-parser` like module for express that uses [`connect-busboy`](https://github.com/mscdex/connect-busboy) under the hood.

usage
-----

```js
var bb = require('express-busboy');
var app = express();

bb.extend(app);
```

The module will populate `req.body` and `req.files` like the `body-parser` module does.

configuration
-------------

```js
bb.extend(app, {
    //busboy options can go here
});
```

file uploads
------------

By default file uploads are disabled, the `req.files` object will always be empty. You can activate them with:

```js
bb.extend(app, {
    upload: true,
    path: '/path/to/save/files'
});
```

`path` will default to: `os.tmpdir()/express-busboy/<uuid>/<the field name>/<filename>`.

If needed, we could potentially add a filter that we can filter which url's have the ability to upload files.

build
-----
