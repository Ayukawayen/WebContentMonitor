var globalSetting = {
	"update":{
		"interval":60,
	},
	"notify":{
		"action":0,
		"soundVol":25,
	},
};

var TimerInterval = 1*60*1000;
var TrackerLimit = 100;

var trackers = {};

var isBackgroundRefreshing = false;
var pendingTrackerIds = {};
var refreshingTrackerIds = {};

var menuId = null;
var isTrackerLimitReached = false;

var sound = new Audio("sound.ogg");
sound.volume = globalSetting.notify.soundVol/100;
var notiId = "";
var notiItems = {};

var unreadTrackerIds = {};

chrome.browserAction.setTitle({"title":chrome.i18n.getMessage("extName")});
chrome.browserAction.setBadgeBackgroundColor({"color":"#ff0"});

loadGlobalSetting(null);
load(onTrackersLoad);

function onTrackersLoad(){
	chrome.runtime.onMessage.addListener(
		function(request, sender, sendResponse) {
			if(request.getTrackers) {
				sendResponse(getTrackers());
			}
			if(request.postTracker) {
				postTracker({
					"name":request.postTracker.name,
					"url":sender.url,
					"querys":request.postTracker.querys,
				});
			}
			if(request.deleteTracker) {
				deleteTracker(request.deleteTracker);
			}
			if(request.putTracker) {
				putTracker(request.putTracker);
			}
			if(request.refreshTrackers) {
				refreshTrackers();
			}
			if(request.refreshTracker) {
				refreshTracker(request.refreshTracker);
			}
			
			if(request.getGlobalSetting) {
				sendResponse(getGlobalSetting());
			}
			if(request.putGlobalSetting) {
				putGlobalSetting(request.putGlobalSetting);
			}
		}
	);
	
	menuId = chrome.contextMenus.create({
		"type":"normal",
		"title":chrome.i18n.getMessage("menuTitle"),
		"contexts":["all",],
		"documentUrlPatterns":[
			"http://*/*",
			"https://*/*",
		],
		"onclick":function(info, tab){
			chrome.tabs.insertCSS(tab.tabId, {file:"contentScript.css"});
			chrome.tabs.executeScript(tab.tabId, {file:"util.js"}, function(result){
				chrome.tabs.executeScript(tab.tabId, {file:"query.js"}, function(result){
					chrome.tabs.executeScript(tab.tabId, {file:"contentScript.js"});
				});
			});
		},
	});
	
	updateContextMenu();
	chrome.notifications.onClosed.addListener(function(id, isByUser){
		if(!isByUser || id != notiId) {
			return;
		}
		notiItems = {};
	});
	onTimerTick();
}

function onTimerTick(){
	var timestamp = Date.now();
	
	for(var trackerId in trackers) {
		var tracker = trackers[trackerId];
		var settingUpdate = tracker.setting.update.isAsDefault ? globalSetting.update : tracker.setting.update;
		if(Math.floor(timestamp/(settingUpdate.interval*60*1000)) > Math.floor(tracker.lastUpdate/(settingUpdate.interval*60*1000))) {
			addPendingTracker(trackerId);
		}
	}
	
	if(Object.keys(pendingTrackerIds).length > 0) {
		isBackgroundRefreshing = true;
		refreshPendingTrackers();
	}
	
	var timeOut = TimerInterval - timestamp%TimerInterval;
	setTimeout(onTimerTick, timeOut);
}
function onBackgroundRefreshCompleted() {
	var isNewInfo = false;
	for(var trackerId in trackers) {
		if(trackers[trackerId].hasChanged) {
			isNewInfo = true;
			
			break;
		}
	}
	
	if(isNewInfo) {
		chrome.browserAction.setBadgeText({"text":"New"});
		//sound.play();
	}
}

function getTrackers(){
	return trackers;
}

function postTracker(tracker){
	var id = Date.now();
	while(trackers[id]) {
		++id;
	}
	
	tracker = Tracker.build(id, tracker.name, tracker.url, tracker.querys);
	
	trackers[tracker.id] = tracker;
	save(function(){
		chrome.browserAction.setBadgeText({"text":"New"});
		chrome.runtime.sendMessage({"trackerPosted":trackers[tracker.id]});
	});
	
	refreshTracker(tracker);
	updateContextMenu();
}

function deleteTracker(tracker){
	delete trackers[tracker.id];
	save(function(){
		chrome.runtime.sendMessage({"trackerDeleted":tracker});
	});
	updateContextMenu();
}

function putTracker(tracker){
	trackers[tracker.id] = tracker;
	save(function(){
		chrome.runtime.sendMessage({"trackerPutted":trackers[tracker.id]});
	});
}

function refreshTrackers(){
	for(var trackerId in trackers) {
		addPendingTracker(trackerId);
	}
	refreshPendingTrackers();
}
function refreshTracker(tracker){
	addPendingTracker(tracker.id);
	refreshPendingTrackers();
}

function getGlobalSetting() {
	return globalSetting;
}
function putGlobalSetting(value) {
	globalSetting = value;
	saveGlobalSetting(function(){
		chrome.runtime.sendMessage({"globalSettingPutted":globalSetting});
	});
}


function addPendingTracker(trackerId) {
	pendingTrackerIds[trackerId] = true;
}
function refreshPendingTrackers() {
	for(var trackerId in pendingTrackerIds) {
		refreshingTrackerIds[trackerId] = true;
		delete pendingTrackerIds[trackerId];
		
		var request = new XMLHttpRequest();
		request.trackerId = trackerId;
		
		request.open("GET", trackers[trackerId].url);
		request.onreadystatechange = function() {
			if(this.readyState == 4) {
				if(!refreshingTrackerIds[this.trackerId]) {
					return;
				}
				onTrackerHttpRequestResponse(this);
				onPendingTrackerRefreshed(this.trackerId);

				delete this;
			}
		}
		request.send();
	}
}
function onPendingTrackerRefreshed(trackerId) {
	removeRefreshingTracker(trackerId);
	var tracker = trackers[trackerId];
	chrome.runtime.sendMessage({"trackerRefreshed":tracker});
	
	if(tracker.isChanged) {
		var settingNotify = trackers[trackerId].setting.notify.isAsDefault ? globalSetting.notify : trackers[trackerId].setting.notify;
		if((settingNotify.action&1) > 0) {
			notiItems[trackerId] = {
				"title":trackers[trackerId].name,
				"message":trackers[trackerId].value ? trackers[trackerId].value : "",
			};
			var itemArray = [];
			for(var i in notiItems) {
				itemArray.push(notiItems[i]);
			}
			chrome.notifications.create(
				notiId,
				{
					type:"list",
					iconUrl:"icon/icon_128.png",
					title:chrome.i18n.getMessage("notiTitle"),
					message:chrome.i18n.getMessage("notiTitle"),
					items:itemArray,
				},
				function(id){
					notiId = id;
				}
			);
		}
		if((settingNotify.action&2) > 0) {
			sound.play();
		}
	}
}
function removeRefreshingTracker(trackerId) {
	if(refreshingTrackerIds[trackerId] == undefined) {
		return;
	}
	
	delete refreshingTrackerIds[trackerId];
	if(Object.keys(refreshingTrackerIds).length <= 0) {
		if(isBackgroundRefreshing) {
			onBackgroundRefreshCompleted();
			isBackgroundRefreshing = false;
		}
		save(null);
	}
}


function onTrackerHttpRequestResponse(request) {
	if(!onTrackerHttpRequestResponse.parser){
		onTrackerHttpRequestResponse.parser = new DOMParser();
	}
	
	if(request.status != 200) {
		return;
	}

	var dom = onTrackerHttpRequestResponse.parser.parseFromString(request.responseText,"text/html");
	var tracker = trackers[request.trackerId];
	
	tracker.lastUpdate = Date.now();
	
	var nodeScores = {};
	var queryNodes = {};
	var topNode = {
		"node":null,
		"s":0,
	};
	
	for(var key in tracker.querys) {
		var query = trackers[request.trackerId].querys[key];
		var node = dom.querySelectorAll(query.q)[query.i];
		
		queryNodes[key] = node;
		
		if(node) {
			if(!nodeScores[node]) {
				nodeScores[node] = 0;
			}
			nodeScores[node] += query.s;
			if(topNode.s < nodeScores[node]) {
				topNode = {
					"node":node,
					"s":nodeScores[node],
				};
			}
			
			continue;
		}
	}
	
	if(!topNode.node) {
		tracker.isChanged = (tracker.value != "");
		if(tracker.isChanged) {
			tracker.valuePrev = tracker.value;
			tracker.value = "";
			tracker.hasChanged = true;
		}
		return;
	}
	
	tracker.isChanged = (tracker.value != netAyukawayenInfoTrackerQueryController.getNodeValue(topNode.node));
	if(tracker.isChanged) {
		tracker.valuePrev = tracker.value;
		tracker.value = netAyukawayenInfoTrackerQueryController.getNodeValue(topNode.node);
		tracker.hasChanged = true;
		
		for(var key in tracker.querys) {
			tracker.querys[key].s = 0.5 + tracker.querys[key].s*0.5;
		}
	}
	
	for(var key in tracker.querys) {
		if(queryNodes[key] != topNode.node) {
			tracker.querys[key].q = netAyukawayenInfoTrackerQueryController.getQuery(topNode.node, netAyukawayenInfoTrackerQuerySelectorFuncs[key]);
			tracker.querys[key].s = 0;
		}
	}
	
}

function load(callback) {
	chrome.storage.sync.get({"trackerIds":[], "trackers":{}}, function(result) {
		var trackerKeys = {};
		for(var i=0;i<result.trackerIds.length;++i) {
			trackerKeys["tracker_"+result.trackerIds[i]] = {};
		}
		loadTrackers(trackerKeys, callback);
	});
}
function loadTrackers(trackerKeys, callback) {
	chrome.storage.sync.get(trackerKeys, function(result) {
		trackers = {};
		for(var key in result) {
			var tracker = JSON.parse(result[key]);
			if(!tracker.id) {
				var tracker = Wrapper.unwrap(JSON.parse(result[key]), Tracker.template);
				//continue;
			}
			tracker.setting.display = tracker.setting.display || globalSetting.display;

			trackers[tracker.id] = tracker;
		}
		if(callback) {
			callback();
		}
	});
}

function save(callback) {
	var trackerDatas = {};
	for(var trackerId in trackers) {
		trackerDatas["tracker_"+trackerId] = JSON.stringify(trackers[trackerId]);
	}
	trackerDatas["trackerIds"] = Object.keys(trackers);
	chrome.storage.sync.set(trackerDatas, function(){
		if(callback) {
			callback();
		}
	});
}

function loadGlobalSetting(callback) {
	chrome.storage.sync.get({"globalSetting":globalSetting}, function(result) {
		globalSetting = result.globalSetting;
		globalSetting.display = globalSetting.display || {"isAsDefault":true, "prev":false};
		if(callback) {
			callback();
		}
	});
}
function saveGlobalSetting(callback) {
	chrome.storage.sync.set({"globalSetting":globalSetting}, function() {
		if(callback) {
			callback(globalSetting);
		}
	});
}


function updateContextMenu() {
	if(isTrackerLimitReached == Object.keys(trackers).length>=TrackerLimit) {
		return;
	}
	
	isTrackerLimitReached = !isTrackerLimitReached;
	
	if(isTrackerLimitReached) {
	}
	chrome.contextMenus.update(menuId, {
		"title":isTrackerLimitReached ? chrome.i18n.getMessage("menuTitleReached") : chrome.i18n.getMessage("menuTitle"),
		"enabled":!isTrackerLimitReached,
	});
}

function onPopupClosed() {
	var isSaveRequired = false;
	for(var trackerId in trackers) {
		if(trackers[trackerId].hasChanged) {
			isSaveRequired = true;
			trackers[trackerId].hasChanged = false;
		}
	}
	if(isSaveRequired) {
		save(null);
	}
}
