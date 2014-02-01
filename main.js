// AMD-ize source code by concatenating files and wrapping define.

var optimist = require('optimist');
var argv = optimist.usage('Usage: amdize [options] <main file> > <output file>').options({
	mode: {
		alias: 'm',
		'default': 'amd',
		description: 'Module system to use'
	},
	'name-maps': {
		alias: 'n',
		description: 'Files separted by comma, mapping from module path to variable name'
	},
	dojo: {
		'boolean': true,
		description: 'Use default dojo name maps'
	},
	basepath: {
		alias: 'b',
		description: 'Base path that modules are relative to, defaults to the dir of the main file'
	},
	exclude: {
		alias: 'e',
		description: 'Modules to exclude during building'
	},
	'return': {
		alias: 'r',
		description: 'Name to be exposed, defaults to the basename of the mail file.'
	},
	help: {
		alias: 'h',
		'boolean': true,
		description: 'Show help message.'
	}
}).argv;

//main-------------------------------------------------------------
if(argv.help){
	optimist.showHelp();
	process.exit(0);
}

var fs = require('fs');
var path = require('path');
var os = require('os');
var jsfileRE = /\.js$/;
var JS_EXT = '.js';
var AMDIZE_EXT = '.amdize.js';
var dependRE = /^(["']).+\1;/;
var commentsRE = /(^\/\/)/;

var mainFile = path.resolve(process.cwd(), argv._[0]);
console.log(connectFiles(processFile(mainFile, {
	dict: {},
	externalDepends: {},
	basePath: argv.basepath || path.dirname(mainFile),
	returnName: argv.r || path.basename(mainFile, JS_EXT),
	nameMap: getNameMap(),
	modes: getModes(),
	excluded: getExcludedFiles()
})));

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

function getNameMap(){
	var fileNames = argv.n ? argv.n.split(',') : [];
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

function getExcludedFiles(){
	var ret = {};
	(argv.exclude ? argv.exclude.split(',') : []).forEach(function(file){
		ret[file] = 1;
	});
	return ret;
}

function getFilePath(file, basePath){
	if(!jsfileRE.test(file)){
		file += JS_EXT;
	}
	return path.resolve(basePath, file);
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
	var mode = args.modes[argv.mode];
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

