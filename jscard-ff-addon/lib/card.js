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
const cardchannellib = require("cardchannel");
const atrlib = require("atr");

const commandOpenChannel = [0x0, 0x70, 0x0, 0x0, 0x1];

let CardState = { OK: "OK", 
		REMOVED: "REMOVED", 
		DISCONNECTED: "DISCONNECTED"
	};

/**
 * Card
 * 
 * A Smart Card with which a connection has been established. Card objects are
 * obtained by calling CardTerminal.connect().
 * 
 */
function Card(terminal, protocol) {
	this.terminal = terminal;
	this.protocol = protocol;
	this.basicChannel = null;
	this.state = null;
	
	var sharingMode = pcsc.defs.SCARD_SHARE_SHARED;
	
	var connectProtocol;
	if (this.protocol == "*") {
	    connectProtocol = pcsc.defs.SCARD_PROTOCOL_T0 | pcsc.defs.SCARD_PROTOCOL_T1;
	} else if (this._equalsIgnoreCase(this.protocol, "T=0")) {
	    connectProtocol = pcsc.defs.SCARD_PROTOCOL_T0;
	} else if (this._equalsIgnoreCase(this.protocol, "T=1")) {
	    connectProtocol = pcsc.defs.SCARD_PROTOCOL_T1;
	} else if (this._equalsIgnoreCase(this.protocol, "direct")) {
		// testing
	    connectProtocol = 0;
	    sharingMode = pcsc.defs.SCARD_SHARE_DIRECT;
	} else {
	    throw new Error("Unsupported protocol " + protocol);
	}
	
	this.cardId = pcsc.SCardConnect(terminal.contextId, terminal.name, sharingMode, connectProtocol);
	
	var res = pcsc.SCardStatus(this.cardId);
	
	this.atr = new atrlib.ATR(res.atr);
	this.protocol = res.protocol;
	
	this.basicChannel = new cardchannellib.CardChannel(this,0);
	this.state = CardState.OK;
}

Card.prototype = {
		
	/**
	 * Requests exclusive access to this card.
	 * 
	 * <p>
	 * Once a thread has invoked <code>beginExclusive</code>, only this
	 * thread is allowed to communicate with this card until it calls
	 * <code>endExclusive</code>. Other threads attempting communication will
	 * receive a CardException.
	 * 
	 * <p>
	 * Applications have to ensure that exclusive access is correctly released.
	 * This can be achieved by executing the <code>beginExclusive()</code> and
	 * <code>endExclusive</code> calls in a <code>try ... finally</code>
	 * block.
	 */
	beginExclusive: function() {
//		checkSecurity("exclusive");
        this._checkState();
//        if (exclusiveThread != null) {
//            throw new CardException
//                    ("Exclusive access has already been assigned to Thread "
//                    + exclusiveThread.getName());
//        }
        try {
        	pcsc.SCardBeginTransaction(this.cardId);
        } catch (e) {
            handleError(e);
            throw new Error("beginExclusive() failed: " + e);
        }
//        exclusiveThread = Thread.currentThread();
	},
		
	/**
	 * Releases the exclusive access previously established using
	 * <code>beginExclusive</code>.
	 * 
	 */
	endExclusive: function() {
		this._checkState();
//        if (exclusiveThread != Thread.currentThread()) {
//            throw new IllegalStateException
//                    ("Exclusive access not assigned to current Thread");
//        }
        try {
        	pcsc.defs.pcsc.SCardEndTransaction(cardId, SCARD_LEAVE_CARD);
        } catch (e) {
            this._handleError(e);
            throw new Error("endExclusive() failed: "+ e);
        } /*finally {
            exclusiveThread = null;
        }*/
	},
	
	/**
	 * Returns the ATR of this card.
	 * 
	 * @return the ATR of this card.
	 */
	getATR: function() {
		return this.atr;
	},
	
	/**
	 * Returns the CardChannel for the basic logical channel. The basic logical
	 * channel has a channel number of 0.
	 * 
	 */
	getBasicChannel: function() {
		//checkSecurity("getBasicChannel");
		this._checkState();
		return this.basicChannel;
	},
	
	/**
	 * Returns the protocol in use for this card.
	 * 
	 * @return the protocol in use for this card, for example "T=0" or "T=1"
	 */
	getProtocol: function() {
		if (this.protocol == pcsc.defs.SCARD_PROTOCOL_T0) {
			return "T=0";
		} else if (this.protocol == pcsc.defs.SCARD_PROTOCOL_T1) {
			return "T=1";
		} else {
			return "Unknown protocol " + this.protocol;
		}
	},
	
	/**
	 * Opens a new logical channel to the card and returns it. The channel is
	 * opened by issuing a <code>MANAGE CHANNEL</code> command that should use
	 * the format <code>[00 70 00 00 01]</code>.
	 */
	openLogicalChannel: function() {
		//checkSecurity("openLogicalChannel");
        this._checkState();
        this._checkExclusive();
        try {
        	
            var response = SCardTransmit(trhis.cardId, this.protocol, commandOpenChannel, 0, commandOpenChannel.length);
            if ((response.length != 3) || (this._getSW(response) != 0x9000)) {
                throw new Error("openLogicalChannel() failed, card response: "+ response);
            }
            new cardchannellib.CardChannel(this.response[0]);
        } catch (e) {
            this.handleError(e);
            throw new Error("openLogicalChannel() failed: " + e);
        }
	},
	
	/**
	 * Transmits a control command to the terminal device.
	 * 
	 * <p>
	 * This can be used to, for example, control terminal functions like a
	 * built-in PIN pad or biometrics.
	 * 
	 * @param controlCode
	 *            the control code of the command
	 * @param command
	 *            the command data
	 *
	 */
	transmitControlCommand: function(controlCode, command){
		//checkSecurity("transmitControl");
        this._checkState();
        this._checkExclusive();
        if (command == null) {
            throw new Error("command cannot be null");
        }
        try {
            var r = pcsc.SCardControl(this.cardId, controlCode, command);
            return r;
        } catch (e) {
            this.handleError(e);
            throw new Error("transmitControlCommand() failed. Cause: " + e);
        }
	},
	
	toString: function() {
        return "PC/SC card in " + this.terminal.getName()
            + ", protocol " + this.getProtocol() + ", state " + this.state;
    },
    
    /**
     * Disconnects the connection with this card. After this method returns,
     * calling methods on this object or in CardChannels associated with this
     * object that require interaction with the card will raise an
     * Error.
     *
     * @param reset whether to reset the card after disconnecting.
     *
     */
    disconnect: function(reset){
        if (reset) {
            //TODO: checkSecurity("reset");
        }
        if (this.state != CardState.OK) {
            return;
        }
        this._checkExclusive();
        try {
            pcsc.SCardDisconnect(this.cardId, (reset ? pcsc.defs.SCARD_LEAVE_CARD : pcsc.defs.SCARD_RESET_CARD));
        } catch (e) {
            throw new Error("disconnect() failed: " + e);
        } finally {
            this.state = CardState.DISCONNECTED;
            // exclusiveThread = null;
        }
    },
    
    handleError: function(e) {
        if (e.code == pcsc.defs.SCARD_W_REMOVED_CARD) {
            this.state = CardState.REMOVED;
        }
    },
	
	// PRIVATE FUNCTIONS
	
	/**
	 * Check state of this card connection
	 * 
	 * @return state of this card connection
	 */
	_checkState: function(){
        var s = this.state;
        if (s == CardState.DISCONNECTED) {
            throw new Error("Card has been disconnected");
        } else if (s == CardState.REMOVED) {
            throw new Error("Card has been removed");
        }
	},
	
	/**
	 * Ping card via SCardStatus
	 * 
	 * @return
	 */
	_isValid: function(){
		
		if (this.state != CardState.OK) {
            return false;
        }

		try {
			var res = pcsc.SCardStatus(this.cardId);
			//res.atr
            //res.protocol
			//res.state
			
            return true;
        } catch (e) {
            this.state = CardState.REMOVED;
            return false;
        }
	},
	
	_getSW: function (b) {
		if (b.length < 2) {
	        return -1;
	    }
	    var sw1 = b[b.length - 2] & 0xff;
	    var sw2 = b[b.length - 1] & 0xff;
	    return (sw1 << 8) | sw2;
	}, 
	
	_checkExclusive: function(){
		// FIXME
	},
	
	_equalsIgnoreCase: function(s1,s2){
		// FIXME: revisar si vamos a recibir unicodes
		return s1.toLowerCase() == s2.toLowerCase();
	}
	
};

exports.Card = Card;