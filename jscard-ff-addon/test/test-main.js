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

//exports.testTestRun = function(test) {
//  test.pass("Unit test running!");
//};

//exports.testId = function(test) {
//  test.assert(require("self").id.length > 0);
//};

exports.test_PCSC = function(test) {
	
	const pcsc = require("pcsc");
	
	try {
		var contextId = pcsc.SCardEstablishContext(pcsc.defs.SCARD_SCOPE_USER);
		//test.assert(contextId typeof Number);
		
		var validContext = pcsc.SCardIsValidContext(contextId);
		
		test.assertEqual(validContext, true);
		
		var readers = pcsc.SCardListReaders(contextId);
		test.assert(readers.length > 0);
		console.log("Num readers:"+readers.length);
		
		var status = pcsc.SCardGetStatusChange(contextId, 0, [pcsc.defs.SCARD_STATE_UNAWARE], [readers[0]]);
		
		var isPresent = (status[0] & pcsc.defs.SCARD_STATE_PRESENT) != 0;
		test.assert(isPresent);
		
		var cardId = pcsc.SCardConnect(contextId, readers[0], pcsc.defs.SCARD_SHARE_SHARED, pcsc.defs.SCARD_PROTOCOL_T0 | pcsc.defs.SCARD_PROTOCOL_T1 );
		console.debug("Conexion con la tarjeta realizada -> "+cardId);
		
		var card_conn_2 = pcsc.SCardConnect(contextId, readers[0], pcsc.defs.SCARD_SHARE_SHARED, pcsc.defs.SCARD_PROTOCOL_T0 | pcsc.defs.SCARD_PROTOCOL_T1 );
		console.debug("Conexion con la tarjeta realizada -> "+card_conn_2);
		
		pcsc.SCardBeginTransaction(cardId);
		
		var reset = true;
		var disposeMode = (reset ? pcsc.defs.SCARD_LEAVE_CARD : pcsc.defs.SCARD_RESET_CARD);
		pcsc.SCardEndTransaction(cardId, disposeMode);
		
		pcsc.SCardBeginTransaction(card_conn_2);
		pcsc.SCardEndTransaction(card_conn_2, disposeMode);
		
		pcsc.SCardDisconnect(cardId, disposeMode);
		pcsc.SCardDisconnect(card_conn_2, disposeMode);
		
		pcsc.SCardReleaseContext(contextId);
		
		test.pass();
		
	} catch (e) {
		console.error("-> Error: "+e);
				
		test.exception(e);
	}
	
};

exports.test_smartcard = function(test) {
	try {
		
        // TerminalFactory factory = TerminalFactory.getDefault();
        // List<CardTerminal> terminals = factory.terminals().list();
        // System.out.println("Terminals: " + terminals);
		// CardTerminal terminal = terminals.get(0);
		// Card card = terminal.connect("T=0");
		// System.out.println("card: " + card);
		// CardChannel channel = card.getBasicChannel();
		// ResponseAPDU r = channel.transmit(new CommandAPDU(c1));
		// System.out.println("response: " + toString(r.getBytes()));
		// card.disconnect(false);
		
		var smartcard = require("smartcard");
		
		var cardTerminals = new smartcard.CardTerminals();
		var terminals = cardTerminals.list();
	
		test.assert(terminals.length > 0);
		
		for (var i = 0; i < terminals.length; i++) {
			var terminal  = terminals[i];
			console.debug("terminal.isCardPresent(): "+terminal.isCardPresent());
			console.debug("terminal.waitForCardAbsent(1000): "+terminal.waitForCardAbsent(1000));
			
			var isPresent = terminal.waitForCardPresent(1000);
			console.debug("isPresent: "+isPresent);
			if (isPresent) {
				var card = terminal.connect("*");
				console.debug("card: "+card);
				
				var channel = card.getBasicChannel();
				console.debug("channel: "+channel);
				
				var commandAPDU = [0x90, 0xB8, 0x00, 0x00, 0x07];
				var responseAPDU = channel.transmit(commandAPDU);
				console.debug("responseAPDU: "+responseAPDU);
				console.debug("responseAPDU.getData() "+responseAPDU.getData());
				
				card.disconnect(false);
				console.debug("card: "+card);
			}
			
		}
	
	} catch (e) {
		console.error("-> Error: "+e);
		test.exception(e);
	}
	
	
};