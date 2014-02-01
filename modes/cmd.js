var os = require('os');

exports.head = function(args){
	var sb = ['define(function(require, exports, module){', os.EOL];
	var deps = [];
	for(var dojoDep in args.externalDepends){
		deps.push(dojoDep);
	}
	deps.sort();
	deps.forEach(function(dep){
		sb.push('\tvar ', args.nameMap[dep], ' = require("', dep, '");', os.EOL);
	});
	sb.push(os.EOL);
	return sb.join('');
};

exports.foot = function(args){
	return ['return ', args.returnName, ';', os.EOL, '});'].join('');
};

