if(!netAyukawayenInfoTrackerQuerySelectorFuncs) {
	var netAyukawayenInfoTrackerQuerySelectorFuncs = {
		"tagName": function(node) {
			return node.tagName;
		},
		"idClassName": function(node) {
			if(!node) {
				return null;
			}
			if(node.id) {
				return "#"+node.id;
			}
			if(node.className) {
				return "."+node.className.trim().replace(/\s+/g,".");
			}
			return null;
		},
		"nthChild": function(node) {
			if(!node) {
				return null;
			}
			if(!node.parentNode || !node.parentNode.childNodes || node.parentNode.nodeType!=1) {
				return null;
			}
			
			var childNodes = node.parentNode.childNodes;
			var count=0;
			for(var i=0;i<childNodes.length;++i) {
				if(childNodes[i].nodeType == 1) {
					++count;
				}
				if(childNodes[i] == node) {
					return node.tagName+":nth-child("+count+")";
				}
			}
			return null;
		},
		"nthOfType": function(node) {
			if(!node) {
				return null;
			}
			if(!node.parentNode || !node.parentNode.childNodes || node.parentNode.nodeType!=1) {
				return null;
			}
			
			var childNodes = node.parentNode.childNodes;
			var count=0;
			for(var i=0;i<childNodes.length;++i) {
				if(childNodes[i].tagName == node.tagName) {
					++count;
				}
				if(childNodes[i] == node) {
					return node.tagName+":nth-of-type("+count+")";
				}
			}
			return null;
		},
		/*
		"nthLastChild": function(node) {
			if(!node) {
				return null;
			}
			if(!node.parentNode || !node.parentNode.childNodes || node.parentNode.nodeType!=1) {
				return null;
			}
			
			var childNodes = node.parentNode.childNodes;
			var count=0;
			for(var i=childNodes.length-1;i>=0;--i) {
				if(childNodes[i].nodeType == 1) {
					++count;
				}
				if(childNodes[i] == node) {
					return node.tagName+":nth-last-child("+count+")";
				}
			}
			return null;
		},
		"nthLastOfType": function(node) {
			if(!node) {
				return null;
			}
			if(!node.parentNode || !node.parentNode.childNodes || node.parentNode.nodeType!=1) {
				return null;
			}
			
			var childNodes = node.parentNode.childNodes;
			var count=0;
			for(var i=childNodes.length-1;i>=0;--i) {
				if(childNodes[i].tagName == node.tagName) {
					++count;
				}
				if(childNodes[i] == node) {
					return node.tagName+":nth-last-of-type("+count+")";
				}
			}
			return null;
		},
		*/
	};
}

if(!netAyukawayenInfoTrackerQueryController) {
	var netAyukawayenInfoTrackerQueryController = {
		getQuerys: function(node) {
			var querys = {};
			
			for(var key in netAyukawayenInfoTrackerQuerySelectorFuncs) {
				querys[key] = {
					"q":this.getQuery(node, netAyukawayenInfoTrackerQuerySelectorFuncs[key]),
					"s":1,
				};
				querys[key].i = this.getQuerySelectorIndex(querys[key].q, node);
			}
			return querys;
		},
		getQuery: function(node, selectorFunc) {
			var isDirect = true;
			
			var query = selectorFunc.call(this, node);
			if(!query) {
				query = node.tagName;
			}
			
			while(node.parentNode) {
				node = node.parentNode;
				
				var selector = selectorFunc.call(this, node);
				
				if(!selector) {
					isDirect = false;
					continue;
				}
				
				query = selector + (isDirect&&(selectorFunc!=netAyukawayenInfoTrackerQuerySelectorFuncs.idClassName) ? " >" : " ") + query;
				
				isDirect = true;
			}
			
			return query;
		},
		
		getQuerySelectorIndex: function(query, node) {
			var nodes = document.querySelectorAll(query);
			
			for(var i=0;i<nodes.length;++i) {
				if(nodes[i] == node) {
					return i;
				}
			}
			
			return null;
		},
		
		getNodeValue: function(node) {
			var value = node.textContent.trim();
			if(!value) {
				value = node.getAttribute("alt");
			}
			if(!value) {
				value = node.getAttribute("title");
			}
			if(!value) {
				value = "";
			}
			
			return value;
		},
	};
}
