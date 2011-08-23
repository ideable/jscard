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

const MAX_STACK_BUFFER_SIZE = 8192;
const READERNAME_BUFFER_SIZE = 128;
const ATR_BUFFER_SIZE = 128;
const RECEIVE_BUFFER_SIZE = MAX_STACK_BUFFER_SIZE;

let {Cc, Ci, Cr, components} = require("chrome");

let util = require("util");

components.utils.import("resource://gre/modules/ctypes.jsm");

// FIXME
let lib = {
		
	debug: true,
	
	pcsc: null,
	
	pcsc_t: null,
	
	pcsclib: null,
	
	log: function (message) {
		if (!this.debug)
		  return;
		console.debug("PCSC: " + message);
	},

	shutdown : function() {
		try {
			this.log("Closing pcsclib");
			this.pcsclib.close();
		} catch (e) {
			console.error("pcsc: shutdown error ["+e+"]");
		}
	},

	init: function() {

		this.log("Initializing PCSC types and function declarations...");
		       
        let path = ctypes.libraryName("WinSCard");

        var pcsclib = ctypes.open(path);


        this.pcsc = {};
        this.pcsc_t = {};
		
		this.pcsclib = pcsclib;
		
		this.pcsc_t.BYTE = ctypes.unsigned_char;
		this.pcsc_t.UCHAR = ctypes.unsigned_char;
		this.pcsc_t.PUCHAR = new ctypes.PointerType(ctypes.unsigned_char);
		this.pcsc_t.USHORT = ctypes.unsigned_short;
		this.pcsc_t.ULONG = ctypes.unsigned_long;
		this.pcsc_t.LPVOID = ctypes.voidptr_t;
		this.pcsc_t.LPCVOID = ctypes.voidptr_t;
		this.pcsc_t.DWORD = ctypes.unsigned_long;
		this.pcsc_t.PDWORD = new ctypes.PointerType(ctypes.unsigned_long);
		
		this.pcsc_t.LONG = ctypes.long;
		this.pcsc_t.LPCSTR = ctypes.char.ptr;
		
		this.pcsc_t.LPCBYTE = new ctypes.PointerType(this.pcsc_t.BYTE);
		this.pcsc_t.LPBYTE = new ctypes.PointerType(this.pcsc_t.BYTE);
		this.pcsc_t.LPDWORD = this.pcsc_t.DWORD.ptr;
		this.pcsc_t.LPSTR = ctypes.char.ptr;
		this.pcsc_t.LPTSTR = this.pcsc_t.LPSTR;
		this.pcsc_t.LPCTSTR = this.pcsc_t.LPCSTR;
		this.pcsc_t.BOOL = ctypes.short;
		this.pcsc_t.WORD = ctypes.unsigned_short;
		this.pcsc_t.PULONG = new ctypes.PointerType(ctypes.unsigned_long);
		
		this.pcsc_t.SCARDCONTEXT = this.pcsc_t.LONG;
		this.pcsc_t.PSCARDCONTEXT = this.pcsc_t.SCARDCONTEXT.ptr; 	
		this.pcsc_t.LPSCARDCONTEXT = this.pcsc_t.SCARDCONTEXT.ptr;
		this.pcsc_t.SCARDHANDLE = this.pcsc_t.LONG;
		this.pcsc_t.PSCARDHANDLE = this.pcsc_t.SCARDHANDLE.ptr;
		this.pcsc_t.LPSCARDHANDLE = this.pcsc_t.SCARDHANDLE.ptr;
		
		this.pcsc_t.MAX_ATR_SIZE = 33;
		this.pcsc_t.SCARD_READERSTATE_A = new ctypes.StructType("SCARD_READERSTATE_A",
                [ { "szReader": ctypes.char.ptr },
                  { "pvUserData": ctypes.voidptr_t },
                  { "dwCurrentState": ctypes.unsigned_long },
                  { "dwEventState": ctypes.unsigned_long },
                  { "cbAtr": ctypes.unsigned_long },
                  { "rgbAtr":  new ctypes.ArrayType(ctypes.unsigned_char, this.pcsc_t.MAX_ATR_SIZE) } ]);
		
		this.pcsc_t.SCARD_READERSTATE = this.pcsc_t.SCARD_READERSTATE_A;
		
		this.pcsc_t.LPSCARD_READERSTATE = this.pcsc_t.SCARD_READERSTATE.ptr;
		
		this.pcsc_t.SCARD_IO_REQUEST = new ctypes.StructType("SCARD_IO_REQUEST", [ 
                  { "dwProtocol": ctypes.unsigned_long },
                  { "cbPciLength": ctypes.unsigned_long },
        ]);
		
		this.pcsc_t.PSCARD_IO_REQUEST = this.pcsc_t.SCARD_IO_REQUEST.ptr;
		this.pcsc_t.LPSCARD_IO_REQUEST = this.pcsc_t.SCARD_IO_REQUEST.ptr;
		this.pcsc_t.LPCSCARD_IO_REQUEST = this.pcsc_t.SCARD_IO_REQUEST.ptr;
		

		// DEFINITIONS
		this.pcsc_t.SCARD_S_SUCCESS             = 0x00000000;
		this.pcsc_t.SCARD_E_CANCELLED           = 0x80100002;
		this.pcsc_t.SCARD_E_CANT_DISPOSE        = 0x8010000E;
		this.pcsc_t.SCARD_E_INSUFFICIENT_BUFFER = 0x80100008;
		this.pcsc_t.SCARD_E_INVALID_ATR         = 0x80100015;
		this.pcsc_t.SCARD_E_INVALID_HANDLE      = 0x80100003;
		this.pcsc_t.SCARD_E_INVALID_PARAMETER   = 0x80100004;
		this.pcsc_t.SCARD_E_INVALID_TARGET      = 0x80100005;
		this.pcsc_t.SCARD_E_INVALID_VALUE       = 0x80100011;
		this.pcsc_t.SCARD_E_NO_MEMORY           = 0x80100006;
		this.pcsc_t.SCARD_F_COMM_ERROR          = 0x80100013;
		this.pcsc_t.SCARD_F_INTERNAL_ERROR      = 0x80100001;
		this.pcsc_t.SCARD_F_UNKNOWN_ERROR       = 0x80100014;
		this.pcsc_t.SCARD_F_WAITED_TOO_LONG     = 0x80100007;
		this.pcsc_t.SCARD_E_UNKNOWN_READER      = 0x80100009;
		this.pcsc_t.SCARD_E_TIMEOUT             = 0x8010000A;
		this.pcsc_t.SCARD_E_SHARING_VIOLATION   = 0x8010000B;
		this.pcsc_t.SCARD_E_NO_SMARTCARD        = 0x8010000C;
		this.pcsc_t.SCARD_E_UNKNOWN_CARD        = 0x8010000D;
		this.pcsc_t.SCARD_E_PROTO_MISMATCH      = 0x8010000F;
		this.pcsc_t.SCARD_E_NOT_READY           = 0x80100010;
		this.pcsc_t.SCARD_E_SYSTEM_CANCELLED    = 0x80100012;
		this.pcsc_t.SCARD_E_NOT_TRANSACTED      = 0x80100016;
		this.pcsc_t.SCARD_E_READER_UNAVAILABLE  = 0x80100017;

		this.pcsc_t.SCARD_W_UNSUPPORTED_CARD    = 0x80100065;
		this.pcsc_t.SCARD_W_UNRESPONSIVE_CARD   = 0x80100066;
		this.pcsc_t.SCARD_W_UNPOWERED_CARD      = 0x80100067;
		this.pcsc_t.SCARD_W_RESET_CARD          = 0x80100068;
		this.pcsc_t.SCARD_W_REMOVED_CARD        = 0x80100069;
		this.pcsc_t.SCARD_W_INSERTED_CARD       = 0x8010006A;

		this.pcsc_t.SCARD_E_UNSUPPORTED_FEATURE = 0x8010001F;
		this.pcsc_t.SCARD_E_PCI_TOO_SMALL       = 0x80100019;
		this.pcsc_t.SCARD_E_READER_UNSUPPORTED  = 0x8010001A;
		this.pcsc_t.SCARD_E_DUPLICATE_READER    = 0x8010001B;
		this.pcsc_t.SCARD_E_CARD_UNSUPPORTED    = 0x8010001C;
		this.pcsc_t.SCARD_E_NO_SERVICE          = 0x8010001D;
		this.pcsc_t.SCARD_E_SERVICE_STOPPED     = 0x8010001E;

		
		this.pcsc_t.SCARD_E_NO_READERS_AVAILABLE = 0x8010002E;
		
		// std. Windows invalid handle return code, used instead of SCARD code
		this.pcsc_t.WINDOWS_ERROR_INVALID_HANDLE = 6;
		this.pcsc_t.WINDOWS_ERROR_INVALID_PARAMETER = 87;
		
		this.pcsc_t.SCARD_SCOPE_USER      =  0x0000;
		this.pcsc_t.SCARD_SCOPE_TERMINAL  =  0x0001;
		this.pcsc_t.SCARD_SCOPE_SYSTEM    =  0x0002;
		this.pcsc_t.SCARD_SCOPE_GLOBAL    =  0x0003;

		this.pcsc_t.SCARD_SHARE_EXCLUSIVE =  0x0001;
		this.pcsc_t.SCARD_SHARE_SHARED    =  0x0002;
		this.pcsc_t.SCARD_SHARE_DIRECT    =  0x0003;

		this.pcsc_t.SCARD_LEAVE_CARD      =  0x0000;
		this.pcsc_t.SCARD_RESET_CARD      =  0x0001;
		this.pcsc_t.SCARD_UNPOWER_CARD    =  0x0002;
		this.pcsc_t.SCARD_EJECT_CARD      =  0x0003;

		this.pcsc_t.SCARD_STATE_UNAWARE     = 0x0000;
		this.pcsc_t.SCARD_STATE_IGNORE      = 0x0001;
		this.pcsc_t.SCARD_STATE_CHANGED     = 0x0002;
		this.pcsc_t.SCARD_STATE_UNKNOWN     = 0x0004;
		this.pcsc_t.SCARD_STATE_UNAVAILABLE = 0x0008;
		this.pcsc_t.SCARD_STATE_EMPTY       = 0x0010;
		this.pcsc_t.SCARD_STATE_PRESENT     = 0x0020;
		this.pcsc_t.SCARD_STATE_ATRMATCH    = 0x0040;
		this.pcsc_t.SCARD_STATE_EXCLUSIVE   = 0x0080;
		this.pcsc_t.SCARD_STATE_INUSE       = 0x0100;
		this.pcsc_t.SCARD_STATE_MUTE        = 0x0200;
		this.pcsc_t.SCARD_STATE_UNPOWERED   = 0x0400;

		this.pcsc_t.TIMEOUT_INFINITE = 0xffffffff;

		// PROTOCOL TYPES
		this.pcsc_t.SCARD_PROTOCOL_T0 = 0x0001;  
		this.pcsc_t.SCARD_PROTOCOL_T1 = 0x0002; 

		
		// ############## PCSC FUNCTIONS DECLARE ############## //
		
		// PCSC_API LONG SCardEstablishContext(DWORD dwScope,
		// /*@null@*/ LPCVOID pvReserved1, /*@null@*/ LPCVOID pvReserved2,
		// /*@out@*/ LPSCARDCONTEXT phContext);
		this.pcsc.SCardEstablishContext = pcsclib.declare("SCardEstablishContext", ctypes.default_abi,  
												  this.pcsc_t.LONG, // return
												  this.pcsc_t.DWORD,
												  this.pcsc_t.LPCVOID,
												  this.pcsc_t.LPCVOID,
												  this.pcsc_t.LPSCARDCONTEXT
												  );
												  
		// PCSC_API LONG SCardReleaseContext(SCARDCONTEXT hContext);
		this.pcsc.SCardReleaseContext = pcsclib.declare("SCardReleaseContext", ctypes.default_abi, this.pcsc_t.LONG, // return
												  this.pcsc_t.SCARDCONTEXT										  
												  );
		
		// PCSC_API LONG SCardIsValidContext(SCARDCONTEXT hContext);
		this.pcsc.SCardIsValidContext = pcsclib.declare("SCardIsValidContext", ctypes.default_abi,  
												  this.pcsc_t.LONG, // return
												  this.pcsc_t.SCARDCONTEXT										  
												  );
		
		// PCSC_API LONG SCardDisconnect(SCARDHANDLE hCard, DWORD
		// dwDisposition);
		this.pcsc.SCardDisconnect = pcsclib.declare("SCardDisconnect", ctypes.default_abi, this.pcsc_t.LONG, // return
				  this.pcsc_t.SCARDHANDLE,
				  this.pcsc_t.DWORD				  
				  );
												  
		// PCSC_API LONG SCardConnect(SCARDCONTEXT hContext,
		// LPCSTR szReader,
		// DWORD dwShareMode,
		// DWORD dwPreferredProtocols,
		// /*@out@*/ LPSCARDHANDLE phCard, /*@out@*/ LPDWORD pdwActiveProtocol);
		this.pcsc.SCardConnect = pcsclib.declare("SCardConnectA", ctypes.default_abi, this.pcsc_t.LONG, // return
				  this.pcsc_t.SCARDCONTEXT,										  
				  this.pcsc_t.LPCSTR,										  
				  this.pcsc_t.DWORD,										  
				  this.pcsc_t.DWORD,										  
				  this.pcsc_t.LPSCARDHANDLE,										  
				  this.pcsc_t.LPDWORD
				  );

		// PCSC_API LONG SCardBeginTransaction(SCARDHANDLE hCard);
		this.pcsc.SCardBeginTransaction = pcsclib.declare("SCardBeginTransaction", ctypes.default_abi, this.pcsc_t.LONG, // return
				  this.pcsc_t.SCARDHANDLE		  
				  );

		// PCSC_API LONG SCardEndTransaction(SCARDHANDLE hCard, DWORD
		// dwDisposition);
		this.pcsc.SCardEndTransaction = pcsclib.declare("SCardEndTransaction", ctypes.default_abi, this.pcsc_t.LONG, // return
				  this.pcsc_t.SCARDHANDLE,
				  this.pcsc_t.DWORD				
				  );

		// PCSC_API LONG SCardStatus(SCARDHANDLE hCard,
		// /*@null@*/ /*@out@*/ LPSTR mszReaderName,
		// /*@null@*/ /*@out@*/ LPDWORD pcchReaderLen,
		// /*@null@*/ /*@out@*/ LPDWORD pdwState,
		// /*@null@*/ /*@out@*/ LPDWORD pdwProtocol,
		// /*@null@*/ /*@out@*/ LPBYTE pbAtr,
		// /*@null@*/ /*@out@*/ LPDWORD pcbAtrLen);
		this.pcsc.SCardStatus = pcsclib.declare("SCardStatusA", ctypes.default_abi, this.pcsc_t.LONG, // return
				  this.pcsc_t.SCARDHANDLE,										  
				  this.pcsc_t.LPSTR,										  
				  this.pcsc_t.LPDWORD,										  
				  this.pcsc_t.LPDWORD,										  
				  this.pcsc_t.LPDWORD,										  
				  this.pcsc_t.LPBYTE,
				  this.pcsc_t.LPDWORD										  
				  );

		// PCSC_API LONG SCardGetStatusChange(SCARDCONTEXT hContext,
		// DWORD dwTimeout,
		// LPSCARD_READERSTATE rgReaderStates, DWORD cReaders);
		this.pcsc.SCardGetStatusChange = pcsclib.declare("SCardGetStatusChangeA", ctypes.default_abi, this.pcsc_t.LONG, // return
				  this.pcsc_t.SCARDCONTEXT,										  
				  this.pcsc_t.DWORD,										  
				  this.pcsc_t.LPSCARD_READERSTATE,										  
				  this.pcsc_t.DWORD										  
				  );

		// PCSC_API LONG SCardControl(SCARDHANDLE hCard,
		// DWORD dwControlCode,
		// LPCVOID pbSendBuffer,
		// DWORD cbSendLength,
		// /*@out@*/ LPVOID pbRecvBuffer,
		// DWORD cbRecvLength,
		// LPDWORD lpBytesReturned);
		this.pcsc.SCardControl = pcsclib.declare("SCardControl", ctypes.default_abi, this.pcsc_t.LONG, // return
				  this.pcsc_t.SCARDHANDLE,										  
				  this.pcsc_t.DWORD,										  
				  this.pcsc_t.LPCVOID,										  
				  this.pcsc_t.DWORD,										  
				  this.pcsc_t.LPVOID,										  
				  this.pcsc_t.DWORD,										  
				  this.pcsc_t.LPDWORD									  
				  );
		

		// PCSC_API LONG SCardTransmit(SCARDHANDLE hCard,
		// const SCARD_IO_REQUEST *pioSendPci,
		// LPCBYTE pbSendBuffer, DWORD cbSendLength,
		// /*@out@*/ SCARD_IO_REQUEST *pioRecvPci,
		// /*@out@*/ LPBYTE pbRecvBuffer, LPDWORD pcbRecvLength);
		this.pcsc.SCardTransmit = pcsclib.declare("SCardTransmit", ctypes.default_abi, this.pcsc_t.LONG, // return
				this.pcsc_t.SCARDHANDLE,										  
				this.pcsc_t.SCARD_IO_REQUEST.ptr,										  
				this.pcsc_t.LPCBYTE,										  
				this.pcsc_t.DWORD,										  
				this.pcsc_t.SCARD_IO_REQUEST.ptr,										  
				this.pcsc_t.LPBYTE,
				this.pcsc_t.LPDWORD										  
		);

		// PCSC_API LONG SCardListReaders(SCARDCONTEXT hContext,
		// /*@null@*/ /*@out@*/ LPCSTR mszGroups,
		// /*@null@*/ /*@out@*/ LPSTR mszReaders,
		// /*@out@*/ LPDWORD pcchReaders);
		
		// En Windows hay dos versiones de la mismas funcion una terminada en W
		// (UNICODE) y otra en A (ANSI)
		this.pcsc.SCardListReaders = pcsclib.declare("SCardListReadersA", ctypes.default_abi,  
										  this.pcsc_t.LONG, // return
										  this.pcsc_t.SCARDCONTEXT,
										  this.pcsc_t.LPCSTR,
										  this.pcsc_t.LPSTR,
										  this.pcsc_t.LPDWORD
										  );
		
		
		// PCSC_API LONG SCardFreeMemory(SCARDCONTEXT hContext, LPCVOID pvMem);

		// PCSC_API LONG SCardCancel(SCARDCONTEXT hContext);

		// PCSC_API LONG SCardGetAttrib(SCARDHANDLE hCard, DWORD dwAttrId,
		// /*@out@*/ LPBYTE pbAttr, LPDWORD pcbAttrLen);

		// PCSC_API LONG SCardSetAttrib(SCARDHANDLE hCard, DWORD dwAttrId,
		// LPCBYTE pbAttr, DWORD cbAttrLen);

  	}
	
};

lib.init();

exports.SCardEstablishContext = function PCSC_SCardEstablishContext(scope) {
	var contextId = lib.pcsc_t.SCARDCONTEXT();
	
	if ( !scope ) {
		scope = lib.pcsc_t.SCARD_SCOPE_USER;
	}
	
	var status = lib.pcsc.SCardEstablishContext(scope, null, null, contextId.address());
	status = toUnsignedNumber(status);
	
	if (status == lib.pcsc_t.SCARD_S_SUCCESS) {
		lib.log("SCardEstablishContext: Context established");
		return contextId.value;
	} else {
		console.error("SCardEstablishContext: Status code is "+status);
		throw new PCSCException(status, toErrorString(status));
	}
           
};
    
exports.SCardReleaseContext = function PCSC_SCardReleaseContext(contextId) {
	var status = lib.pcsc.SCardReleaseContext(contextId);
	status = toUnsignedNumber(status);
	if (status != lib.pcsc_t.SCARD_S_SUCCESS) {
		throw new PCSCException(status, toErrorString(status));
	} else {
		lib.log("SCardReleaseContext: Context released");
	}
};
    
exports.SCardIsValidContext = function PCSC_SCardIsValidContext(contextId) {
	var status = lib.pcsc.SCardIsValidContext(contextId);
	status = toUnsignedNumber(status);
	if (status == lib.pcsc_t.SCARD_S_SUCCESS) {
		lib.log("SCardIsValidContext: Context valid!");
		return true;
	} else {
		lib.log("SCardIsValidContext: Context invalid! [" + toErrorString(status)+"]");
		return false;
	}
};

/**
 * 
 * The SCardConnect function establishes a connection (using a specific
 * resource manager context) between the calling application and a smart
 * card contained by a specific reader. If no card exists in the specified
 * reader, an error is returned.
 * 
 */
exports.SCardConnect = function PCSC_SCardConnect(contextId, readerName, sharingMode, connectProtocol) {
    	   	
	var rdrParam = ctypes.char.array()(readerName);
	
	var phCard = new lib.pcsc_t.SCARDHANDLE();
	
	var connProtParam = new lib.pcsc_t.DWORD(connectProtocol);
	
	var pdwActiveProtocol  = new lib.pcsc_t.DWORD();
	
	var status = lib.pcsc.SCardConnect(contextId, rdrParam, sharingMode, connProtParam, phCard.address(), pdwActiveProtocol.address() );
	
	status = toUnsignedNumber(status);
	
	if (status == lib.pcsc_t.SCARD_S_SUCCESS) {
		lib.log("SCardConnect: Connection established! -> "+toHexString(phCard.value));
		return phCard.value;
	} else {
		throw new PCSCException(status, toErrorString(status));
	}
};
    
/**
 * SCardDisconnect The SCardDisconnect function terminates a connection
 * previously opened between the calling application and a smart card in the
 * target
 */
exports.SCardDisconnect = function PCSC_SCardDisconnect(cardId, disposition) {
    	
	var dwDisposition = lib.pcsc_t.DWORD(disposition);
	
	var status = lib.pcsc.SCardDisconnect(cardId, dwDisposition);
	
	status = toUnsignedNumber(status);
	
	if (status != lib.pcsc_t.SCARD_S_SUCCESS) {
		throw new PCSCException(status, toErrorString(status));
	} else {
		console.debug("SCardDisconnect: Card disconnected!");
	}
};
    
/**
 * SCardBeginTransaction
 * 
 * The SCardBeginTransaction function starts a transaction.
 * 
 * The function waits for the completion of all other transactions before it
 * begins. After the transaction starts, all other applications are blocked
 * from accessing the smart card while the transaction is in progress.
 */
exports.SCardBeginTransaction = function PCSC_SCardBeginTransaction(cardId) {
    	
	var status = lib.pcsc.SCardBeginTransaction(cardId);
	
	status = toUnsignedNumber(status);
	
	if (status != lib.pcsc_t.SCARD_S_SUCCESS) {
		throw new PCSCException(status, toErrorString(status));
	} else {
		console.debug("SCardBeginTransaction: Transaction started!");
	}
	
};

/**
 * SCardEndTransaction
 * 
 * The SCardEndTransaction function completes a previously declared
 * transaction, allowing other applications to resume interactions with the
 * card.
 */
exports.SCardEndTransaction = function PCSC_SCardEndTransaction(cardId, disposition) {
    	
	var dwDisposition = lib.pcsc_t.DWORD(disposition);
	
	var status = lib.pcsc.SCardEndTransaction(cardId, dwDisposition);
	status = toUnsignedNumber(status);
	
	if (status != lib.pcsc_t.SCARD_S_SUCCESS) {
		throw new PCSCException(status, toErrorString(status));
	} else {
		console.debug("SCardEndTransaction: Transaction finished!");
	}
	
};
    
/**
 * SCardStatus
 * 
 * The SCardStatus function provides the current status of a smart card in a
 * reader. You can call it any time after a successful call to SCardConnect
 * and before a successful call to SCardDisconnect. It does not affect the
 * state of the reader or reader driver.
 */
exports.SCardStatus = function PCSC_SCardStatus(cardId) {
    	
	var mszReaderName = ctypes.char.array(READERNAME_BUFFER_SIZE)();
	var pcchReaderLen = lib.pcsc_t.DWORD(READERNAME_BUFFER_SIZE);
	var pdwState = lib.pcsc_t.DWORD();
	var pdwProtocol = lib.pcsc_t.DWORD();
	var pbAtr = lib.pcsc_t.BYTE.array(ATR_BUFFER_SIZE)();
	var pcbAtrLen = lib.pcsc_t.DWORD(ATR_BUFFER_SIZE);
	
	var status = lib.pcsc.SCardStatus(cardId, mszReaderName.addressOfElement(0), pcchReaderLen.address(), pdwState.address(), pdwProtocol.address(), pbAtr.addressOfElement(0), pcbAtrLen.address());
	
	status = toUnsignedNumber(status);
	
	if (status == lib.pcsc_t.SCARD_S_SUCCESS) {
		// var reader = util.sliceArray(mszReaderName, 0, pcchReaderLen.value);
		
		var atr = util.sliceArray(pbAtr, 0, pcbAtrLen.value);
		// lib.log("SCardStatus: atr: "+atr);
		
		// TODO Documentar y revisar si se devuelve el reader también
		let result = { 
				atr: atr, 
				protocol: pdwProtocol.value, 
				state: pdwState.value
		};
		
//		lib.log("SCardStatus: atr = "+result.atr);
//		lib.log("SCardStatus: protocol = "+ toHexString(result.protocol));
//		lib.log("SCardStatus: state = "+ toHexString(result.state));
		return result;
	} else {
		throw new PCSCException(status, toErrorString(status));
	}
};
	
/**
 * See: http://msdn.microsoft.com/en-us/library/aa379773(v=VS.85).aspx
 */
exports.SCardGetStatusChange = function PCSC_SCardGetStatusChange(contextId, timeout, readerStates, readers) {
	var timeoutParam = lib.pcsc_t.DWORD(timeout);
	var readersParam = lib.pcsc_t.DWORD(readerStates.length);
	
	var readerStatesParam = lib.pcsc_t.SCARD_READERSTATE.array(readerStates.length)();
	
	for (var i = 0; i < readerStates.length; i++) {
		// TODO Proteger ante rangos diferentes
		var rdr = ctypes.char.array()(readers[i]);
		    		
		var rdrState = new lib.pcsc_t.SCARD_READERSTATE;
		rdrState.szReader = rdr;
		// rdrState.pvUserData=
		rdrState.dwCurrentState = readerStates[i];
		// rdrState.dwEventState=
		// rdrState.cbAtr=
		// rdrState.rgbAtr=
		
		readerStatesParam[i] = rdrState;
	}
	
	var status = lib.pcsc.SCardGetStatusChange(contextId, timeoutParam, readerStatesParam.addressOfElement(0), readersParam);
	status = toUnsignedNumber(status);
	if (status == lib.pcsc_t.SCARD_S_SUCCESS) {
		var result = new Array(readerStatesParam.length);
		for (var i = 0; i<readerStatesParam.length; i++) {
			result[i] = readerStatesParam[i].dwEventState;
		}
		return result;
	} else {
		throw new PCSCException(status, toErrorString(status));
	}       
};

/**
 * SCardControl
 * 
 * The SCardControl function gives you direct control of the reader. You can
 * call it any time after a successful call to SCardConnect and before a
 * successful call to SCardDisconnect. The effect on the state of the reader
 * depends on the control code.
 */
exports.SCardControl = function PCSC_SCardControl(cardId, controlCode, command) {
	   	
	var hCard = lib.pcsc_t.SCARDHANDLE(cardId);
	
	/**
	 * Control code for the operation. This value identifies the specific
	 * operation to be performed.
	 */
	var dwControlCode = lib.pcsc_t.DWORD(controlCode);
	
	/**
	 * Pointer to a buffer that contains the data required to perform the
	 * operation. This parameter can be NULL if the dwControlCode parameter
	 * specifies an operation that does not require input data.
	 */
	var pbSendBuffer = lib.pcsc_t.BYTE.array()(command);
	
	/**
	 * Size, in bytes, of the buffer pointed to by lpInBuffer.
	 */
	var cbSendLength = lib.pcsc_t.DWORD(command.length);
	
	/**
	 * Pointer to a buffer that receives the operation's output data. This
	 * parameter can be NULL if the dwControlCode parameter specifies an
	 * operation that does not produce output data.
	 */
	var pbRecvBuffer = lib.pcsc_t.BYTE.array(MAX_STACK_BUFFER_SIZE)();
	
	/**
	 * Size, in bytes, of the buffer pointed to by lpOutBuffer.
	 */
	var cbRecvLength = lib.pcsc_t.DWORD(MAX_STACK_BUFFER_SIZE);
	
	/**
	 * Pointer to a DWORD that receives the size, in bytes, of the data
	 * stored into the buffer pointed to by lpOutBuffer.
	 */
	var lpBytesReturned = lib.pcsc_t.DWORD();
	
	
	var status = lib.pcsc.SCardControl(hCard, dwControlCode, 
			pbSendBuffer.address(), 
			cbSendLength, 
			pbRecvBuffer.addressOfElement(0), 
			cbRecvLength, 
			lpBytesReturned.address() );
	
	status = toUnsignedNumber(status);
//	    	lib.log("SCardControl: hCard="+hCard);
//	    	lib.log("SCardControl: dwControlCode="+dwControlCode.value);
//	    	lib.log("SCardControl: cbRecvLength="+cbRecvLength.value);
//	    	lib.log("SCardControl: cbRecvLength="+cbRecvLength.value);
//	    	lib.log("SCardControl: lpBytesReturned="+lpBytesReturned.value);
	
	if (status == lib.pcsc_t.SCARD_S_SUCCESS) {
		var receiveBuffer = util.sliceArray(pbRecvBuffer, 0, lpBytesReturned.value);
		
		return receiveBuffer;
	} else {
		throw new PCSCException(status, toErrorString(status));
	}
};

exports.SCardTransmit = function PCSC_SCardTransmit(cardId, protocol, command, offset, length) {

	var pioSendPci = lib.pcsc_t.SCARD_IO_REQUEST();
	pioSendPci.dwProtocol = ctypes.unsigned_long(protocol);
	pioSendPci.cbPciLength = ctypes.unsigned_long(8);    	
	
	var cmd = util.sliceArray(command, 0, length);
	var pbSendBuffer = lib.pcsc_t.BYTE.array()(cmd);
	
	// lib.log("SCardTransmit: pbSendBuffer: "+pbSendBuffer);
	// lib.log("SCardTransmit: state: "+ toHexString(pdwState.value));
	// lib.log("SCardTransmit: protocol: "+ toHexString(pdwProtocol.value));
	    	
	/*
	 * cbSendLength: The length, in bytes, of the pbSendBuffer parameter.
	 * 
	 * For T=0, in the special case where no data is sent to the card and no
	 * data expected in return, this length must reflect that the bP3 member
	 * is not being sent; the length should be sizeof(CmdBytes) -
	 * sizeof(BYTE).
	 */
	var cbSendLength = lib.pcsc_t.DWORD(length);
	
	/*
	 * pioRecvPci [in, out, optional] Pointer to the protocol header
	 * structure for the instruction, followed by a buffer in which to
	 * receive any returned protocol control information (PCI) specific to
	 * the protocol in use. This parameter can be NULL if no PCI is
	 * returned.
	 */
	var pioRecvPci = null;
	
	var pbRecvBuffer = lib.pcsc_t.BYTE.array(RECEIVE_BUFFER_SIZE)();
	var pcbRecvLength = lib.pcsc_t.DWORD(RECEIVE_BUFFER_SIZE);
	
	console.debug("pcsc: SCardTransmit() - APDU command = "+util.ArrayToHexString(cmd));
	
	var status = lib.pcsc.SCardTransmit(cardId, 
			pioSendPci.address(), 
			pbSendBuffer.addressOfElement(offset), 
			cbSendLength, 
			null, 
			pbRecvBuffer.addressOfElement(0), 
			pcbRecvLength.address() );
	
	
	status = toUnsignedNumber(status);
	
	if (status == lib.pcsc_t.SCARD_S_SUCCESS) {
		var response = util.sliceArray(pbRecvBuffer, 0, pcbRecvLength.value);
		console.debug("pcsc: SCardTransmit() - APDU response = "+util.ArrayToHexString(response));
		return response;
	} else {
		throw new PCSCException(status, toErrorString(status));
	}
};
    
exports.SCardListReaders = function PCSC_SCardListReaders(contextId) {
		
	var pcchReaders = ctypes.unsigned_long();
	
	var status = lib.pcsc.SCardListReaders(contextId, null, null, pcchReaders.address());
	status = toUnsignedNumber(status);
	
	if (status != lib.pcsc_t.SCARD_S_SUCCESS) {
		console.error("SCardListReaders: Error: status code is "+toErrorString(status));
		throw new PCSCException(status, toErrorString(status));
	}
	
	var mszReaders = ctypes.char.array(pcchReaders.value)();
	status = lib.pcsc.SCardListReaders(contextId, null, mszReaders, pcchReaders.address());
	
	if (status == lib.pcsc_t.SCARD_S_SUCCESS) {
		var result = [];
		
		var reader = mszReaders.readString();
		lib.log("SCardListReaders: Smartcard reader found: "+reader);
		result.push(reader);
		while (reader.length < mszReaders.length - 2) {
			
			var mszReadersAux = ctypes.char.array(mszReaders.length - reader.length - 1)();
			var i = 0;
			for (var j = reader.length+1; j < mszReaders.length; j++) {
				mszReadersAux[i] = mszReaders[j]; 
				i++;
			}
			mszReaders = mszReadersAux;
			reader = mszReaders.readString();
			lib.log("SCardListReaders: Smartcard reader found: "+reader);
			result.push(reader);
		}
		
		return result;
	} else {
		console.error("SCardListReaders: Error: status code is "+toErrorString(status));
		throw new PCSCException(status, toErrorString(status));
	} 
};

defs = function() {
}

// Sharing Mode
defs.SCARD_SHARE_EXCLUSIVE = lib.pcsc_t.SCARD_SHARE_EXCLUSIVE;
defs.SCARD_SHARE_SHARED = lib.pcsc_t.SCARD_SHARE_SHARED;
defs.SCARD_SHARE_DIRECT = lib.pcsc_t.SCARD_SHARE_DIRECT;

// Protocol
defs.SCARD_PROTOCOL_T0 = lib.pcsc_t.SCARD_PROTOCOL_T0;
defs.SCARD_PROTOCOL_T1 = lib.pcsc_t.SCARD_PROTOCOL_T1;

// State
defs.SCARD_STATE_UNAWARE = lib.pcsc_t.SCARD_STATE_UNAWARE;
defs.SCARD_STATE_IGNORE = lib.pcsc_t.SCARD_STATE_IGNORE;
defs.SCARD_STATE_CHANGED = lib.pcsc_t.SCARD_STATE_CHANGED;
defs.SCARD_STATE_UNKNOWN = lib.pcsc_t.SCARD_STATE_UNKNOWN;
defs.SCARD_STATE_UNAVAILABLE = lib.pcsc_t.SCARD_STATE_UNAVAILABLE;
defs.SCARD_STATE_EMPTY = lib.pcsc_t.SCARD_STATE_EMPTY;
defs.SCARD_STATE_PRESENT = lib.pcsc_t.SCARD_STATE_PRESENT;
defs.SCARD_STATE_ATRMATCH = lib.pcsc_t.SCARD_STATE_ATRMATCH;
defs.SCARD_STATE_EXCLUSIVE = lib.pcsc_t.SCARD_STATE_EXCLUSIVE;
defs.SCARD_STATE_INUSE = lib.pcsc_t.SCARD_STATE_INUSE;
defs.SCARD_STATE_MUTE = lib.pcsc_t.SCARD_STATE_MUTE;
defs.SCARD_STATE_UNPOWERED = lib.pcsc_t.SCARD_STATE_UNPOWERED;

// Disconnect reset options
defs.SCARD_LEAVE_CARD = lib.pcsc_t.SCARD_LEAVE_CARD;
defs.SCARD_RESET_CARD = lib.pcsc_t.SCARD_RESET_CARD;

// SCardControl status code
defs.SCARD_W_REMOVED_CARD = lib.pcsc_t.SCARD_W_REMOVED_CARD;

// SCardGetStatusChange
defs.SCARD_E_TIMEOUT = lib.pcsc_t.SCARD_E_TIMEOUT;
defs.TIMEOUT_INFINITE = lib.pcsc_t.TIMEOUT_INFINITE;

// Scope
defs.SCARD_SCOPE_USER = lib.pcsc_t.SCARD_SCOPE_USER;
defs.SCARD_SCOPE_TERMINAL = lib.pcsc_t.SCARD_SCOPE_TERMINAL;
defs.SCARD_SCOPE_SYSTEM = lib.pcsc_t.SCARD_SCOPE_SYSTEM;
defs.SCARD_SCOPE_GLOBAL = lib.pcsc_t.SCARD_SCOPE_GLOBAL;

defs.parse = function(str) {
	
    var val = defs[str];
    
    if (val != undefined) {
        return (val);
    } else {
        for (key in defs) {
            if (str == defs[key]) {
                return (defs[key]);
            }
        }
    }
    throw str + ' cannot be parsed to defs.';
}

defs.toString = function(val, throwIfNotFound) {
    for (key in CardState) {
        if (val == defs[key]) {
            return (key);
        }
    }

    if (throwIfNotFound) {
        throw val + ' is not a valid CardState value.';
    } else {
        return (val);
    }
}

exports.defs = defs;
    
// UTILITY

function toHexString(signedNumber) {
	return "0x" + toUnsignedNumber(signedNumber).toString(16);
}

function toUnsignedNumber(signedNumber) {
	return Number(ctypes.unsigned_long(signedNumber).value);
}

function toErrorString(unsignedCode) {

	var result = "";
	
    switch (unsignedCode) {
        case lib.pcsc_t.SCARD_S_SUCCESS             : 
        	result = "SCARD_S_SUCCESS";
        	break;
        case lib.pcsc_t.SCARD_E_CANCELLED           : 
        	result = "SCARD_E_CANCELLED";
        	break;
        case lib.pcsc_t.SCARD_E_CANT_DISPOSE        : 
        	result = "SCARD_E_CANT_DISPOSE";
        	break;
        case lib.pcsc_t.SCARD_E_INSUFFICIENT_BUFFER :
        	result = "SCARD_E_INSUFFICIENT_BUFFER";
        	break;
        case lib.pcsc_t.SCARD_E_INVALID_ATR         : 
        	result = "SCARD_E_INVALID_ATR";
        	break;
        case lib.pcsc_t.SCARD_E_INVALID_HANDLE      : 
        	result = "SCARD_E_INVALID_HANDLE";
        	break;
        case lib.pcsc_t.SCARD_E_INVALID_PARAMETER   : 
        	result = "SCARD_E_INVALID_PARAMETER";
        	break;
        case lib.pcsc_t.SCARD_E_INVALID_TARGET      : 
        	result = "SCARD_E_INVALID_TARGET";
        	break;
        case lib.pcsc_t.SCARD_E_INVALID_VALUE       : 
        	result = "SCARD_E_INVALID_VALUE";
        	break;

        case lib.pcsc_t.SCARD_E_NO_MEMORY           : 
        	result = "SCARD_E_NO_MEMORY";
        	break;
        case lib.pcsc_t.SCARD_F_COMM_ERROR          : 
        	result = "SCARD_F_COMM_ERROR";
        	break;
        case lib.pcsc_t.SCARD_F_INTERNAL_ERROR      : 
        	result = "SCARD_F_INTERNAL_ERROR";
        	break;
        case lib.pcsc_t.SCARD_F_UNKNOWN_ERROR       : 
        	result = "SCARD_F_UNKNOWN_ERROR";
        	break;
        case lib.pcsc_t.SCARD_F_WAITED_TOO_LONG     : 
        	result = "SCARD_F_WAITED_TOO_LONG";
        	break;
        case lib.pcsc_t.SCARD_E_UNKNOWN_READER      : 
        	result = "SCARD_E_UNKNOWN_READER";
        	break;
        case lib.pcsc_t.SCARD_E_TIMEOUT             : 
        	result = "SCARD_E_TIMEOUT";
        	break;
        case lib.pcsc_t.SCARD_E_SHARING_VIOLATION   : 
        	result = "SCARD_E_SHARING_VIOLATION";
        	break;
        case lib.pcsc_t.SCARD_E_NO_SMARTCARD        : 
        	result = "SCARD_E_NO_SMARTCARD";
        	break;
        case lib.pcsc_t.SCARD_E_UNKNOWN_CARD        : 
        	result = "SCARD_E_UNKNOWN_CARD";
        	break;
        case lib.pcsc_t.SCARD_E_PROTO_MISMATCH      : 
        	result = "SCARD_E_PROTO_MISMATCH";
        	break;
        case lib.pcsc_t.SCARD_E_NOT_READY           : 
        	result = "SCARD_E_NOT_READY";
        	break;
        case lib.pcsc_t.SCARD_E_SYSTEM_CANCELLED    : 
        	result = "SCARD_E_SYSTEM_CANCELLED";
        	break;
        case lib.pcsc_t.SCARD_E_NOT_TRANSACTED      : 
        	result = "SCARD_E_NOT_TRANSACTED";
        	break;
        case lib.pcsc_t.SCARD_E_READER_UNAVAILABLE  : 
        	result = "SCARD_E_READER_UNAVAILABLE";
        	break;

        case lib.pcsc_t.SCARD_W_UNSUPPORTED_CARD    : 
        	result = "SCARD_W_UNSUPPORTED_CARD";
        	break;
        case lib.pcsc_t.SCARD_W_UNRESPONSIVE_CARD   : 
        	result = "SCARD_W_UNRESPONSIVE_CARD";
        	break;
        case lib.pcsc_t.SCARD_W_UNPOWERED_CARD      : 
        	result = "SCARD_W_UNPOWERED_CARD";
        	break;
        case lib.pcsc_t.SCARD_W_RESET_CARD          : 
        	result = "SCARD_W_RESET_CARD";
        	break;
        case lib.pcsc_t.SCARD_W_REMOVED_CARD        : 
        	result = "SCARD_W_REMOVED_CARD";
        	break;
        case lib.pcsc_t.SCARD_W_INSERTED_CARD       : 
        	result = "SCARD_W_INSERTED_CARD";
        	break;

        case lib.pcsc_t.SCARD_E_UNSUPPORTED_FEATURE : 
        	result = "SCARD_E_UNSUPPORTED_FEATURE";
        	break;
        case lib.pcsc_t.SCARD_E_PCI_TOO_SMALL       : 
        	result = "SCARD_E_PCI_TOO_SMALL";
        	break;
        case lib.pcsc_t.SCARD_E_READER_UNSUPPORTED  : 
        	result = "SCARD_E_READER_UNSUPPORTED";
        	break;
        case lib.pcsc_t.SCARD_E_DUPLICATE_READER    : 
        	result = "SCARD_E_DUPLICATE_READER";
        	break;
        case lib.pcsc_t.SCARD_E_CARD_UNSUPPORTED    : 
        	result = "SCARD_E_CARD_UNSUPPORTED";
        	break;
        case lib.pcsc_t.SCARD_E_NO_SERVICE          : 
        	result = "SCARD_E_NO_SERVICE";
        	break;
        case lib.pcsc_t.SCARD_E_SERVICE_STOPPED     : 
        	result = "SCARD_E_SERVICE_STOPPED";
        	break;

        case lib.pcsc_t.SCARD_E_NO_READERS_AVAILABLE: 
        	result = "SCARD_E_NO_READERS_AVAILABLE";
        	break;
        case lib.pcsc_t.WINDOWS_ERROR_INVALID_HANDLE: 
        	result = "WINDOWS_ERROR_INVALID_HANDLE";
        	break;
        case lib.pcsc_t.WINDOWS_ERROR_INVALID_PARAMETER:
        	result = "WINDOWS_ERROR_INVALID_PARAMETER";
        	break;

        default: 
        	result = "UNKNOWN";
    }
    
    return result + "[0x" + unsignedCode.toString(16) + "]";
};
    
/**
 * PCSCException
 * 
 * http://stackoverflow.com/questions/1382107/whats-a-good-way-to-extend-error-in-javascript
 * 
 * https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Error
 * 
 * @param code
 * @param message
 * @returns {PCSCException}
 */
function PCSCException(code, message) {
    this.name = 'PCSCException';
    this.code = code;
    this.message =  (message) ? message : "PCSC exception";
    this.stack = (new Error()).stack;
}
PCSCException.prototype = new Error;