var Util = {
	createElement: function(tagName, attributes, childnodes) {
		var node = document.createElement(tagName);
		if(attributes) {
			for(var key in attributes) {
				node.setAttribute(key, attributes[key]);
			}
		}
		if(childnodes) {
			for(var i=0;i<childnodes.length;++i) {
				node.appendChild(childnodes[i]);
			}
		}
		return node;
	},
	addClassName: function(node, className) {
		if(!node) {
			return;
		}
		
		if(!node.className) {
			node.className = className;
			return;
		}
		if(this.isContainsClassName(node, className)) {
			return;
		}
		
		node.className += " "+className;
	},
	removeClassName: function(node, className) {
		if(!node) {
			return;
		}
		if(!node.className) {
			return;
		}
		if(!this.isContainsClassName(node, className)) {
			return;
		}
		
		var newClassName = "";
		var classnames = node.className.split(" ");
		for(var i=0;i<classnames.length;++i) {
			if(classnames[i] != className) {
				newClassName += classnames[i]+" ";
			}
		}
		node.className = newClassName.trim();
	},
	isContainsClassName: function(node, className) {
		if(!node) {
			return false;
		}
		if(!node.className) {
			return false;
		}
		
		var classNames = node.className.split(" ");
		for(var i=0;i<classNames.length;++i) {
			if(classNames[i] == className) {
				return true;
			}
		}
		return false;
	},
};