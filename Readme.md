# pino-arborsculpture

**Lead maintainer:** [jsumners](https://github.com/jsumners)

*pino-arborsculpture* is a module that allows you to change the logging level
of a [Pino][pino] logger, or set of loggers (e.g. child loggers) while your
process is running. It accomplishes this by monitoring a specified file
for changes and acts accordingly.

[pino]: https://github.com/pinojs/pino

## Example

```js
'use strict'

const Arborsculpt = require('pino-arborsculpture')
const pino = require('pino')
const log = pino() // info level by default

const arbor = new Arborsculpt({
  path: '/tmp/adjustments.json',
  loggers: [log],
  interval: 60000 // the default
})

arbor.on('error', function (err) {
  // there was a problem reading the file or setting the level
})
```

At some point you decide `log` should be set to the `debug` level because
production is broken and you have to figure out why without taking it offline,
so you create the `/tmp/adjustments.json` file:

```json
{
  "level": "debug"
}
```

Within one minute of creating the file, your process will start outputting
`debug` level log lines.

## Options

+ `path` [optional]: string pointing to the file that will be monitored. This
  file does not need to exist until such time as you are ready to change
  levels in your process. Default: `os.tmpdir() + 'aborsculpt.json'`
+ `loggers` [required]: an array of Pino instances to adjust. Default: `[]`
+ `interval` [optional]: the number of milliseconds between scans of the
  specified file. Default: `60000`

## Level Change File Format

The file being monitored **must** be a valid JSON file. It can contain two
possible formats:

```json
{"level": "levelName"}
```

or

```json
{
  "levels": [
    "levelName",
    "levelName"
  ]
}
```

In the first case, the single level will be applied to *all* loggers supplied
at construction. In the second case, each level will be applied to the
corresponding logger in the loggers array. Note: if you supplied 5 loggers
at construction, but only 3 in the file, then only the first 3 loggers will
have their levels changed.

All level names **must** be valid level names as registerd with the target Pino
instances.

## License

[MIT License](http://jsumners.mit-license.org/)