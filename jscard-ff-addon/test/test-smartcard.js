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

// https://addons.mozilla.org/en-US/developers/docs/sdk/1.0/packages/api-utils/docs/unit-test.html

exports.test_transmitControlCommand = function(test) {
	try {
		var smartcard = require("smartcard");
		
		var cardTerminals = new smartcard.CardTerminals();
		var terminals = cardTerminals.list();
	
		test.assert(terminals.length > 0);
		
		var terminal = terminals[0];
		test.assert(terminal.isCardPresent());
		
		var card = terminal.connect("*");
		
		var channel = card.getBasicChannel();
		
		var IOCTL_SMARTCARD_VENDOR_IFD_EXCHANGE = 0x42000000 + 1;
		
		var data = [ 2 ];
        var resp = card.transmitControlCommand(IOCTL_SMARTCARD_VENDOR_IFD_EXCHANGE, data);
        console.debug("Firmware: " + resp);
		
		card.disconnect(false);
	
	} catch (e) {
		console.error("test_transmitControlCommand: exception -> "+e);
		test.exception(e);
	}
	
};

//exports.test_example = function(test) {
//	
//};