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
const utillib = require("util");
const util = require("util");
const responseAPDUlib = require("responseAPDU");

const t0GetResponse = true;
const t1GetResponse = true; 
const t1StripLe = false; 

/**
 * CardChannel
 * 
 * A logical channel connection to a Smart Card. It is used to exchange APDUs
 * with a Smart Card. A CardChannel object can be obtained by calling the method
 * Card.getBasicChannel() or Card.openLogicalChannel().
 * 
 */
function CardChannel(card, channel) {
	this.card = card;
	this.channel = channel;
	this.isClosed = false;
}

CardChannel.prototype = {
		
	/**
	 * Returns the Card this channel is associated with.
	 *
	 * @return the Card this channel is associated with
	 */
	getCard: function(){
		return this.card;
	},
	
	/**
	 * Returns the channel number of this CardChannel. A channel number of
	 * 0 indicates the basic logical channel.
	 *
	 * @return the channel number of this CardChannel.
	 *
	 */
	getChannelNumber: function(){
		this._checkClosed();
		return this.channel;
	},
	
	transmit: function(cmd){
		this._checkClosed();
        this.card._checkExclusive();
        
        // Parse command from String to Array if necessary
    	var command = parseCommand(cmd);
    	
        var response = this._doTrasmit(command);
        return new responseAPDUlib.ResponseAPDU(response);
	},
	
	/**
	 * Closes this CardChannel. The logical channel is closed by issuing
	 * a <code>MANAGE CHANNEL</code> command that should use the format
	 * <code>[xx 70 80 0n]</code> where <code>n</code> is the channel number
	 * of this channel and <code>xx</code> is the <code>CLA</code>
	 * byte that encodes this logical channel and has all other bits set to 0.
	 * After this method returns, calling other
	 * methods in this class will raise an IllegalStateException.
	 *
	 * <p>Note that the basic logical channel cannot be closed using this
	 * method. It can be closed by calling {@link Card#disconnect}.
	 * 
	 */
	close: function(){
		if (this.getChannelNumber() == 0) {
            throw new Error("Cannot close basic logical channel");
        }
        if (this.isClosed) {
            return;
        }
        card._checkExclusive();
        try {
            var com = [0x00, 0x70, 0x80, 0];
            com[3] = this.getChannelNumber();
            this._setChannel(com);
            var res = pcsc.SCardTransmit(this.card.cardId, this.card.protocol, com, 0, com.length);
            if (this._isOK(res) == false) {
                throw new Error("close() failed: " + pcsc.defs.toString(res));
            }
        } catch (e) {
            this.card.handleError(e);
            throw new Error("Could not close channel: " + e);
        } finally {
            this.isClosed = true;
        }
	},
	
	toString: function() {
        return "PC/SC channel " + this.channel;
    },
	
	_checkClosed : function() {
        this.card._checkState();
        if (this.isClosed) {
            throw new Error("Logical channel has been closed");
        }
    },
    
    _doTrasmit : function(command) {
        try {
            this._checkManageChannel(command);
            this._setChannel(command);
            var n = command.length;
            var t0 = this.card.protocol == pcsc.defs.SCARD_PROTOCOL_T0;
            var t1 = this.card.protocol == pcsc.defs.SCARD_PROTOCOL_T1;
            if (t0 && (n >= 7) && (command[4] == 0)) {
                throw new Error("Extended length forms not supported for T=0");
            }
            if ((t0 || (t1 && t1StripLe)) && (n >= 7)) {
                var lc = command[4] & 0xff;
                if (lc != 0) {
                    if (n == lc + 6) {
                        n--;
                    }
                } else {
                    lc = ((command[5] & 0xff) << 8) | (command[6] & 0xff);
                    if (n == lc + 9) {
                        n -= 2;
                    }
                }
            }
            var getresponse = (t0 && t0GetResponse) || (t1 && t1GetResponse);
            var k = 0;
            var result = [];
            while (true) {
                if (++k >= 32) {
                    throw new Error("Could not obtain response");
                }	
                var response = pcsc.SCardTransmit(this.card.cardId, this.card.protocol, command, 0, n);
                
                var rn = response.length;
                if (getresponse && (rn >= 2)) {
                    // see ISO 7816/2005, 5.1.3
                	
                    if ((rn == 2) && (response[0] == 0x6c)) {
                        // Resend command using SW2 as short Le field
                        command[n - 1] = response[1];
                        continue;
                    }
                    if (response[rn - 2] == 0x61) {
                        // Issue a GET RESPONSE command with the same CLA
                        // using SW2 as short Le field
                        if (rn > 2) {
                            result = this._concat(result, response, rn - 2);
                        }
                        
                        // Gonzalo:
                        // http://ridrix.wordpress.com/2009/07/12/design-error-in-javax-smartcardio/
                        // http://www.gorferay.com/isoiec-7816-4-identification-cards/
                        command[0] = command[0] & 0xF3; // Disable secure messaging indicator
                        
                        command[1] = 0xC0;
                        command[2] = 0;
                        command[3] = 0;
                        command[4] = response[rn - 1];
                        n = 5;
                        continue;
                    }

                }
                
                result = this._concat(result, response, rn);
                break;
            }
            return result;
        } catch (e) {
            this.card.handleError(e);
            throw new Error("_doTrasmit error: "+e);
        }
    },
    
    _checkManageChannel: function(b) {
        if (b.length < 4) {
            throw new Error("Command APDU must be at least 4 bytes long");
        }
        if ((b[0] >= 0) && (b[1] == 0x70)) {
            throw new Error("Manage channel command not allowed, use openLogicalChannel()");
        }
    },
    
    _setChannel: function(com) {
        var cla = com[0];
        if (cla < 0) {
            // proprietary class format, cannot set or check logical channel
            // for now, just return
            return;
        }
        // classes 001x xxxx is reserved for future use in ISO, ignore
        if ((cla & 0xe0) == 0x20) {
            return;
        }
        // see ISO 7816/2005, table 2 and 3
        if (this.channel <= 3) {
            // mask of bits 7, 1, 0 (channel number)
            // 0xbc == 1011 1100
            com[0] &= 0xbc;
            com[0] |= this.channel;
        } else if (this.channel <= 19) {
            // mask of bits 7, 3, 2, 1, 0 (channel number)
            // 0xbc == 1011 0000
            com[0] &= 0xb0;
            com[0] |= 0x40;
            com[0] |= (this.channel - 4);
        } else {
            throw new Error("Unsupported channel number: " + channel);
        }
    },
    
    _concat: function(b1, b2, n2) {
        var n1 = b1.length;
        if ((n1 == 0) && (n2 == b2.length)) {
            return b2;
        }
        var res = new Array(n1 + n2);
        util.arraycopy(b1, 0, res, 0, n1);
        util.arraycopy(b2, 0, res, n1, n2);
        return res;
    },
    
    _isOK: function(res) {
        return (res.length == 2) && (this._getSW(res) == 0x9000);
    },
    
    _getSW: function(res) {
        if (res.length < 2) {
            throw new Error("Invalid response length: " + res.length);
        }
        var sw1 = res[res.length - 2] & 0xff;
        var sw2 = res[res.length - 1] & 0xff;
        return (sw1 << 8) | sw2;
    }
	
};

function parseCommand(cmd) {
	if (typeof cmd === "string") {
		return util.HexStringToArray(cmd);
	} else {
		return cmd;
	}
}

exports.CardChannel = CardChannel;