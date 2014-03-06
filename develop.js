var doc = document;

var config = window.amdizeConfig || {};
var basePath = config.basePath || '.';

for(i = 0; i < externalDepends.length; ++i){
	var dep = externalDepends[i];
	if(dep){
		window[dep.name] = dojo.require(dep.path);
	}
}

var scripts = doc.getElementsByTagName("script"),
	i = 0,
	script, dojoDir, src, match;
var insertPointSibling;
while(i < scripts.length){
	script = scripts[i++];
	if((src = script.getAttribute("src")) && (match = src.match(/(((.*)\/)|^)dojo\.js(\W|$)/i))){
		// remember an insertPointSibling
		insertPointSibling = script;
	}
}

var sourceLoaded = new Deferred();

function loadSource(idx){
	var sourceFile = sourceFiles[idx];
	if(sourceFile){
		var url = basePath + '/' + sourceFile.path + '.js';
		var node = doc.createElement('script');
		node.type = 'text/javascript';
		node.src = url;
		on(node, 'load', function(){
			loadSource(idx + 1);
		});
		insertPointSibling.parentNode.insertBefore(node, insertPointSibling);
	}else{
		sourceLoaded.resolve();
	}
}

loadSource(0);

