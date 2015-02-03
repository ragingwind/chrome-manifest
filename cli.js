#!/usr/bin/env node
'use strict';
var meow = require('meow');
var chromeManifest = require('./');

var cli = meow({
  help: [
    'Usage',
    '  chrome-manifest <input>',
    '',
    'Example',
    '  chrome-manifest Unicorn'
  ].join('\n')
});

chromeManifest(cli.input[0]);
