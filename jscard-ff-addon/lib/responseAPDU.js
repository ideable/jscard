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
const apiUtils = require("api-utils");
const util = require("util");

/**
 A response APDU as defined in ISO/IEC 7816-4. It consists of a conditional
 * body and a two byte trailer.
 * This class does not attempt to verify that the APDU encodes a semantically
 * valid response.
 */
function ResponseAPDU(apdu) {
	var cmd;
	if (typeof apdu === "string") {
		cmd = util.HexStringToArray(apdu);
	} else {
		cmd = apdu;
	}
	
	this.apdu = util.cloneArray(cmd);
	this._check(cmd);
}

ResponseAPDU.prototype = {

	/**
     * Returns the number of data bytes in the response body (Nr) or 0 if this
     * APDU has no body. This call is equivalent to
     * <code>getData().length</code>.
     *
     * @return the number of data bytes in the response body or 0 if this APDU
     * has no body.
     */
    getNr: function() {
        return this.apdu.length - 2;
    },
    /**
     * Returns a copy of the data bytes in the response body. If this APDU as
     * no body, this method returns a byte array with a length of zero.
     *
     * @return a copy of the data bytes in the response body or the empty
     *    byte array if this APDU has no body.
     */
    getData: function() {
        return util.sliceArray(this.apdu,0,this.apdu.length-2);
    },
    /**
     * Returns the value of the status byte SW1 as a value between 0 and 255.
     *
     * @return the value of the status byte SW1 as a value between 0 and 255.
     */
    getSW1: function() {
        return this.apdu[this.apdu.length - 2] & 0xff;
    },
    /**
     * Returns the value of the status byte SW2 as a value between 0 and 255.
     *
     * @return the value of the status byte SW2 as a value between 0 and 255.
     */
    getSW2: function() {
        return this.apdu[this.apdu.length - 1] & 0xff;
    },
    /**
     * Returns the value of the status bytes SW1 and SW2 as a single
     * status word SW.
     * It is defined as
     * <code>(getSW1() << 8) | getSW2()</code>.
     *
     * @return the value of the status word SW.
     */
    getSW: function() {
        return (this.getSW1() << 8) | this.getSW2();
    },
    /**
     * Returns a copy of the bytes in this APDU.
     *
     * @return a copy of the bytes in this APDU.
     */
    getBytes: function() {
        return this.apdu.clone();
    },
    /**
     * Returns a string representation of this response APDU.
     *
     * @return a String representation of this response APDU.
     */
    toString:function () {
        return "ResponseAPDU: " + this.apdu.length + " bytes, SW="
            + this.getSW().toString(16);
    },
    
    
    //privates
    
    _check: function(apdu) {
        if (apdu.length < 2) {
            throw new Error("apdu must be at least 2 bytes long");
        }
    }
};

exports.ResponseAPDU = apiUtils.publicConstructor(ResponseAPDU);