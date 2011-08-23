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
const pcsc = require("pcsc");

const cardterminallib = require("cardterminal");

const cardlib = require("card");

/**
 * CardTerminals
 * 
 * This class allows applications to enumerate the available CardTerminals,
 * obtain a specific CardTerminal, or wait for the insertion or removal of
 * cards.
 *
 */
function CardTerminals() {
	this.contextId = 0;
    this.init();
}

CardTerminals.prototype = {

	init: function(){
		
		if (this.contextId == 0) {
			this.contextId = pcsc.SCardEstablishContext(pcsc.defs.SCARD_SCOPE_USER);
        }
	},
	
	unload: function () {
		try {
			if (this.contextId != 0) {
				 pcsc.SCardReleaseContext(this.contextId);
			}
		} catch (e) {
			console.error("CardTerminals: unload error ["+e+"]");
		}
		
	},

	list: function(state) {
		if (!state) {
			state = this.states.ALL;
		}
		try {
			var readerNames = pcsc.SCardListReaders(this.contextId);
			var readersList = new Array(readerNames.length);
//			if (stateMap == null) {
//				// If waitForChange() has never been called, treat event
//				// queries as status queries.
//				if (state == this.states.CARD_INSERTION) {
//					state = this.states.CARD_PRESENT;
//				} else if (state == this.states.CARD_REMOVAL) {
//					state = this.states.CARD_ABSENT;
//				}
//			}
			for (var i in readerNames) {
				var terminal = new cardterminallib.CardTerminal(this.contextId, readerNames[i]);
				//ReaderState readerState;
				switch (state) {
				case this.states.ALL:
					readersList[i] = terminal;
					break;
				case this.states.CARD_PRESENT:
					if (terminal.isCardPresent()) {
						readersList[i] = terminal;
					}
					break;
				case this.states.CARD_ABSENT:
					if (terminal.isCardPresent() == false) {
						readersList[i] = terminal;
					}
					break;
				case this.states.CARD_INSERTION:
					/*readerState = stateMap.get(readerName);
					if ((readerState != null) && readerState.isInsertion()) {
						readersList[i] = terminal;
					}*/
					break;
				case this.states.CARD_REMOVAL:
					/*readerState = stateMap.get(readerName);
					if ((readerState != null) && readerState.isRemoval()) {
						readersList[i] = terminal;
					}*/
					break;
				default:
					throw new Error("list(): Unknown state: " + state);
				}
			}
			return readersList;
		} catch (e) {
			throw e;
		}
	},
	
	states : {
 		
		ALL: 0,
			
		/**
		 * CardTerminals in which a card is present.
		 */
		CARD_PRESENT: 1,
		
		/**
		 * CardTerminals in which a card is not present.
		 */
		CARD_ABSENT: 2,
			
		/**
		 * CardTerminals for which a card insertion was detected during the
		 * latest call to {@linkplain State#waitForChange waitForChange()}
		 * call.
		 */
		CARD_INSERTION: 3,
		
		/**
		 * CardTerminals for which a card removal was detected during the
		 * latest call to {@linkplain State#waitForChange waitForChange()}
		 * call.	
		 */
		CARD_REMOVAL: 4
		},
		
		toString : function() {
	        return "CardTerminals : contextId: " + this.contextId;
	    }
	
};


exports.CardTerminals = CardTerminals;