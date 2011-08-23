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
const utillib = require("util");
const util = require("util");

/**
 * A Smart Card's answer-to-reset bytes. A Card's ATR object can be obtained by
 * calling {@linkplain Card#getATR}. This class does not attempt to verify that
 * the ATR encodes a semantically valid structure.
 * 
 */
function ATR(atr) {
	this.atr = util.cloneArray(atr);
	this._parse();
}

ATR.prototype = {

	_parse : function() {
		if (this.atr.length < 2) {
			return;
		}
		if ((this.atr[0] != 0x3b) && (this.atr[0] != 0x3f)) {
			return;
		}
		var t0 = (this.atr[1] & 0xf0) >> 4;
		var n = this.atr[1] & 0xf;
		var i = 2;
		while ((t0 != 0) && (i < this.atr.length)) {
			if ((t0 & 1) != 0) {
				i++;
			}
			if ((t0 & 2) != 0) {
				i++;
			}
			if ((t0 & 4) != 0) {
				i++;
			}
			if ((t0 & 8) != 0) {
				if (i >= this.atr.length) {
					return;
				}
				t0 = (this.atr[i++] & 0xf0) >> 4;
			} else {
				t0 = 0;
			}
		}
		var k = i + n;
		if ((k == this.atr.length) || (k == this.atr.length - 1)) {
			this.startHistorical = i;
			this.nHistorical = n;
		}
	},
	/**
	 * Returns a copy of the bytes in this ATR.
	 * 
	 * @return a copy of the bytes in this ATR.
	 */
	getBytes : function() {
		return util.cloneArray(this.atr);
	},

	/**
	 * Returns a copy of the historical bytes in this ATR. If this ATR does not
	 * contain historical bytes, an array of length zero is returned.
	 * 
	 * @return a copy of the historical bytes in this ATR.
	 */
	getHistoricalBytes : function() {
		var b = new Array[this.nHistorical];
        util.arraycopy(atr, this.startHistorical, b, 0, this.nHistorical);
        return b;
	},
	
	/**
     * Returns a string representation of this ATR.
     *
     * @return a String representation of this ATR.
     */
    toString: function() {
        return "ATR: " + this.atr.length + " bytes";
    }
    
};


exports.ATR = ATR;