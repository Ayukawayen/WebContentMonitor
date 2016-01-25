if(!netAyukawayenInfoTrackerContentScript) {
	var netAyukawayenInfoTrackerContentScript = {
		isInited:false,
		status:"none",
		isEnabled:false,
		
		popupNode:null,
		
		querys:null,
		
		init:function() {
			if(this.isInited) {
				return;
			}
			
			this.popupNode = document.getElementById("netAyukawayenInfoTrackerPopup");
			if(!this.popupNode) {
				this.buildPopupNode();
			}
			
			this.popupNode.style.display = "none";
			
			document.querySelector("body").appendChild(this.popupNode);
			
			this.isInited = true;
		},
		
		setStatus:function(value){
			if(this.status == value) {
				return;
			}
			this.status = value;
			if(this.status == "selecting") {
				document.querySelector("body").addEventListener("mouseover", this.onNodeMouseover);
				document.querySelector("body").addEventListener("click", this.onNodeClick);
				
				this.popupNode.querySelector(".trackerName").style.display = "none";
				this.popupNode.querySelector(".trackerHint").innerHTML = chrome.i18n.getMessage("contentHintSelecting");
				this.popupNode.querySelector(".trackerControl .trackerControlCancel").value = chrome.i18n.getMessage("contentCancel");
				this.popupNode.querySelector(".trackerControl .trackerControlSubmit").style.display = "none";
				this.popupNode.querySelector(".trackerControl .trackerControlSubmit").value = chrome.i18n.getMessage("contentNext");
				
				this.popupNode.style.display = "block";
			}
			else if(this.status == "naming") {
				document.querySelector("body").removeEventListener("click", this.onNodeClick);
				document.querySelector("body").removeEventListener("mouseover", this.onNodeMouseover);
				
				this.popupNode.querySelector(".trackerName").style.display = "block";
				this.popupNode.querySelector(".trackerName input").value = chrome.i18n.getMessage("contentNamingDefault");
				this.popupNode.querySelector(".trackerName input").focus();
				this.popupNode.querySelector(".trackerHint").innerHTML = chrome.i18n.getMessage("contentHintNaming");
				this.popupNode.querySelector(".trackerControl .trackerControlCancel").value = chrome.i18n.getMessage("contentPrev");
				this.popupNode.querySelector(".trackerControl .trackerControlSubmit").value = chrome.i18n.getMessage("contentSave");
				this.popupNode.querySelector(".trackerControl .trackerControlSubmit").style.display = "block";
				
				this.popupNode.style.display = "block";
			}
			else {
				this.popupNode.style.display = "none";
				this.popupNode.querySelector(".trackerName input").display = "none";
				this.popupNode.querySelector(".trackerControl .trackerControlCancel").value = "";
				this.popupNode.querySelector(".trackerControl .trackerControlSubmit").style.display = "none";
				this.popupNode.querySelector(".trackerControl .trackerControlSubmit").value = "";
				
				document.querySelector("body").removeEventListener("click", this.onNodeClick);
				document.querySelector("body").removeEventListener("mouseover", this.onNodeMouseover);
				
				this.onNodeMouseover(null);
			}
		},
		
		mouseoverStyle:{
			"backgroundColor":"#33f",
			"color":"#ff0",
		},
		currentElement:null,
		currentElementOriginalStyle:{},
		
		onNodeMouseover:function(e){
			if(netAyukawayenInfoTrackerContentScript.currentElement) {
				for(var key in netAyukawayenInfoTrackerContentScript.mouseoverStyle) {
					netAyukawayenInfoTrackerContentScript.currentElement.style[key] = netAyukawayenInfoTrackerContentScript.currentElementOriginalStyle[key];
				}
			}
			
			if(!e) {
				netAyukawayenInfoTrackerContentScript.popupNode.querySelector(".trackerValue").innerHTML = "";
				return;
			}
			
			netAyukawayenInfoTrackerContentScript.popupNode.querySelector(".trackerValue").innerHTML = netAyukawayenInfoTrackerQueryController.getNodeValue(e.toElement);
			
			netAyukawayenInfoTrackerContentScript.currentElement = e.toElement;
			
			for(var key in netAyukawayenInfoTrackerContentScript.mouseoverStyle) {
				netAyukawayenInfoTrackerContentScript.currentElementOriginalStyle[key] = e.toElement.style[key];
				netAyukawayenInfoTrackerContentScript.currentElement.style[key] = netAyukawayenInfoTrackerContentScript.mouseoverStyle[key];
			}
		},
		onNodeClick:function(e){
			netAyukawayenInfoTrackerContentScript.setStatus("naming");
			netAyukawayenInfoTrackerContentScript.popupNode.querySelector(".trackerName input").select();
			
			netAyukawayenInfoTrackerContentScript.querys = netAyukawayenInfoTrackerQueryController.getQuerys(e.toElement);

			e.preventDefault();
		},
		
		buildPopupNode: function() {
			this.popupNode = Util.createElement("form", {"id":"netAyukawayenInfoTrackerPopup",}, [
				Util.createElement("div", {"class":"trackerName",}, [
					Util.createElement("input", {"type":"text",}, []),
				]),
				Util.createElement("div", {"class":"trackerValue",}, [
				]),
				Util.createElement("div", {"class":"trackerHint",}, [
				]),
				Util.createElement("div", {"class":"trackerControl",}, [
					Util.createElement("input", {"type":"button","class":"trackerControlItem trackerControlCancel"}, []),
					Util.createElement("input", {"type":"submit","class":"trackerControlItem trackerControlSubmit"}, []),
				]),
			]);
			
			this.popupNode.addEventListener("click", function(e){e.stopPropagation();});
			this.popupNode.addEventListener("mouseover", function(e){e.stopPropagation();});
			
			this.popupNode.addEventListener("submit", this.onSubmitClicked);
			this.popupNode.querySelector(".trackerControl .trackerControlCancel").addEventListener("click", this.onCancelClicked);
		},
		
		onCancelClicked:function(e){
			if(netAyukawayenInfoTrackerContentScript.status == "selecting") {
				netAyukawayenInfoTrackerContentScript.setStatus("none");
			}
			else if(netAyukawayenInfoTrackerContentScript.status == "naming") {
				netAyukawayenInfoTrackerContentScript.setStatus("selecting");
			}
			else {
			}
			
			e.preventDefault();
		},
		onSubmitClicked:function(e){
			if(netAyukawayenInfoTrackerContentScript.status == "selecting") {
			}
			else if(netAyukawayenInfoTrackerContentScript.status == "naming") {
				chrome.runtime.sendMessage(
					{"postTracker":{
						"name":netAyukawayenInfoTrackerContentScript.popupNode.querySelector(".trackerName input").value,
						"querys":netAyukawayenInfoTrackerContentScript.querys,
					}},
					function(response){
					}
				);
				netAyukawayenInfoTrackerContentScript.setStatus("none");
			}
			else {
			}
			
			e.preventDefault();
		},
		
	};
	
	netAyukawayenInfoTrackerContentScript.init();
}

netAyukawayenInfoTrackerContentScript.setStatus("selecting");

