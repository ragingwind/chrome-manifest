#!/usr/bin/env node

var path = require('path');
var fs = require('fs');
var read = fs.readFileSync;
var exist = fs.existsSync;
var write = function(output, data) {
  console.log(path.basename(output), 'is writing');
  fs.writeFileSync(output, data);
};
var _ = require('lodash');
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

// Add missing, custrom manifest property
function customizeManifest(manifest) {
  // background.page for extensions
  manifest['backabout_page'] =  {
    'channel': 'stable',
    'extension_types': ['extensions']
  }

  // background.script for extensions
  manifest['backabout_scripts'] =  {
    'channel': 'stable',
    'extension_types': ['extensions']
  }

  manifest['kiosk_enabled'] = {
    'channel': 'stable',
    'extension_types': ['platform_app']
  }

  manifest['kiosk_only'] = {
    'channel': 'stable',
    'extension_types': ['platform_app']
  }

  return manifest;
}

function filterJSON(data) {
  var json = JSON.parse(minify(data));
  var output = {};

  _.each(json, function (prop, key) {
    // To manage medadata simply, post processing if prop has array properties
    if (_.isArray(prop)) {
      // append merge function at end of args
      prop.push(function(p1, p2) {
        if (!_.isArray(p1)) {
          return (p1 === p2) ? p1 : _.compact([p1, p2]).join(', ');
        } else {
          return _.union(p1, p2);
        }
      });

      prop = _.merge.apply(this, prop);
    }

    // remote unuse filed
    if (prop.whitelist) {
      delete prop.whitelist;
    } else if (prop.location) {
      delete prop.location;
    }

    output[key] = prop;
  });

  return output;
}

function writeJSON(f, data, done) {
  var dest = JSON.stringify(data, ' ', 2);

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

    var json = filterJSON(data);

    if (f.url.indexOf('manifest') >= 0) {
      json = customizeManifest(json);
    }

    writeJSON(f, json, function () {
      defer.resolve();
    });
  });

  return defer.promise;
}

function exit(res, log) {
  if (log) {
    console.log(log);
  }
  process.exit(res ? 0 : -1);
}

function main(millisec) {
  var tid = setTimeout(function () {
    exit(false, 'Applicant time is over. Check your connection health');
  }, 10 * 1000);

  clearTimeout(tid);

  next(features, updateJSON).then(exit).catch(function(err) {
    exit(false, err.toString());
  });
}

main();
