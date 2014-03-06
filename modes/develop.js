var os = require('os');

exports.head = function(args){
	var sb = ['define(["require","dojo/on","dojo/_base/Deferred"], function(require, on, Deferred){', os.EOL,
		'var externalDepends = [', os.EOL
	];
	var deps = [];
	for(var dojoDep in args.externalDepends){
		deps.push(dojoDep);
	}
	deps.sort();
	deps.forEach(function(dep){
		sb.push('{ name: "', args.nameMap[dep], '", path: "', dep, '" },', os.EOL);
	});
	sb.push('0];', os.EOL);
	sb.push('var sourceFiles = [', os.EOL);
	args.nodes.forEach(function(node){
		sb.push('{ path: "', node.file, '" },', os.EOL);
	});
	sb.push('0];', os.EOL);
	return sb.join('');
};

exports.foot = function(args){
	return [
		'return {',
			'load: function(id, require, load){',
				'sourceLoaded.then(function(){',
					'load(' + args.returnName + ');',
				'});',
			'}',
		'};',
		'});'
	].join(os.EOL);
};
