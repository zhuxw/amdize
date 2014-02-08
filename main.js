// AMD-ize source code by concatenating files and wrapping define.

var fs = require('fs');
var path = require('path');
var os = require('os');
var jsfileRE = /\.js$/;
var JS_EXT = '.js';
var AMDIZE_EXT = '.amdize.js';
var dependRE = /^(["']).+\1;/;
var commentsRE = /(^\/\/)/;

function build(argv){
	var mainFile = path.resolve(process.cwd(), argv.mainFile);
	return connectFiles(processFile(mainFile, {
		argv: argv,
		dict: {},
		externalDepends: {},
		basePath: argv.basepath ? path.resolve(process.cwd(), argv.basepath) : path.dirname(mainFile),
		returnName: argv['return'] || path.basename(mainFile, JS_EXT),
		nameMap: getNameMap(argv),
		modes: getModes(),
		excluded: getExcludedFiles(argv),
		substitute: getSubstitutePairs(argv)
	}));
}

module.exports = build;

//functions--------------------------------------------------------
function getModes(){
	var modes = {};
	fs.readdirSync(path.join(__dirname, 'modes')).forEach(function(modeFile){
		if(jsfileRE.test(modeFile)){
			var mode = path.basename(modeFile, JS_EXT);
			modes[mode] = require('./modes/' + mode);
		}
	});
	return modes;
}

function getNameMap(argv){
	var fileNames = argv['name-maps'] ? argv['name-maps'].split(',') : [];
	var maps = [];
	if(argv.dojo){
		maps.push(require('./dojo.amdize').map);
	}
	fileNames.forEach(function(fileName){
		fileName = path.resolve(process.cwd(), fileName);
		if(!jsfileRE.test(fileName)){
			fileName += AMDIZE_EXT;
		}
		try{
			maps.push(require(fileName).map);
		}catch(e){
			console.error('ERROR: ', e);
		}
	});
	var map = {};
	maps.forEach(function(m){
		for(var name in m){
			map[name] = m[name];
		}
	});
	return map;
}

function getExcludedFiles(argv){
	var ret = {};
	(argv.exclude ? argv.exclude.split(',') : []).forEach(function(file){
		ret[file] = 1;
	});
	return ret;
}

function getSubstitutePairs(argv){
	var pairs = {};
	if(argv.dojo){
		pairs.ui = 'dijit';
	}
	var s = argv.substitute ? argv.substitute.split(',') : [];
	for(var i = 0; i < s.length; ++i){
		var p = s[i].trim().split(':');
		pairs[p[0]] = p[1];
	}
	return pairs;
}

function getFilePath(file, basePath){
	if(!jsfileRE.test(file)){
		file += JS_EXT;
	}
	return path.resolve(basePath, file);
}

function substitute(line, pairs){
	for(var name in pairs){
		var re = new RegExp("\\$\\{" + name + "\\}", 'g');
		line = line.replace(re, pairs[name]);
	}
	return line;
}

function processFile(file, args){
	if(!args.excluded[file] && !args.dict[file]){
		var filePath = getFilePath(file, args.basePath);
		var data = fs.readFileSync(filePath, 'utf-8');
		var dataArr = data.split(os.EOL);
		var depends = [];
		var start = 0;
		dataArr.some(function(line, i){
			line = line.trim();
			if(dependRE.test(line)){
				line = line.replace(/["']/g, '').replace(/;.*$/, '');
				line = substitute(line, args.substitute);
				var depFile = getFilePath(line, args.basePath);
				if(fs.existsSync(depFile)){
					depends.push(line);
				}else{
					args.externalDepends[line] = 1;
				}
				return false;
			}else if(!commentsRE.test(line)){
				start = i;
				return true;
			}
		});
		var content = dataArr.slice(start).join(os.EOL);
		args.dict[file] = {
			depends: depends,
			data: content
		};
		depends.forEach(function(dep){
			processFile(dep, args);
		});
	}
	return args;
}

function findRootNodes(dict){
	var file;
	var roots = {};
	var rootCount = 0;
	for(file in dict){
		if(!dict[file].depends.length){
			roots[file] = dict[file];
			delete dict[file];
			++rootCount;
		}
	}
	if(!rootCount){
		return null;
	}
	for(file in dict){
		dict[file].depends = dict[file].depends.filter(function(dep){
			return !roots[dep];
		});
	}
	return roots;
}

function connectFiles(args){
	var argv = args.argv;
	var mode = args.modes[argv.mode || 'amd'];
	var head = mode ? mode.head(args) : '';
	var foot = mode ? mode.foot(args) : '';
	var output = [head];
	for(var roots = findRootNodes(args.dict); roots; roots = findRootNodes(args.dict)){
		for(file in roots){
			output.push(roots[file].data);
		}
	}
	output.push(foot);
	return output.join(os.EOL);
}

