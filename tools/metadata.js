#!/usr/bin/env node

var path = require('path');
var fs = require('fs');
var read = fs.readFileSync;
var exist = fs.existsSync;
var write = function (output, data) {
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
var prefilter = require('./prefilter');

var args = meow({
	pkg: '../package.json',
	help: [
		'Usage',
		'	 node metadata.js --output=./lib/metadata',
		'',
		'Options',
		'	 --output: Output path, If it is not given, will be use default path'
	].join('\n')
}, {
	default: {
		output: path.resolve(__dirname, '../lib/metadata')
	}
});

var features = [{
	url: 'http://src.chromium.org/svn/trunk/src/chrome/common/extensions/api/_manifest_features.json',
	output: path.join(args.flags.output, 'manifest.json'),
	prefilter: prefilter.manifest
}, {
	url: 'http://src.chromium.org/svn/trunk/src/chrome/common/extensions/api/_permission_features.json',
	output: path.join(args.flags.output, 'permission.json'),
	prefilter: prefilter.permission
}];

function filterJSON(data) {
	var json = JSON.parse(minify(data));
	var output = {};

	_.each(json, function (prop, key) {
		// To manage medadata simply, post processing if prop has array properties
		if (_.isArray(prop)) {
			// append merge function at end of args
			prop.push(function (p1, p2) {
				if (_.isArray(p1)) {
					return _.union(p1, p2);
				}
				return (p1 === p2) ? p1 : _.compact([p1, p2]).join(', ');
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

		if (dest === src.toString()) {
			console.log(path.basename(f.output) + ' file already exists but has no changes');
			done();
		} else {
			// ask will overwrite
			inquirer.prompt({
				type: 'confirm',
				name: 'overwrite',
				message: path.basename(f.output) + ' file already exists. Overwrite?'
			}, function (answers) {
				if (answers.overwrite) {
					write(f.output, dest);
				}

				done();
			});
		}
	} else {
		write(f.output, dest);
		done();
	}
}

function updateJSON(f) {
	var defer = q.defer();

	got(f.url, function (err, data) {
		if (err) {
			return defer.reject(err);
		}

		var json = filterJSON(data);

		if (f.prefilter) {
			json = f.prefilter(json);
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

function main() {
	var tid = setTimeout(function () {
		exit(false, 'Applicant time is over. Check your connection health');
	}, 10 * 1000);

	clearTimeout(tid);

	next(features, updateJSON).then(exit).catch(function (err) {
		exit(false, err.toString());
	});
}

main();
