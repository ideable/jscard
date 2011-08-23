/* ***** BEGIN LICENSE BLOCK *****
* Version: MPL 1.1/GPL 2.0/LGPL 2.1
*
* The contents of this file are subject to the Mozilla Public License Version
* 1.1 (the "License"); you may not use this file except in compliance with
* the License. You may obtain a copy of the License at
* http://www.mozilla.org/MPL/
*
* Software distributed under the License is distributed on an "AS IS" basis,
* WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
* for the specific language governing rights and limitations under the
* License.
*
* The Original Code is jscard code.
*
* The Initial Developer of the Original Code is the Ideable Solutions.
* Portions created by the Initial Developer are Copyright (C) 2011
* the Initial Developer. All Rights Reserved.
*
* Contributor(s):
* Gonzalo Perez <gperez@ideable.net>
* Unai Martinez <umartinez@ideable.net>
*
* Alternatively, the contents of this file may be used under the terms of
* either the GNU General Public License Version 2 or later (the "GPL"), or
* the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
* in which case the provisions of the GPL or the LGPL are applicable instead
* of those above. If you wish to allow use of your version of this file only
* under the terms of either the GPL or the LGPL, and not to allow others to
* use your version of this file under the terms of the MPL, indicate your
* decision by deleting the provisions above and replace them with the notice
* and other provisions required by the GPL or the LGPL. If you do not delete
* the provisions above, a recipient may use your version of this file under
* the terms of any one of the MPL, the GPL or the LGPL.
*
* ***** END LICENSE BLOCK ***** */

const {Cc, Ci, Cu, Cm, Cr, components} = require("chrome");

const smartcard = require("smartcard");

const respApduLib = require("responseAPDU");

/**
 * Smartcard API
 *
 */
function SmartcardAPI() {
}

SmartcardAPI.prototype = {

	sandbox: null,

	window: null,
	
	api: {
		
		CardTerminals : function SCAPI_CardTerminals() {
			var cardTerminals = new smartcard.CardTerminals();
			require("unload").ensure(cardTerminals, "unload");
			return cardTerminals;
		},
		
		ResponseAPDU : respApduLib.ResponseAPDU
	}
  
};

exports.main = function() {
    
    // https://addons.mozilla.org/en-US/developers/docs/sdk/1.0/packages/api-utils/docs/unload.html
    
	var scApi = new SmartcardAPI();
	
	require("observer-service").add("inner-window-destroyed",
			function (aSubject, aData) {
				if ( this.window ) {
				    let windowID = aSubject.QueryInterface(Ci.nsISupportsPRUint64).data;
				    let innerWindowID = this.window.QueryInterface(Ci.nsIInterfaceRequestor).
				                          getInterface(Ci.nsIDOMWindowUtils).currentInnerWindowID;
				    if (windowID == innerWindowID) {
				    	delete this.sandbox;
				    	delete this.window;
				    	// Services.obs.removeObserver(this, "inner-window-destroyed");
				    }
				}
			},
			scApi);
	
	// https://developer.mozilla.org/en/Observer_Notifications#Documents
	// https://developer.mozilla.org/en/XPCOM_Interface_Reference/nsIDOMGlobalPropertyInitializer
	require("observer-service").add("content-document-global-created", 
			function (aSubject, aData) {
			    let self = this;
			    var aWindow = aSubject.window;
			
			    this.window = XPCNativeWrapper.unwrap(aWindow);
			
			    this.sandbox = Cu.Sandbox(this.window, 
			                              { sandboxPrototype: this.window, wantXrays: false });
			
                this.window.smartcard = scApi.api;
//                this.window.smartcard = cardTerminals;
                
			    // we need a xul window reference for the DOMCryptMethods
//			    this.xulWindow = aWindow.QueryInterface(Ci.nsIDOMWindow)
//			      .QueryInterface(Ci.nsIInterfaceRequestor)
//			      .getInterface(Ci.nsIWebNavigation)
//			      .QueryInterface(Ci.nsIDocShellTreeItem)
//			      .rootTreeItem
//			      .QueryInterface(Ci.nsIInterfaceRequestor)
//			      .getInterface(Ci.nsIDOMWindow)
//			      .QueryInterface(Ci.nsIDOMChromeWindow);
			
//			    crypto.setXULWindow(this.xulWindow);
			
			    
//			    Cu.evalInSandbox("", sandbox);
//			    log("aWindow.smartcard: "+this.sandbox.smartcard);
			    
			},			scApi);
	
};

function log(aMessage) {
	var _msg = "Smartcard IO: " + aMessage;
	console.log(_msg);
}