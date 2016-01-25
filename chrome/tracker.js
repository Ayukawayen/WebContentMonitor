var Tracker = {
	template: [
		"id",
		"name",
		"url",
		"querys",
		"value",
		{
			"name":"setting",
			"type":"Object",
			"template":[
				{
					"name":"update",
					"type":"Object",
					"template":["isAsDefault","interval","baseTime",],
				},
				{
					"name":"notify",
					"type":"Object",
					"template":["isAsDefault","action",],
				},
			],
		},
		"lastUpdate",
		"isChanged",
		"hasChanged",
	],

	build: function(id, name, url, querys) {
		var tracker = {
			"id":id,
			"name":name,
			"url":url,
			"querys":querys,
			"value":"",
			"valuePrev":"",
			"setting":{
				"update":{
					"isAsDefault":true,
					"interval":60,
					"baseTime":0,
				},
				"notify":{
					"isAsDefault":true,
					"action":0,
				},
				"display":{
					"isAsDefault":true,
					"prev":false,
				},
			},
			"lastUpdate":0,
			"isChanged":false,
			"hasChanged":false,
		};
		
		return tracker;
	},
};
