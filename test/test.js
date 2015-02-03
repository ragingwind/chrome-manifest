/*global describe, it */
'use strict';
var assert = require('assert');
var chromeManifest = require('../');

describe('chrome-manifest node module', function () {
  it('must have at least one test', function () {
    chromeManifest();
    assert(false, 'I was too lazy to write any tests. Shame on me.');
  });
});
