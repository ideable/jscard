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
 * Utility functions
 * 
 * Based on:
 * 	- http://processingjs.org/content/download/processing-js-1.2.3/processing-1.2.3.js
 * 
 */

exports.arrayCopy = function SC_Util_arrayCopy() { // src, srcPos, dest, destPos, length) {
	var src, srcPos = 0, dest, destPos = 0, length;
	var undef;

	if (arguments.length === 2) {
		// recall itself and copy src to dest from start index 0 to 0 of
		// src.length
		src = arguments[0];
		dest = arguments[1];
		length = src.length;
	} else if (arguments.length === 3) {
		// recall itself and copy src to dest from start index 0 to 0 of
		// length
		src = arguments[0];
		dest = arguments[1];
		length = arguments[2];
	} else if (arguments.length === 5) {
		src = arguments[0];
		srcPos = arguments[1];
		dest = arguments[2];
		destPos = arguments[3];
		length = arguments[4];
	}

	// copy src to dest from index srcPos to index destPos of length
	// recursivly on objects
	for ( var i = srcPos, j = destPos; i < length + srcPos; i++, j++) {
		if (dest[j] !== undef) {
			dest[j] = src[i];
		} else {
			throw "array index out of bounds exception";
		}
	}
};

exports.cloneArray = function SC_Util_cloneArray(arrayToClone) {
	var newArr = [];
	for (i in arrayToClone) {
		newArr[i] = arrayToClone[i];
	}
	return newArr;
};

exports.sliceArray = function SC_Util_sliceArray(array, beginIndex, endIndex) {
	//TODO Check indexes
	var newArray = new Array(endIndex - beginIndex);
	var j = 0;
	for (var i = beginIndex; i < endIndex; i++) {
		newArray[j] = array[i];
		j++;
	}    	
	return newArray;
	
};

exports.ArrayToHexString = function SC_Util_ArrayToHexString(array) {
	var result = [];
	for ( var i = 0; i < array.length; i++) {
		var ubyte = array[i];
		var byteHex = ubyte.toString(16).toUpperCase();
		if (byteHex.length == 1) {
			byteHex = '0' + byteHex; 
		}
		result[i] = byteHex;
	}
	
	return result.join(':');
};

exports.HexStringToArray = function SC_Util_HexStringToArray(hexString) {

	var result = [];
	
	if (hexString % 2 == 1) {
		hexString = '0' + hexString;
	}
	
	var index = 0;
	var regex = /([0-9a-fA-F]{2})(?::?)/g;
    while ( (a = regex.exec(hexString)) != null ) {
    	result[index] = parseInt(a[1], 16);
    	index++;
    }
	return result;
};


