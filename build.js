// AMD-ize source code by concatenating files and wrapping define.

var optimist = require('optimist');
var argv = optimist.usage('node amdize <main file>').options({
	mode: {
		alias: 'm',
		'default': 'amd',
		description: 'Module system to use, default to amd.'
	},
	'name-maps': {
		alias: 'n',
		description: 'Files separted by comma, mapping from module path to variable name.'
	},
	dojo: {
		'boolean': true,
		description: 'Use default dojo mappings'
	},
	exclude: {
		alias: 'e',
		description: 'Modules to exclude during building'
	},
	'return': {
		alias: 'r',
		description: 'Name to be exposed, default to main file name.'
	},
	help: {
		alias: 'h',
		'boolean': true,
		description: 'Show help message.'
	}
}).argv;

if(argv.help){
	optimist.showHelp();
	process.exit(0);
}

var fs = require('fs');
var os = require('os');
var path = require('path');

//main-------------------------------------------------------------
var mainFile = path.resolve(process.cwd(), argv._[0]);

console.log(connectFiles(processFile(mainFile, {
	dict: {},
	externalDepends: {},
	basePath: path.dirname(mainFile),
	returnName: argv['return'] || path.basename(mainFile, '.js'),
	nameMap: getNameMap(),
	modes: getModes()
})));

//functions--------------------------------------------------------
function getModes(){
	var modes = {};
	var modeDir = path.join(__dirname, 'modes');
	var modeNames = fs.readdirSync(modeDir);
	modeNames.forEach(function(modeFile){
		var mode = path.basename(modeFile, '.js');
		modes[mode] = require('./modes/' + mode);
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

function getFilePath(file, basePath){
	if(!(/\.js$/).test(file)){
		file += '.js';
	}
	return path.resolve(basePath, file);
}

function processFile(file, args){
	var filePath = getFilePath(file, args.basePath);
	var data = fs.readFileSync(filePath, 'utf-8');
	var dataArr = data.split(os.EOL);
	var depends = [];
	var start = 0;
	dataArr.some(function(line, i){
		line = line.trim();
		if(/^(["']).+\1;$/.test(line)){
			line = line.replace(/["']/g, '').replace(/;/g, '');
			var depFile = getFilePath(line, args.basePath);
			if(fs.existsSync(depFile)){
				depends.push(line);
			}else{
				args.externalDepends[line] = 1;
			}
			return false;
		}else{
			start = i;
			return true;
		}
	});
	var content = dataArr.slice(start).join(os.EOL);
	args.dict[file] = {
		depends: depends,
		relPath: file,
		data: content
	};
	depends.forEach(function(dep){
		processFile(dep, args);
	});
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

