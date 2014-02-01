var os = require('os');

exports.head = function(args){
	var deps = [];
	var localNames = [];
	for(var dojoDep in args.externalDepends){
		deps.push(dojoDep);
	}
	deps.sort();
	var sb = [];
	for(var i = 0; i < deps.length; ++i){
		sb.push('"', deps[i], '";', os.EOL);
	}
	sb.push(os.EOL, 'var ', args.returnName, ' = (function(){', os.EOL);
	return sb.join('');
};

exports.foot = function(args){
	return ['return ', args.returnName, ';', os.EOL, '})();'].join('');
};
