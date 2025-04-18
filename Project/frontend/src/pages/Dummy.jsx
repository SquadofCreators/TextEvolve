import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';
import { isMobile } from 'react-device-detect';
import {
    FiSmartphone, FiType, FiCheckCircle, FiLoader,
    FiAlertCircle, FiCopy, FiRefreshCw, FiCamera, FiUploadCloud, FiXCircle, FiUser
} from 'react-icons/fi';
import { FaQrcode } from "react-icons/fa";
import { Html5Qrcode } from 'html5-qrcode';
import { useAuth } from '../contexts/AuthContext'; // Assuming you have this context

// --- Configuration ---
const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const wsHost = window.location.hostname;
// Use an environment variable or default to common dev port / standard ports
const wsPort = import.meta.env.REACT_APP_WEBSOCKET_PORT || (window.location.hostname === 'localhost' ? '5000' : (window.location.port || (wsProtocol === 'wss:' ? 443 : 80)));
const WEBSOCKET_URL = `${wsProtocol}//${wsHost}:${wsPort}`;
console.log("Attempting WebSocket connection to:", WEBSOCKET_URL);
// --------------------


function ConnectMobilePage() {
    // --- Component State ---
    const [connectionId, setConnectionId] = useState('');
    const [connectionStatus, setConnectionStatus] = useState('initializing'); // 'initializing', 'waiting', 'connecting', 'connected', 'error', 'ws_error', 'ws_closed'
    const [errorMessage, setErrorMessage] = useState('');
    const [mobileEnteredId, setMobileEnteredId] = useState('');
    const [isConnecting, setIsConnecting] = useState(false); // Mobile connecting loading state
    const [isGeneratingId, setIsGeneratingId] = useState(!isMobile); // Desktop ID generation loading state
    const [showScanner, setShowScanner] = useState(false); // Mobile scanner visibility
    const [scannerError, setScannerError] = useState(''); // Mobile scanner specific errors
    const [connectedUserInfo, setConnectedUserInfo] = useState(null); // Store user info received on mobile connect

    // --- Refs and Context ---
    const containerRef = useRef(null);
    const socketRef = useRef(null); // Ref to hold the WebSocket instance
    const qrReaderId = "qr-reader-element"; // ID for the scanner div
    const { user, token } = useAuth(); // Get user and token from context
     // Ref to access latest connectionId inside WS handlers without causing effect re-run just for comparison
     const connectionIdRef = useRef(connectionId);
     useEffect(() => { connectionIdRef.current = connectionId; }, [connectionId]);

    // --- WebSocket Connection Logic (Desktop) ---
    const connectWebSocket = (retrievedConnectionId, currentUserId) => {
        if (isMobile || !retrievedConnectionId || !currentUserId) {
             console.log("[WebSocket] Skipping connection: Conditions not met (isMobile/no ID/no User).");
             return;
        }
        // --- Close existing socket FIRST ---
         if (socketRef.current && socketRef.current.readyState !== WebSocket.CLOSED && socketRef.current.readyState !== WebSocket.CLOSING) {
             console.log("[WebSocket] Closing previous socket before reconnecting...");
             socketRef.current.close();
             socketRef.current = null;
         }
        // ---------------------------------

        console.log(`[WebSocket] Attempting to connect to ${WEBSOCKET_URL} for ID: ${retrievedConnectionId}`);
        setConnectionStatus('waiting'); // Indicate attempting WS connection / waiting
        setErrorMessage('');

        try {
            const socket = new WebSocket(WEBSOCKET_URL);
            socketRef.current = socket; // Store socket instance immediately

            socket.onopen = () => {
                console.log('[WebSocket] CLIENT: Connection Opened.');
                // Register this desktop client with its connection ID
                if (currentUserId && retrievedConnectionId) {
                    const registerMsg = {
                        type: 'REGISTER_DESKTOP',
                        connectionId: retrievedConnectionId,
                        userId: currentUserId
                    };
                    console.log('[WebSocket] CLIENT: Sending registration:', registerMsg);
                    socket.send(JSON.stringify(registerMsg));
                    // Status remains 'waiting' until confirmed or mobile connects
                } else {
                    console.error("[WebSocket] CLIENT: Cannot register - Missing connectionId or userId onopen.");
                    setErrorMessage("Internal error: Cannot register connection.");
                    setConnectionStatus('ws_error');
                    if (socketRef.current) socketRef.current.close(); // Check ref before closing
                    socketRef.current = null;
                }
            };

            socket.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    console.log('[WebSocket] CLIENT: Message from server:', message);

                    // Handle MOBILE_CONNECTED message
                    if (message.type === 'MOBILE_CONNECTED' && message.connectionId === connectionIdRef.current) { // Use Ref here
                        console.log('[WebSocket] CLIENT: Mobile device connected! Updating status.');
                        setConnectionStatus('connected');
                        setErrorMessage('');
                        if (socketRef.current) socketRef.current.close(); // Close socket once connection is made
                        socketRef.current = null;
                    }
                    else if (message.type === 'REGISTER_SUCCESS') {
                         console.log(`[WebSocket] CLIENT: Registration successful for ID: ${message.connectionId}`);
                         setConnectionStatus('waiting'); // Confirm status is waiting
                    }
                     else if (message.type === 'REGISTER_FAIL') {
                         console.error(`[WebSocket] CLIENT: Registration failed - ${message.reason}`);
                         setErrorMessage(`Real-time connection failed: ${message.reason || 'Registration Rejected'}`);
                         setConnectionStatus('ws_error');
                         if (socketRef.current) socketRef.current.close();
                         socketRef.current = null;
                     }
                    // Handle other message types...

                } catch (e) {
                    console.error('[WebSocket] CLIENT: Error parsing message:', e);
                }
            };

            socket.onclose = (event) => {
                console.log(`[WebSocket] CLIENT: Connection Closed. Code: ${event.code}, Reason: ${event.reason}, Clean: ${event.wasClean}`);
                 // Only set error if closed unexpectedly before being fully connected
                // Use a function check to avoid stale state closure issues
                setConnectionStatus(prevStatus => {
                    // Check if the socket closing is the one we currently hold in ref
                    // And avoid setting error if already connected or in another error state
                    if (socketRef.current === socket && prevStatus !== 'connected' && !prevStatus.includes('error') && prevStatus !== 'initializing' ) {
                         setErrorMessage('Real-time connection lost. Please regenerate ID.');
                         return 'ws_closed';
                    }
                     return prevStatus; // Keep current status otherwise
                 });
                // Only nullify ref if the closed socket is the current one
                 if(socketRef.current === socket) {
                    socketRef.current = null;
                 }
            };

            socket.onerror = (errorEvent) => {
                 const errorMsg = errorEvent.message || 'Could not connect to real-time service.';
                 console.error('[WebSocket] CLIENT: Connection Error:', errorMsg, errorEvent);
                 setErrorMessage('Real-time connection error. Check backend/console.');
                 setConnectionStatus('ws_error');
                 // Only nullify ref if the error belongs to the current socket
                 if(socketRef.current === socket) {
                    socketRef.current = null;
                 }
            };

        } catch (error) {
             console.error("Failed to create WebSocket:", error);
             setErrorMessage('Could not establish real-time connection.');
             setConnectionStatus('ws_error');
        }
    };


    // --- Generate/Fetch Connection ID on Desktop ---
    const fetchConnectionId = async () => {
        if (isMobile) return;
        if (!token) {
            setErrorMessage("Please log in to generate a connection ID.");
            setConnectionStatus('error');
            setIsGeneratingId(false);
            return;
        }

        // Close existing WebSocket before fetching new ID
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
             console.log("[WebSocket] Closing existing connection before regenerating ID.");
             socketRef.current.close();
             socketRef.current = null;
        }

        setIsGeneratingId(true);
        setErrorMessage('');
        setConnectionId(''); // Clear old ID immediately
        setConnectionStatus('initializing');
        console.log("Requesting new Connection ID from backend...");

        try {
            // --- API Call to Generate ID ---
             // Adjust URL if necessary
            const response = await fetch('http://localhost:5000/api/connect/generate-id', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            if (!response.ok) {
                let errorText = response.statusText;
                 if (response.status === 401 || response.status === 403) { errorText = "Authentication failed."; }
                 else { try { const errJson = await response.json(); errorText = errJson.message || errorText; } catch (_) {} }
                throw new Error(`Failed to generate ID (${response.status}): ${errorText}`);
            }

            const data = await response.json();
            if (!data.connectionId) { throw new Error("Backend did not return a Connection ID."); }

            // Set state first
            setConnectionId(data.connectionId);
            console.log("Desktop received Connection ID:", data.connectionId);

            // --- Connect WebSocket AFTER getting ID ---
            if (user?.id) {
                connectWebSocket(data.connectionId, user.id);
            } else {
                console.error("Cannot connect WebSocket: User ID not available from AuthContext.");
                setErrorMessage("Login session error, cannot establish real-time link.");
                setConnectionStatus('error');
            }

        } catch (err) {
            console.error("Failed to fetch connection ID:", err);
            setErrorMessage(err instanceof Error ? err.message : 'Could not get Connection ID.');
            setConnectionStatus('error');
        } finally {
            setIsGeneratingId(false);
        }
    };

    // Fetch ID on initial desktop mount if logged in
    useEffect(() => {
        if (!isMobile && token) {
            fetchConnectionId();
        } else if (!isMobile && !token) {
            setErrorMessage("Please log in to connect a mobile device.");
            setConnectionStatus('error');
            setIsGeneratingId(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, isMobile, user?.id]); // Re-run if user/token changes

    // --- Cleanup WebSocket on component unmount ---
    useEffect(() => {
        return () => {
            if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                console.log('[WebSocket] Closing connection on component unmount.');
                socketRef.current.close();
                socketRef.current = null;
            }
        };
    }, []); // Empty dependency array ensures this runs only once on unmount


    // --- Handlers ---
    const handleIdInputChange = (e) => {
        setMobileEnteredId(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
    };

    // Mobile connects (Calls Backend API to Validate ID)
    const handleConnect = async (e) => {
      if (e) e.preventDefault();
      const enteredId = mobileEnteredId.trim();
      if (!enteredId || isConnecting) {
        setErrorMessage(!enteredId ? "Please enter or scan valid ID." : "");
        return;
      }
      setIsConnecting(true);
      setConnectionStatus("connecting");
      setErrorMessage("");
      setConnectedUserInfo(null);
      console.log(`Mobile connecting with ID: ${enteredId}`);
      let success = false;
      try {
        // Adjust URL if needed
        const response = await fetch(
          "http://localhost:5000/api/connect/validate-id",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ connectionId: enteredId }),
          }
        );
        if (!response.ok) {
          let eText = response.statusText;
          try {
            const j = await response.json();
            eText = j.message || eText;
          } catch (_) {}
          if (response.status === 400) {
            throw new Error(eText || "Invalid/expired ID.");
          } else {
            throw new Error(`Connection failed: ${eText}`);
          }
        }
        const result = await response.json();
        success = result.success;
        if (success) {
          setConnectionStatus("connected");
          setConnectedUserInfo(result.user);
          console.log("Mobile Connected! User:", result.user);
        } else {
          throw new Error(result.message || "Validation failed.");
        }
      } catch (err) {
        console.error("Connection failed:", err);
        setErrorMessage(
          err instanceof Error ? err.message : "Connection failed."
        );
      } finally {
        setIsConnecting(false);
        if (!success) {
          setConnectionStatus("error");
        }
      }
    };

    const handleCopyId = () => {
        if (!connectionId) return;
        navigator.clipboard.writeText(connectionId)
            .then(() => alert(`Copied: ${connectionId}`))
            .catch(err => { console.error('Failed to copy ID: ', err); alert('Copy failed.'); });
    };

    // --- QR Code Scanner Effect (Mobile) ---
    useEffect(() => {
        let html5QrCode = null;
        let scannerTimeoutId = null; // Debounce cleanup

        if (showScanner && isMobile) {
            setScannerError('');
            try {
                const readerElement = document.getElementById(qrReaderId);
                if (!readerElement) { console.error("QR DOM Element missing"); setScannerError("Scanner UI missing"); setShowScanner(false); return; }
                html5QrCode = new Html5Qrcode(qrReaderId);
                const qrSuccessCallback = (decodedText, result) => {
                    console.log(`QR Scan: ${decodedText}`); const potentialId = decodedText.toUpperCase().trim();
                    if (/^[A-Z0-9]{6}$/.test(potentialId)) { setMobileEnteredId(potentialId); setShowScanner(false); alert(`Scanned ID: ${potentialId}. Press 'Connect via ID'.`); }
                    else { setScannerError("Invalid QR code scanned."); }
                };
                const qrErrorCallback = (errorMessage) => { if (!errorMessage.toLowerCase().includes("parse error")) { console.warn(`QR Error: ${errorMessage}`); } };
                html5QrCode.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 250, height: 250 } }, qrSuccessCallback, qrErrorCallback)
                 .catch(err => { let eMsg = "Camera start failed."; if (err.name === "NotAllowedError") eMsg = "Camera permission denied."; else if (err.name === "NotFoundError") eMsg = "No camera found."; setScannerError(eMsg); setShowScanner(false); });
            } catch (err) { console.error("QR Init Error:", err); setScannerError("QR Scanner failed."); setShowScanner(false); }
        }

        // Cleanup
        return () => {
            if (html5QrCode && !scannerTimeoutId) {
                scannerTimeoutId = setTimeout(() => {
                    html5QrCode?.stop?.().then(() => console.log("QR Scanner stopped.")).catch(err => console.error("Error stopping scanner:", err));
                 }, 50);
            }
        };
    }, [showScanner, isMobile]);


    // --- Animation Variants ---
    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.5 } } };
    const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut'} } };


    // --- Render Desktop View ---
    const renderDesktopView = () => (
        <motion.div key="desktop" variants={containerVariants} initial="hidden" animate="visible" exit="hidden" className="flex flex-col items-center text-center max-w-lg mx-auto" >
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Connect Your Mobile Device</h2>

            {/* Show QR/ID etc only if NOT connected */}
            {connectionStatus !== 'connected' && (
                <>
                    <p className="text-gray-600 mb-6"> Scan the QR code or enter the Connection ID on your mobile to upload documents.</p>
                    {/* QR Code Display */}
                    <motion.div variants={itemVariants} className="mb-3 bg-white p-4 rounded-lg shadow-md border min-w-[200px] min-h-[200px] flex items-center justify-center">
                        {isGeneratingId || connectionStatus === 'initializing' ? ( <FiLoader className="w-8 h-8 text-orange-500 animate-spin"/> )
                         : connectionId && connectionStatus !== 'error' && connectionStatus !== 'ws_error' && connectionStatus !== 'ws_closed' ? ( <QRCodeCanvas value={connectionId} size={192} /> )
                         : ( <div className="text-center text-red-600 p-4"> <FiAlertCircle className="w-8 h-8 mx-auto mb-2"/> <p className="text-sm">{errorMessage || 'Could not generate ID.'}</p> <button onClick={fetchConnectionId} className="mt-3 text-xs text-orange-600 hover:underline" disabled={!token}>Retry</button> </div> )}
                    </motion.div>
                    {/* Connection ID Display */}
                    <motion.div variants={itemVariants} className="mb-4">
                        <p className="text-sm text-gray-500 mb-2">Or enter this ID on mobile:</p>
                        <div className="flex items-center justify-center gap-3 bg-gray-100 border border-gray-300 px-6 py-3 rounded-lg min-w-[200px]">
                            {isGeneratingId || connectionStatus === 'initializing' ? (<span className="text-2xl font-mono tracking-widest text-gray-400 italic">Loading...</span>)
                             : connectionId && connectionStatus !== 'error' && connectionStatus !== 'ws_error' && connectionStatus !== 'ws_closed'? ( <> <span className="text-2xl font-mono tracking-widest text-gray-800">{connectionId}</span> <button onClick={handleCopyId} className="p-1 text-gray-500 hover:text-orange-600 transition-colors cursor-pointer" title="Copy ID"> <FiCopy className="w-5 h-5"/> </button> </> )
                             : (<span className="text-sm text-red-500">- Failed -</span>)}
                        </div>
                    </motion.div>
                    {/* Regenerate Button */}
                     {(connectionStatus !== 'connected' && connectionStatus !== 'initializing') && ( <button onClick={fetchConnectionId} className="mb-4 text-xs text-gray-500 hover:text-orange-600 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer" disabled={isGeneratingId || !token}> <FiRefreshCw className="w-3 h-3"/> {isGeneratingId ? 'Generating...' : 'Regenerate ID / QR Code'} </button> )}
                </>
            )}

            {/* Status Indicator - Always Visible */}
            <motion.div variants={itemVariants} className="flex items-center justify-center text-gray-600 min-h-[24px] mt-4">
                 {connectionStatus === 'initializing' && <><FiLoader className="w-5 h-5 mr-2 animate-spin text-orange-500" /><span>Initializing connection...</span></>}
                 {connectionStatus === 'waiting' && <><FiLoader className="w-5 h-5 mr-2 animate-spin text-orange-500" /><span>Waiting for mobile connection...</span></>}
                 {connectionStatus === 'connected' && <><FiCheckCircle className="w-5 h-5 mr-2 text-green-500" /><span className="text-green-600 font-semibold">Device Connected! Proceed on mobile.</span></>}
                 {(connectionStatus === 'error' || connectionStatus === 'ws_error' || connectionStatus === 'ws_closed') && !isGeneratingId && <><FiAlertCircle className="w-5 h-5 mr-2 text-red-500" /><span className="text-red-600 font-semibold">{errorMessage || 'Connection Error'}</span></>}
            </motion.div>
            {(connectionStatus === 'ws_error' || connectionStatus === 'ws_closed') && <p className="text-xs text-gray-400 mt-4">(Real-time connection failed or closed)</p>}

        </motion.div>
    );

    // --- Render Mobile View ---
    const renderMobileView = () => (
        <motion.div key="mobile" variants={containerVariants} initial="hidden" animate="visible" exit="hidden" className="flex flex-col items-center text-center max-w-md mx-auto w-full px-4 py-10" >
            {showScanner ? (
                <motion.div /* Scanner UI */
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                    className="w-full p-4 bg-gray-100 rounded-lg shadow-md border border-gray-200"
                >
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Scan QR Code</h3>
                    <p className="text-sm text-gray-600 mb-4">Point camera at QR code on desktop.</p>
                    <div id={qrReaderId} className="w-full max-w-[300px] aspect-square mx-auto border-4 border-orange-300 rounded-md overflow-hidden mb-4 bg-black"></div>
                    {scannerError && ( <p className="text-red-600 text-sm my-2 flex items-center justify-center"> <FiAlertCircle className="w-4 h-4 mr-1"/> {scannerError} </p> )}
                    <button onClick={() => setShowScanner(false)} className="btn-secondary text-sm py-2 px-4 mt-2" > <FiXCircle className="w-4 h-4 mr-1.5"/> Cancel Scan </button>
                </motion.div>
            ) : connectionStatus !== 'connected' ? (
                <> {/* Connection Form View */}
                    <div className="flex items-center justify-center gap-4 mb-6 text-orange-500"><FiType className="w-12 h-12 " /> <span className="text-gray-300 text-xl">OR</span> <FaQrcode className="w-12 h-12" /></div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">Connect to Desktop</h2>
                    <p className="text-gray-600 mb-8 text-sm"> Method 1: Enter the 6-character ID from desktop.<br/> Method 2: Tap "Scan QR Code".</p>
                    <form onSubmit={handleConnect} className="w-full flex flex-col items-center gap-4">
                        <motion.input variants={itemVariants} type="text" value={mobileEnteredId} onChange={handleIdInputChange} placeholder="ABCXYZ" maxLength={6} required disabled={isConnecting} className="form-input w-full max-w-xs text-center text-2xl font-mono tracking-widest uppercase" autoCapitalize="characters" />
                        {connectionStatus === 'error' && errorMessage && ( <motion.p variants={itemVariants} className="text-red-600 text-sm mt-1 flex items-center"><FiAlertCircle className="w-4 h-4 mr-1"/> {errorMessage}</motion.p> )}
                        <motion.button variants={itemVariants} type="submit" disabled={isConnecting} className="btn-primary w-full max-w-xs flex items-center justify-center"> {isConnecting ? <FiLoader className="w-5 h-5 mr-2 animate-spin"/> : <FiSmartphone className="w-5 h-5 mr-2"/>} {isConnecting ? 'Connecting...' : 'Connect via ID'} </motion.button>
                    </form>
                    <div className="mt-6 text-center w-full max-w-xs">
                        <p className="text-xs text-gray-400 mb-2">- OR -</p>
                        <button type="button" disabled={isConnecting} className="btn-secondary w-full flex items-center justify-center" onClick={() => { setScannerError(''); setShowScanner(true); }} >
                            <FaQrcode className="w-5 h-5 mr-2"/> Scan QR Code
                        </button>
                    </div>
                </>
            ) : (
                <motion.div variants={itemVariants} className="text-center w-full"> {/* Connected State View - Updated */}
                    <FiCheckCircle className="w-16 h-16 text-green-500 mb-4 mx-auto" />
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Connected!</h2>
                     {/* Display User Info */}
                     {connectedUserInfo ? (
                         <div className='mb-4 text-sm text-gray-600'>
                            <p>Connected to <span className="font-semibold">{connectedUserInfo.name || 'Desktop User'}</span></p>
                            <p>({connectedUserInfo.email})</p>
                        </div>
                     ) : (
                         <p className="text-sm text-gray-500 mb-4">(User details pending...)</p>
                     )}
                    <p className="text-gray-600 mb-8"> Ready to upload documents.</p>
                    <div className="p-6 bg-gray-100 border border-gray-200 rounded-lg space-y-4">
                        <h3 className="font-semibold text-gray-700">Upload Documents</h3>
                        {/* --- TODO: Replace this placeholder --- */}
                        <button className="btn-secondary inline-flex items-center mr-2"> <FiCamera className="w-4 h-4 mr-2"/> Take Photo </button>
                        <button className="btn-secondary inline-flex items-center"> <FiUploadCloud className="w-4 h-4 mr-2"/> Upload File </button>
                        {/* --- End Placeholder --- */}
                    </div>
                </motion.div>
            )}
        </motion.div>
    );


    // --- Main Return ---
    return (
        <div className="flex-1 h-full p-4 md:p-6 overflow-y-auto bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            <AnimatePresence mode="wait">
                 {isMobile ? renderMobileView() : renderDesktopView()}
            </AnimatePresence>
             {/* Reminder: Ensure helper styles (.form-input, .btn-primary, .btn-secondary) are in global CSS */}
        </div>
    );
}

export default ConnectMobilePage;