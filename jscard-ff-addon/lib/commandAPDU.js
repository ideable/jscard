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
/**

 * FIXME: NOT IMPLEMENTED YET
 * 
 *A command APDU following the structure defined in ISO/IEC 7816-4.
 * It consists of a four byte header and a conditional body of variable length.
 * This class does not attempt to verify that the APDU encodes a semantically
 * valid command.
 */
function CommandAPDU(apdu) {
	this.apdu = apdu.clone(); // byte[]
	// TODO: demas propiedades
	this._parse();
}

CommandAPDU.prototype = {

	/**
     * Returns the value of the class byte CLA.
     *
     * @return the value of the class byte CLA.
     */
	getCLA: function() {
        return this.apdu[0] & 0xff;
    },
    /**
     * Returns the value of the instruction byte INS.
     *
     * @return the value of the instruction byte INS.
     */
    getINS: function() {
        return this.apdu[1] & 0xff;
    },
    /**
     * Returns the value of the parameter byte P1.
     *
     * @return the value of the parameter byte P1.
     */
    getP1: function() {
        return this.apdu[2] & 0xff;
    },
    /**
     * Returns the value of the parameter byte P2.
     *
     * @return the value of the parameter byte P2.
     */
    getP2: function() {
        return this.apdu[3] & 0xff;
    },
    /**
     * Returns the number of data bytes in the command body (Nc) or 0 if this
     * APDU has no body. This call is equivalent to
     * <code>getData().length</code>.
     *
     * @return the number of data bytes in the command body or 0 if this APDU
     * has no body.
     */
    getNc: function() {
        return this.nc;
    },
    /**
     * Returns a copy of the data bytes in the command body. If this APDU as
     * no body, this method returns a byte array with length zero.
     *
     * @return a copy of the data bytes in the command body or the empty
     *    byte array if this APDU has no body.
     */
    getData: function() {
        var data = new Array[this.nc];
        //System.arraycopy(apdu, dataOffset, data, 0, nc);
        return data;
    },
    /**
     * Returns the maximum number of expected data bytes in a response
     * APDU (Ne).
     *
     * @return the maximum number of expected data bytes in a response APDU.
     */
    getNe: function () {
        return this.ne;
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
     * Returns a string representation of this command APDU.
     *
     * @return a String representation of this command APDU.
     */
    toString: function() {
        return "CommmandAPDU: " + this.apdu.length + " bytes, nc=" + this.nc + ", ne=" + this.ne;
    }
    
    //privates
};

exports.CommandAPDU = CommandAPDU;