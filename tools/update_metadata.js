#!/usr/bin/env node

var path = require('path');
var read = require('fs').readFileSync;
var exist = require('fs').existsSync;
var write = function(output, data) {
  console.log(path.basename(output), 'is writing');
  require('fs').writeFileSync;
};
var got = require('got');
var q = require('q');
var minify = require('node-json-minify');
var meow = require('meow');
var inquirer = require('inquirer');
var next = require('next-promise');

var args = meow({
  pkg: '../package.json',
  help: [
      'Usage',
      '   diff_metadata.js --output ./lib/metadata',
      '',
      'Options',
      '   --output: Output path, If it is not given, will be using default path'
  ].join('\n')
}, {
  default: {
    output: path.resolve(__dirname, '../lib/metadata')
  }
});

var features = [{
  url: 'http://src.chromium.org/svn/trunk/src/chrome/common/extensions/api/_manifest_features.json',
  output: path.join(args.flags.output, 'manifest_features.json')
}, {
  url: 'http://src.chromium.org/svn/trunk/src/chrome/common/extensions/api/_permission_features.json',
  output: path.join(args.flags.output, 'permission_features.json')
}];

function diff(src, dest) {
  var diff = '';
  jsdiff.diffChars(src, dest).forEach(function(part){
    var color = part.added ? chalk.bgRed.bold : chalk.white;
    if (!part.removed) {
      diff += color(part.value);
    }
  });
  return diff;
}

function writeJSON(f, data, done) {
  var dest = JSON.stringify(JSON.parse(minify(data)), ' ', 2);

  if (exist(f.output)) {
    var src = read(f.output);

    if (dest !== src.toString()) {
      // ask will overwrite
      inquirer.prompt({
        type: 'confirm',
        name: 'overwrite',
        message: path.basename(f.output) + ' file already exists. Overwrite?'
      }, function(answers) {
        if (answers.overwrite) {
          write(f.output, dest);
        }

        done();
      });
    } else {
      console.log(path.basename(f.output) + ' file already exists but has no changes');
      done();
    }
  } else {
    write(f.output, dest);
    done();
  }
}

function updateJSON(f) {
  var defer = q.defer();

  got(f.url, function(err, data, res) {
    if (err) {
      return defer.reject(err);
    }

    writeJSON(f, data, function () {
      defer.resolve();
    });
  });

  return defer.promise;
}

function main(millisec) {
  next(features, updateJSON).then(function (res) {
    process.exit(0);
  }).catch(function () {
    process.exit(-1);
  });

  setTimeout(function () {
    console.log('Applicant time is over. Check your health of connections');
    process.exit(-1);
  }, millisec);
}

main(20000);
