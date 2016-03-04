var trackers = {};
var trackerNodes = {};
var refreshingTrackerIds = {};

var globalSetting = {
	"update":{
		"interval":60,
	},
	"notify":{
		"action":0,
		"soundVol":25,
	},
	"display":{
		"prev":false,
	},
};
var selectedTracker = null;

var background = chrome.extension.getBackgroundPage();
 
addEventListener("unload", function(e) {
	localStorage.setItem('popupWidth', document.querySelector('#wrapper').clientWidth);
	background.onPopupClosed();
}, true);


i18n();
onOpen();


function i18n() {
	document.querySelector("head title").innerHTML = chrome.i18n.getMessage("extName");
	
	document.querySelector("#main .panelHeader .name").innerHTML = chrome.i18n.getMessage("extName");
	document.querySelector("#main .panelHeader .headerControl .headerControlRefresh").title = chrome.i18n.getMessage("popupHeaderRefresh");
	document.querySelector("#main .panelHeader .headerControl .headerControlSetting").title = chrome.i18n.getMessage("popupHeaderSetting");
	
	document.querySelector("#setting #settingItemList #settingUpdate .settingItemTitle").innerHTML = chrome.i18n.getMessage("popupSettingUpdateTitle");
	document.querySelector("#setting #settingItemList #settingUpdate .settingAsDefault label").innerHTML = chrome.i18n.getMessage("popupSettingAsGlobal");
	document.querySelector("#setting #settingItemList #settingUpdate .settingItemDetail span:nth-of-type(1)").innerHTML = chrome.i18n.getMessage("popupSettingUpdateDetail0");
	document.querySelector("#setting #settingItemList #settingUpdate .settingItemDetail span:nth-of-type(2)").innerHTML = chrome.i18n.getMessage("popupSettingUpdateDetail1");
	var nodes = document.querySelectorAll("#setting #settingItemList #settingUpdate .settingItemDetail #settingUpdateIntervalUnit option");
	for(var i=0;i<nodes.length;++i) {
		if(nodes[i].value == 60) {
			nodes[i].innerHTML = chrome.i18n.getMessage("popupSettingUpdateOptionHours");
		}
		if(nodes[i].value == 1) {
			nodes[i].innerHTML = chrome.i18n.getMessage("popupSettingUpdateOptionMinutes");
		}
	}
	
	document.querySelector("#setting #settingItemList #settingNotify .settingItemTitle").innerHTML = chrome.i18n.getMessage("popupSettingNotifyTitle");
	document.querySelector("#setting #settingItemList #settingNotify .settingAsDefault label").innerHTML = chrome.i18n.getMessage("popupSettingAsGlobal");
	document.querySelector("#setting #settingItemList #settingNotify #settingNotifyPopupLabel").innerHTML = chrome.i18n.getMessage("popupSettingNotifyActionPopup");
	document.querySelector("#setting #settingItemList #settingNotify #settingNotifySoundLabel").innerHTML = chrome.i18n.getMessage("popupSettingNotifyActionSound");
	
	document.querySelector("#setting #settingItemList #settingDisplay .settingItemTitle").innerHTML = chrome.i18n.getMessage("popupSettingDisplayTitle");
	document.querySelector("#setting #settingItemList #settingDisplay .settingAsDefault label").innerHTML = chrome.i18n.getMessage("popupSettingAsGlobal");
	document.querySelector("#setting #settingItemList #settingDisplay #settingDisplayPrevLabel").innerHTML = chrome.i18n.getMessage("popupSettingDisplayPrev");
	
	document.querySelector("#setting #settingControl #settingCancel").innerHTML = chrome.i18n.getMessage("popupSettingCancel");
	document.querySelector("#setting #settingControl #settingSave").innerHTML = chrome.i18n.getMessage("popupSettingSave");
}


function onOpen(){
	chrome.browserAction.setBadgeText({"text":""});
	chrome.runtime.sendMessage(
		{"getGlobalSetting":{}},
		function(response) {
			globalSetting = response;
		}
	);
	chrome.runtime.sendMessage(
		{"getTrackers":{}},
		function(response) {
			trackers = response;
			onTrackersLoad();
		}
	);
	
	var width = localStorage.getItem('popupWidth');
	if(width && width>60) {
		//document.querySelector('body').style.setProperty('width', width+'px');
		//document.querySelector('body').style.width = width+'px';
		document.querySelector('#wrapper').style.setProperty('width', width+'px');
	}
}

function onTrackersLoad(){
	chrome.runtime.onMessage.addListener(
		function(request, sender, sendResponse) {
			if(request.trackerPosted) {
				onTrackerPosted(request.trackerPosted);
			}
			if(request.trackerDeleted) {
				onTrackerDeleted(request.trackerDeleted);
			}
			if(request.trackerPutted) {
				onTrackerPutted(request.trackerPutted);
			}
			if(request.trackerRefreshed) {
				onTrackerRefreshed(request.trackerRefreshed);
			}
			if(request.globalSettingPutted) {
				onGlobalSettingPutted(request.globalSettingPutted);
			}
		}
	);
	
	document.querySelector("#main .panelHeader .headerControl .headerControlRefresh").addEventListener("click", onControlRefreshClick);
	document.querySelector("#main .panelHeader .headerControl .headerControlSetting").addEventListener("click", onControlSettingClick);
	
	document.querySelector("#setting #settingUpdate .settingAsDefault input").addEventListener("change", onSettingUpdateAsDefaultChange);
	document.querySelector("#setting #settingNotify .settingAsDefault input").addEventListener("change", onSettingNotifyAsDefaultChange);
	document.querySelector("#setting #settingDisplay .settingAsDefault input").addEventListener("change", onSettingDisplayAsDefaultChange);
	document.querySelector("#setting #settingUpdate #settingUpdateInterval").addEventListener("change", onSettingUpdateChange);
	document.querySelector("#setting #settingUpdate #settingUpdateIntervalUnit").addEventListener("change", onSettingUpdateChange);
	document.querySelector("#setting #settingNotify #settingNotifyPopup").addEventListener("change", onSettingNotifyPopupChange);
	document.querySelector("#setting #settingNotify #settingNotifySound").addEventListener("change", onSettingNotifySoundChange);
	document.querySelector("#setting #settingNotify #settingNotifySoundVol").addEventListener("change", onSettingNotifySoundVolChange);
	document.querySelector("#setting #settingDisplay #settingDisplayPrev").addEventListener("change", onSettingDisplayPrevChange);

	document.querySelector("#settingCancel").addEventListener("click", onSettingCancelClick);
	document.querySelector("#settingSave").addEventListener("click", onSettingSaveClick);
	
	for(var trackerId in trackers) {
		onTrackerPosted(trackers[trackerId]);
	}
}

function onControlRefreshClick(){
	if(onControlRefreshClick.isRefreshing) {
		return;
	}
	onControlRefreshClick.isRefreshing = true;
	
	for(var trackerId in trackers) {
		setIsTrackerRefreshing(trackerId, true);
	}
	
	Util.addClassName(document.querySelector("#main .panelHeader .headerControl .headerControlRefresh"), "refreshing");
	
	chrome.runtime.sendMessage(
		{"refreshTrackers":{}},
		function(response) {
		}
	);
}

function onControlSettingClick(){
	selectedTracker = null;

	document.querySelector("#settingName").value = chrome.i18n.getMessage("popupHeaderSetting");
	document.querySelector("#settingName").disabled = "disabled";

	document.querySelector("#settingUpdate .settingAsDefault").style.display = "none";
	document.querySelector("#settingNotify .settingAsDefault").style.display = "none";
	document.querySelector("#settingDisplay .settingAsDefault").style.display = "none";
	
	wrapUpdateInterval(globalSetting.update.interval);
	
	document.querySelector("#settingNotify #settingNotifyPopup").checked = (globalSetting.notify.action&1) > 0;
	document.querySelector("#settingNotify #settingNotifySound").checked = (globalSetting.notify.action&2) > 0;
	document.querySelector("#settingNotify #settingNotifySoundVol").value = globalSetting.notify.soundVol;
	document.querySelector("#settingNotify #settingNotifySoundVol").style.display = "inline";
	
	document.querySelector("#settingDisplay #settingDisplayPrev").checked = globalSetting.display.prev;
	
	document.querySelector("#settingUpdate .settingAsDefault input").checked = false;
	document.querySelector("#settingNotify .settingAsDefault input").checked = false;
	document.querySelector("#settingDisplay .settingAsDefault input").checked = false;

	onSettingUpdateAsDefaultChange.call(document.querySelector("#settingUpdate .settingAsDefault input"));
	onSettingNotifyAsDefaultChange.call(document.querySelector("#settingNotify .settingAsDefault input"));
	onSettingDisplayAsDefaultChange.call(document.querySelector("#settingDisplay .settingAsDefault input"));
	
	document.querySelector("body").className = "setting";
}

function onControlCreateClick(){
	chrome.tabs.executeScript({file:"query.js"}, function(result){
		chrome.tabs.executeScript({file:"contentScript.js"});
	});
}

function onTrackerNameChange(tracker, name){
	tracker.name = name;
	
	chrome.runtime.sendMessage(
		{"putTracker":tracker},
		function(response) {
		}
	);
}

function onTrackerOpenClick(tracker){
	chrome.tabs.create({"url":tracker.url, "active":false});
}

function onTrackerRefreshClick(tracker){
	if(refreshingTrackerIds[tracker.id]) {
		return;
	}
	setIsTrackerRefreshing(tracker.id, true);
	chrome.runtime.sendMessage(
		{"refreshTracker":tracker},
		function(response) {
		}
	);
}

function onTrackerSettingClick(tracker){
	selectedTracker = tracker;
	
	document.querySelector("#settingName").value = selectedTracker.name;
	document.querySelector("#settingName").disabled = null;
	
	wrapUpdateInterval(selectedTracker.setting.update.interval);
	document.querySelector("#settingNotify #settingNotifyPopup").checked = (selectedTracker.setting.notify.action&1) > 0;
	document.querySelector("#settingNotify #settingNotifySound").checked = (selectedTracker.setting.notify.action&2) > 0;
	document.querySelector("#settingNotify #settingNotifySoundVol").style.display = "none";
	document.querySelector("#settingDisplay #settingDisplayPrev").checked = selectedTracker.setting.display.prev;
	
	document.querySelector("#settingUpdate .settingAsDefault input").checked = selectedTracker.setting.update.isAsDefault;
	document.querySelector("#settingNotify .settingAsDefault input").checked = selectedTracker.setting.notify.isAsDefault;
	document.querySelector("#settingDisplay .settingAsDefault input").checked = selectedTracker.setting.display.isAsDefault;

	document.querySelector("#settingUpdate .settingAsDefault").style.display = "block";
	document.querySelector("#settingNotify .settingAsDefault").style.display = "block";
	document.querySelector("#settingDisplay .settingAsDefault").style.display = "block";
	
	onSettingUpdateAsDefaultChange.call(document.querySelector("#settingUpdate .settingAsDefault input"));
	onSettingNotifyAsDefaultChange.call(document.querySelector("#settingNotify .settingAsDefault input"));
	onSettingDisplayAsDefaultChange.call(document.querySelector("#settingDisplay .settingAsDefault input"));
	
	document.querySelector("body").className = "setting";
}
function onTrackerDeleteClick(tracker){
	var confirmText = chrome.i18n.getMessage("popupDeleteConfirm", [tracker.name]);
	if(confirm(confirmText)) {
		chrome.runtime.sendMessage(
			{"deleteTracker":tracker},
			function(response) {
			}
		);
	}
}


function onSettingUpdateChange(){
	document.querySelector("#settingUpdate .settingAsDefault input").checked = false;
}
function onSettingNotifyPopupChange(){
	document.querySelector("#settingNotify .settingAsDefault input").checked = false;
}
function onSettingNotifySoundChange(){
	document.querySelector("#settingNotify .settingAsDefault input").checked = false;
	if(this.checked) {
		background.sound.pause();
		background.sound.currentTime = 0;
		background.sound.play();
	}
}
function onSettingNotifySoundVolChange(){
	background.sound.pause();
	background.sound.currentTime = 0;
	background.sound.volume = this.value/100;
	background.sound.play();
}
function onSettingDisplayPrevChange(){
	document.querySelector("#settingDisplay .settingAsDefault input").checked = false;
}
function onSettingUpdateAsDefaultChange(){
//	document.querySelector("#settingUpdate #settingUpdateInterval").disabled = this.checked ? "disabled" : null;
	if(this.checked) {
		wrapUpdateInterval(globalSetting.update.interval);
	}
}
function onSettingNotifyAsDefaultChange(){
//	document.querySelector("#settingNotify #settingNotifyPopup").disabled = this.checked ? "disabled" : null;
//	document.querySelector("#settingNotify #settingNotifySound").disabled = this.checked ? "disabled" : null;
	if(this.checked) {
		document.querySelector("#settingNotify #settingNotifyPopup").checked = (globalSetting.notify.action&1) > 0;
		document.querySelector("#settingNotify #settingNotifySound").checked = (globalSetting.notify.action&2) > 0;
	}
}
function onSettingDisplayAsDefaultChange(){
	if(this.checked) {
		document.querySelector("#settingDisplay #settingDisplayPrev").checked = globalSetting.display.prev;
	}
}

function onSettingCancelClick(){
	background.sound.volume = globalSetting.notify.soundVol/100;
	
	document.querySelector("body").className = "main";
}

function onSettingSaveClick(){
	if(!selectedTracker) {
		globalSetting.update.interval = getUpdateInterval();
		globalSetting.notify.action = (document.querySelector("#settingNotify #settingNotifyPopup").checked?1:0) | (document.querySelector("#settingNotify #settingNotifySound").checked?2:0);
		globalSetting.notify.soundVol = document.querySelector("#settingNotify #settingNotifySoundVol").value;
		background.sound.volume = globalSetting.notify.soundVol/100;
		globalSetting.display.prev = document.querySelector("#settingDisplay #settingDisplayPrev").checked;
		
		chrome.runtime.sendMessage(
			{"putGlobalSetting":globalSetting},
			function(response) {
			}
		);
	
		document.querySelector("body").className = "main";
		return;
	}

	selectedTracker.name = document.querySelector("#settingName").value;
	
	selectedTracker.setting.update.isAsDefault = document.querySelector("#settingUpdate .settingAsDefault input").checked;
	selectedTracker.setting.notify.isAsDefault = document.querySelector("#settingNotify .settingAsDefault input").checked;
	selectedTracker.setting.display.isAsDefault = document.querySelector("#settingDisplay .settingAsDefault input").checked;

	selectedTracker.setting.update.interval = getUpdateInterval();
	selectedTracker.setting.notify.action = (document.querySelector("#settingNotify #settingNotifyPopup").checked?1:0) | (document.querySelector("#settingNotify #settingNotifySound").checked?2:0);
	selectedTracker.setting.display.prev = document.querySelector("#settingDisplay #settingDisplayPrev").checked;
	
	chrome.runtime.sendMessage(
		{"putTracker":selectedTracker},
		function(response) {
		}
	);
	
	document.querySelector("body").className = "main";
}


function onTrackerPosted(tracker) {
	var node = createTrackerNode();
	trackerNodes[tracker.id] = node;
	updateTrackerNode(node, tracker);
	document.querySelector("#trackerList").appendChild(node);
}
function onTrackerDeleted(tracker) {
	var node = trackerNodes[tracker.id];
	node.parentNode.removeChild(node);
	delete trackerNodes[tracker.id];
	delete trackers[tracker.id];
}
function onTrackerPutted(tracker) {
	trackers[tracker.id] = tracker;
	refreshDisplay(tracker);

	selectedTracker = null;
	document.querySelector("body").className = "main";
}
function onTrackerRefreshed(tracker) {
	var node = trackerNodes[tracker.id];
	trackers[tracker.id] = tracker;
	updateTrackerNode(node, tracker);
	
	setIsTrackerRefreshing(tracker.id, false);
}
function onGlobalSettingPutted(value) {
	globalSetting = value;
	
	for(var k in trackers) {
		refreshDisplay(trackers[k]);
	}
}

function createTrackerNode(tracker) {
	var node = Util.createElement("li", {"class":"tracker",}, [
		Util.createElement("div", {"class":"trackerName",}, [
			Util.createElement("input", {"type":"text",}, []),
		]),
		Util.createElement("div", {"class":"trackerControl",}, [
			Util.createElement("div", {"class":"icon trackerControlOpen","title":chrome.i18n.getMessage("popupTrackerOpen"),}, [
				Util.createElement("div", {"class":"iconContent",}, []),
			]),
			Util.createElement("div", {"class":"icon trackerControlRefresh","title":chrome.i18n.getMessage("popupTrackerRefresh"),}, [
				Util.createElement("div", {"class":"iconContent",}, []),
			]),
			Util.createElement("div", {"class":"icon trackerControlSetting","title":chrome.i18n.getMessage("popupTrackerSetting"),}, [
				Util.createElement("div", {"class":"iconContent",}, []),
			]),
			Util.createElement("div", {"class":"icon trackerControlDelete","title":chrome.i18n.getMessage("popupTrackerDelete"),}, [
				Util.createElement("div", {"class":"iconContent",}, []),
			]),
		]),
		Util.createElement("div", {"class":"trackerValue prev",}, [
			Util.createElement("span", {"class":"valueContent",}, []),
		]),
		Util.createElement("div", {"class":"trackerValue current",}, [
			Util.createElement("span", {"class":"valueContent",}, []),
			Util.createElement("img", {"class":"valueRefreshingImg","src":"icon/ionicons/load-c.png"}, []),
		]),
	]);
	
	node.querySelector(".trackerName input").addEventListener("change",function(){onTrackerNameChange(node.tracker, this.value);});
	node.querySelector(".trackerControlOpen").addEventListener("click",function(){onTrackerOpenClick(node.tracker);});
	node.querySelector(".trackerControlRefresh").addEventListener("click",function(){onTrackerRefreshClick(node.tracker);});
	node.querySelector(".trackerControlSetting").addEventListener("click",function(){onTrackerSettingClick(node.tracker);});
	node.querySelector(".trackerControlDelete").addEventListener("click",function(){onTrackerDeleteClick(node.tracker);});
	
	return node;
}
function updateTrackerNode(node, tracker) {
	node.tracker = tracker;
	
	refreshDisplay(tracker);
	
	node.querySelector(".trackerName input").value = tracker.name;
	node.querySelector(".trackerName").title = tracker.name;
	node.querySelector(".trackerValue.current .valueContent").innerHTML = tracker.value;
	node.querySelector(".trackerValue.prev .valueContent").innerHTML = tracker.valuePrev || "-";
	node.querySelector(".trackerValue.prev").title = tracker.valuePrev || "-";
	var lastUpdateText = new Date(tracker.lastUpdate).toLocaleString();
	node.querySelector(".trackerValue.current").title = tracker.value+"\r\n\r\n"+chrome.i18n.getMessage("popupTrackerCheckInfo", [lastUpdateText]);
	
	if(tracker.hasChanged) {
		Util.addClassName(node, "changed");
	}
}
function refreshDisplay(tracker) {
	var node = trackerNodes[tracker.id];
	var isDisplayPrev = tracker.setting.display.isAsDefault ? globalSetting.display.prev : tracker.setting.display.prev;
	node.setAttribute("displayPrev", (isDisplayPrev ? "true" : "false") );
}

function setIsTrackerRefreshing(trackerId, isRefreshing) {
	if(isRefreshing) {
		refreshingTrackerIds[trackerId] = true;
		Util.addClassName(trackerNodes[trackerId], "refreshing");
	}
	else {
		Util.removeClassName(trackerNodes[trackerId], "refreshing");
		if(refreshingTrackerIds[trackerId] != undefined) {
			delete refreshingTrackerIds[trackerId];
		}
		
		if(Object.keys(refreshingTrackerIds).length <= 0) {
			Util.removeClassName(document.querySelector("#main .panelHeader .headerControl .headerControlRefresh"), "refreshing");
			onControlRefreshClick.isRefreshing = false;
		}
	}
}


function wrapUpdateInterval(interval) {
	var unitValue = 1;
	var units = [60, 1];
	for(var i=0;i<units.length;++i) {
		if(interval >= units[i]) {
			interval = Math.floor(interval/units[i]);
			unitValue = units[i];
			break;
		}
	}
	document.querySelector("#settingUpdate #settingUpdateInterval").value = interval;
	document.querySelector("#settingUpdate #settingUpdateIntervalUnit").value = unitValue;
}

function getUpdateInterval() {
	var v = Math.max(1, Math.ceil(document.querySelector("#settingUpdate #settingUpdateInterval").value));
	return v * document.querySelector("#settingUpdate #settingUpdateIntervalUnit").value;
}