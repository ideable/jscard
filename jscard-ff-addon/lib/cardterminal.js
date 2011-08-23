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

const cardlib = require("card");

/**
 * CardTerminal
 * 
 * A Smart Card terminal, sometimes refered to as a Smart Card Reader. A
 * CardTerminal object can be obtained by calling CardTerminals.list().
 * 
 * Note that physical card readers with slots for multiple cards are represented
 * by one CardTerminal object per such slot.
 * 
 */
function CardTerminal(contextId, name) {
	this.contextId = contextId;
	this.name = name;
}

CardTerminal.prototype = {
		
	isCardPresent : function(){
		try {
            var status = pcsc.SCardGetStatusChange(this.contextId, 0, [pcsc.defs.SCARD_STATE_UNAWARE], [this.name]);
            return (status[0] & pcsc.defs.SCARD_STATE_PRESENT) != 0;
        } catch (e) {
            throw e;
        }
	},
	
	getName: function() {
		return this.name;
	},
	
	connect: function(protocol) {
		
        if (this.card != null) {
            if (this.card._isValid()) {
                var cardProto = this.card.getProtocol();
                if (protocol == "*" || (protocol.toLowerCase() == cardProto.toLowerCase())) {
                    return this.card;
                } else {
                    throw new Error("Cannot connect using " + protocol
                        + ", connection already established using " + cardProto);
                }
            } else {
            	this.card = null;
            }
        }
        try {
            this.card = new cardlib.Card(this, protocol);
            return this.card;
        } catch (e) {
        	
            if (e.code == pcsc.defs.SCARD_W_REMOVED_CARD) {
                throw new Error("No card present");
            } else {
                throw new Error("connect() failed: " + e);
            }
        }
    },
	
    waitForCardPresent: function(timeout) {
        return this._waitForCard(true, timeout);
    },

    waitForCardAbsent: function(timeout) {
        return this._waitForCard(false, timeout);
    },

    toString: function() {
        return "PC/SC terminal " + this.name;
    },
    
    _waitForCard: function(wantPresent, timeout) {
		if (timeout < 0) {
            throw new Error("_waitForCard: timeout must not be negative");
        }
        if (timeout == 0) {
            timeout = pcsc.defs.TIMEOUT_INFINITE;
        }
        var status = [ pcsc.defs.SCARD_STATE_UNAWARE ];
        var readers = [ this.name ];
        try {
            
            status = pcsc.SCardGetStatusChange(this.contextId, 0, status, readers);
            var present = (status[0] & pcsc.defs.SCARD_STATE_PRESENT) != 0;
            if (wantPresent == present) {
                return true;
            }
            
            status = pcsc.SCardGetStatusChange(this.contextId, timeout, status, readers);
            present = (status[0] & pcsc.defs.SCARD_STATE_PRESENT) != 0;
            
            if (wantPresent != present) {
                throw new Error("wait mismatch");
            }
            return true;
        } catch (e) {
        	if (e.code == pcsc.defs.SCARD_E_TIMEOUT) {
                return false;
            } else {
                throw new Error("_waitForCard() failed: " + e);
            }
        }
    }
}

exports.CardTerminal = CardTerminal;