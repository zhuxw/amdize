var os = require('os');

exports.head = function(args){
	var deps = [];
	var sb = ['define([', os.EOL];
	var localNames = [];
	for(var dojoDep in args.externalDepends){
		deps.push(dojoDep);
	}
	deps.sort();
	for(var i = 0; i < deps.length; ++i){
		sb.push('\t"', deps[i], '"', (i == deps.length - 1 ? '' : ','), os.EOL);
		localNames.push(args.nameMap[deps[i]]);
	}
	sb.push('], function(');
	sb.push(localNames.join(', '));
	sb.push('){', os.EOL);
	return sb.join('');
};

exports.foot = function(args){
	return ['return ', args.returnName, ';', os.EOL, '});'].join('');
};
