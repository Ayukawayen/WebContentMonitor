var Wrapper = {
	wrap: function(object, template) {
		var args = [];
		
		for(var i=0;i<template.length;++i) {
			var key = template[i];
			
			if(!(key instanceof Object)) {
				args.push(object[key]);
				continue;
			}
			
			if(key.type == "Object") {
				args.push(this.wrap(object[key.name], key.template));
				continue;
			}
			
			if(key.type == "Array") {
				var array = [];
				for(var ai=0;ai<object[key.name].length;++ai) {
					array.push(this.wrap(object[key.name][ai], key.template));
				}
				args.push(array);
				continue;
			}
			
			if(key.type == "Map") {
				var mKeys = [];
				var mValues = [];
				
				for(var mKey in object[key.name]) {
					mKeys.push(mKey);
					mValues.push(this.wrap(object[key.name][mKey], key.template));
				}
				
				args.push([mKeys, mValues]);
				continue;
			}
		}

		return args;
	},
	unwrap: function(args, template) {
		var object = {};
		
		for(var i=0;i<template.length;++i) {
			var arg = args.shift();
			var key = template[i];
			
			if(!(key instanceof Object)) {
				object[key] = arg;
				continue;
			}
			
			if(key.type == "Object") {
				object[key.name] = this.unwrap(arg, key.template);
				continue;
			}
			
			if(key.type == "Array") {
				object[key.name] = [];
				for(var ai=0;ai<arg.length;++ai) {
					object[key.name].push(this.unwrap(arg[ai], key.template));
				}
				continue;
			}
			
			if(key.type == "Map") {
				object[key.name] = {};
				
				var mKeys = arg[0];
				var mValues = arg[1];
				
				for(var ai=0;ai<mKeys.length;++ai) {
					object[key.name][mKeys[ai]] = this.unwrap(mValues[ai], key.template);
				}
				continue;
			}
		}
		
		return object;
	},
	
	clone: function(object, template) {
		return this.unwrap(this.wrap(object, template), template);
	},
	
	findTemplate: function(name, template) {
		for(var i=0;i<template.length;++i) {
			var key = template[i];
			
			if(!(key instanceof Object)) {
				continue;
			}
			
			if(key.name == name) {
				return key.template;
			}
		}
		
		return null;
	},
	
	build: function(template) {
		var object = {};
		
		for(var i=0;i<template.length;++i) {
			var key = template[i];
			
			if(!(key instanceof Object)) {
				object[key] = null;
				continue;
			}
			
			if(key.type == "Object") {
				object[key.name] = this.build(key.template);
				continue;
			}
			
			if(key.type == "Array") {
				object[key.name] = [];
				continue;
			}
			
			if(key.type == "Map") {
				object[key.name] = {};
				continue;
			}
		}
		
		return object;
	},
};