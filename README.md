AMD-ize
=======
Concatenate source code files into one file and wrap it to fit some module
system, e.g. amd or cmd.

Motivation
----------
1. Manage JS source file freely.

	AMD modules can be built into one file, but the built modules are still separated modules and still can be invoked publicly. Sometimes it makes sense to split a big AMD module into several smaller pieces for easier maintanence, while still keep these smaller pieces private.

2. Avoid Duplicated Declarations of Dependencies.

	Some common dependencies are almost used in every AMD module, and they need to be declared again and again in every file. And note that even after JS compression, these duplicated declarations are still there. It makes perfect sense not to repeat yourself (DRY).

3. Become Independent of Module Frameworks.

	Want to use your AMD-style lib in a non AMD environment, or vice versa? It is actually nothing more than some special wrapping logic. So why not writing code inpendent of any module frameworks and pick one on demand?


Installation
------------
Install globally:

		npm install -g amdize

Usage
-------
### Declare Dependencies as String Literals
Given source files:

		|-a.js
		`~lib/
		  `-b.js

a.js:

		"dojo/_base/lang";	// external dependency
		"lib/b";			// internal dependency
		
		function a(arg){
			var obj = {
				arg: arg
			};
			lang.hitch(obj, b)();
		}

lib/b.js:

		function b(){
			console.log(this.arg);
		}

### Build to AMD Module (default behavior)
Run amdize to build them into one single AMD module, using default dojo module names:

		amdize --dojo a.js > out.js

Then the out.js will be:

		define([
			"dojo/_base/lang"
		], function(lang){
		
		function b(){
			console.log(this.arg);
		}
		
		function a(arg){
			var obj = {
				arg: arg
			};
			lang.hitch(obj, b)();
		}
		
		return a;
		});

### Build to CMD Module
Use --mode to specify which module system to use:

		amdize --dojo --mode cmd a.js > out.js

The out.js will be:

		define(function(require, exports, module){
			var lang = require("dojo/_base/lang");
			
		function b(){
			console.log(this.arg);
		}
		
		function a(arg){
			var obj = {
				arg: arg
			};
			lang.hitch(obj, b)();
		}
		
		return a;
		});

### Build to Plain JS File
Also list dependencies at top so that the output can still be amdized with other files:

		amdize --dojo --mode plain a.js > out.js

The out.js will be:

		"dojo/_base/lang";

		var a = (function(){
		
		function b(){
			console.log(this.arg);
		}
		
		function a(arg){
			var obj = {
				arg: arg
			};
			lang.hitch(obj, b)();
		}
		
		return a;
		})();

### Specify Name Mappings
Provide custom name mappings in file custom.amdize.js:

		|-custom.amdize.js
		|-a.js
		`~lib/
		  `-b.js

custom.amdize.js:

		exports.map = {
			"dojo/_base/lang": "mylang" // use mylang instead of lang in source code
		};

Specify in the command line:

		amdize --dojo --name-maps custom a.js > out.js

## Specify Return name
Specify the exposed name by --return. (If omitted, the main file name is used.)

		amdize --dojo --return b a.js > out.js

The the out.js will be:

		define([
			"dojo/_base/lang"
		], function(lang){
		
		function b(){
			console.log(this.arg);
		}
		
		function a(arg){
			var obj = {
				arg: arg
			};
			lang.hitch(obj, b)();
		}
		
		return b; // Expose b instead of a
		});

### Exclude files
Exclude some files (separated by comma)  so they and their dependencies won't be in the final output:

		amdize --dojo --exclude lib/b,lib/c a.js > out.js








