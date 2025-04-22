import React, { useState, useEffect, useRef, useCallback } from 'react'; // Added useCallback
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';
import { isMobile } from 'react-device-detect';
import { useDropzone } from 'react-dropzone'; // Import Dropzone
import {
    FiSmartphone, FiType, FiCheckCircle, FiLoader, FiAlertCircle, FiCopy,
    FiRefreshCw, FiCamera, FiUploadCloud, FiXCircle, FiUser, FiImage,
    FiFileText, FiFile // Added icons for file types
} from 'react-icons/fi';
import { FaQrcode } from "react-icons/fa";
import { Html5Qrcode } from 'html5-qrcode';
import { useAuth } from '../contexts/AuthContext';
import { batchService } from '../services/batchService'; // Import batchService


// --- Configuration ---
const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const wsHost = window.location.hostname; // Usually 'localhost' for dev
const wsPort = import.meta.env.VITE_WEBSOCKET_PORT

const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL;
console.log("Attempting WebSocket connection to:", WEBSOCKET_URL); // Should now show correct port
// --------------------------------------

// --- Helper Functions ---
const formatBytes = (bytes, decimals = 2) => {
    // Simplified version for number input only for this component's use case
    if (typeof bytes !== 'number' || bytes < 0) return 'N/A';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

const getFileTypeIcon = (fileType) => {
    const type = fileType || '';
    if (type.startsWith('image/')) return <FiImage className="w-6 h-6 text-orange-500" />;
    if (type === 'application/pdf') return <FiFileText className="w-6 h-6 text-red-500" />;
    if (type.includes('word')) return <FiFileText className="w-6 h-6 text-blue-500" />; // Example color
    return <FiFile className="w-6 h-6 text-gray-500" />;
};
// ----------------------


function ConnectMobilePage() {

  // --- Component State ---
  const [connectionId, setConnectionId] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("initializing");
  const [errorMessage, setErrorMessage] = useState("");
  const [mobileEnteredId, setMobileEnteredId] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isGeneratingId, setIsGeneratingId] = useState(!isMobile);
  const [showScanner, setShowScanner] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const [connectedUserInfo, setConnectedUserInfo] = useState(null);

  // --- State for Mobile Upload UI ---
  const [filesToUpload, setFilesToUpload] = useState([]); // Stores { file: File, preview: string | null }
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({
    message: "",
    type: "idle",
  }); // idle, loading, success, error
  // --- IMPORTANT: How do you get the target batch ID? ---
  // Placeholder: Assume it's known after connection. Fetch or pass from backend.
  const [batchIdToUploadTo, setBatchIdToUploadTo] = useState(null);
  // --------------------------------------------------------

  // --- Refs and Context ---
  const containerRef = useRef(null);
  const socketRef = useRef(null);
  const qrReaderId = "qr-reader-element";
  const { user, token } = useAuth();
  const connectionIdRef = useRef(connectionId);
  useEffect(() => {
    connectionIdRef.current = connectionId;
  }, [connectionId]);

    // --- WebSocket Connection Logic (Desktop - unchanged) ---
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

    // --- Generate/Fetch Connection ID on Desktop (unchanged) ---
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
            const response = await fetch( `${import.meta.env.VITE_API_URL}/api/connect/generate-id`, {
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

    useEffect(() => {
        if (!isMobile && token) {
            fetchConnectionId();
        } else if (!isMobile && !token) {
            setErrorMessage("Please log in to connect a mobile device.");
            setConnectionStatus('error');
            setIsGeneratingId(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, isMobile, user?.id]);

  // --- Cleanup WebSocket on component unmount ---
  useEffect(() => {
    return () => {
      if (
        socketRef.current &&
        socketRef.current.readyState === WebSocket.OPEN
      ) {
        console.log("[WebSocket] Closing connection on component unmount.");
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, []);

  // Handlers
  const handleIdInputChange = (e) => {
    setMobileEnteredId(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""));
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
    setBatchIdToUploadTo(null); // Reset batch ID too
    console.log(`Mobile connecting with ID: ${enteredId}`);
    let success = false;
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/connect/validate-id`,
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
        
        const targetBatchId = batchIdToUploadTo || result.batchId;
        setBatchIdToUploadTo(targetBatchId);
        console.log(
          "Mobile Connected! User:",
          result.user,
          "Target Batch:",
          targetBatchId
        );
        // ---------------------------------
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
    navigator.clipboard
      .writeText(connectionId)
      .then(() => alert(`Copied: ${connectionId}`))
      .catch((err) => {
        console.error("Failed to copy ID: ", err);
        alert("Copy failed.");
      });
  };

  // --- QR Code Scanner Effect  ---
  useEffect(() => {
    let html5QrCode = null;
    let scannerTimeoutId = null; // Debounce cleanup

    if (showScanner && isMobile) {
      setScannerError("");
      try {
        const readerElement = document.getElementById(qrReaderId);
        if (!readerElement) {
          console.error("QR DOM Element missing");
          setScannerError("Scanner UI missing");
          setShowScanner(false);
          return;
        }
        html5QrCode = new Html5Qrcode(qrReaderId);
        const qrSuccessCallback = (decodedText, result) => {
          console.log(`QR Scan: ${decodedText}`);
          const potentialId = decodedText.toUpperCase().trim();
          if (/^[A-Z0-9]{6}$/.test(potentialId)) {
            setMobileEnteredId(potentialId);
            setShowScanner(false);
            alert(`Scanned ID: ${potentialId}. Press 'Connect via ID'.`);
          } else {
            setScannerError("Invalid QR code scanned.");
          }
        };
        const qrErrorCallback = (errorMessage) => {
          if (!errorMessage.toLowerCase().includes("parse error")) {
            console.warn(`QR Error: ${errorMessage}`);
          }
        };
        html5QrCode
          .start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            qrSuccessCallback,
            qrErrorCallback
          )
          .catch((err) => {
            let eMsg = "Camera start failed.";
            if (err.name === "NotAllowedError")
              eMsg = "Camera permission denied.";
            else if (err.name === "NotFoundError") eMsg = "No camera found.";
            setScannerError(eMsg);
            setShowScanner(false);
          });
      } catch (err) {
        console.error("QR Init Error:", err);
        setScannerError("QR Scanner failed.");
        setShowScanner(false);
      }
    }

    // Cleanup
    return () => {
      if (html5QrCode && !scannerTimeoutId) {
        scannerTimeoutId = setTimeout(() => {
          html5QrCode
            ?.stop?.()
            .then(() => console.log("QR Scanner stopped."))
            .catch((err) => console.error("Error stopping scanner:", err));
        }, 50);
      }
    };
  }, [showScanner, isMobile]);

  // --- Mobile Upload Logic (Adapted from UploadPage.jsx) ---
  const onDrop = useCallback((acceptedFiles) => {
    console.log("Files dropped:", acceptedFiles);
    const mappedFiles = acceptedFiles.map((file) => ({
      file,
      preview: file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : null,
    }));
    setFilesToUpload((prev) => [...prev, ...mappedFiles]);
    setUploadStatus({ message: "", type: "idle" }); // Clear status
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      // Consider allowed types for mobile uploads
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/gif": [".gif"], // Maybe remove gif?
      "application/pdf": [".pdf"],
      // Consider if DOC/DOCX upload makes sense from mobile photos
    },
    multiple: true,
    disabled: isUploading, // Disable dropzone while uploading
  });

  // Cleanup preview URLs
  useEffect(() => {
    return () => {
      filesToUpload.forEach((item) => {
        if (item.preview) URL.revokeObjectURL(item.preview);
      });
    };
  }, [filesToUpload]);

  const removeFile = (index) => {
    setFilesToUpload((prev) => prev.filter((_, i) => i !== index));
    if (filesToUpload.length === 1) {
      setUploadStatus({ message: "", type: "idle" });
    }
  };

    const handleMobileUpload = async () => {
        if (filesToUpload.length === 0 || !batchIdToUploadTo) {
            setUploadStatus({ message: 'Select files & ensure connection for target batch.', type: 'error' });
            return;
        }
        setIsUploading(true);
        setUploadStatus({ message: `Uploading ${filesToUpload.length} file(s)...`, type: 'loading' });

        try {
            // --- Use batchService.uploadDocuments ---
            console.log(`Uploading ${filesToUpload.length} files to Batch ID: ${batchIdToUploadTo}`);
            const fileList = filesToUpload.map(f => f.file); // Extract File objects
            const uploadResponse = await batchService.uploadDocuments(batchIdToUploadTo, fileList);
            // ----------------------------------------

            console.log("Files uploaded via mobile:", uploadResponse);
            setUploadStatus({ message: `${filesToUpload.length} file(s) successfully uploaded.`, type: 'success' });
            setFilesToUpload([]); // Clear files after successful upload

            // Optional: Notify desktop via WebSocket through backend
            // sendWsMessage({ type: 'MOBILE_UPLOAD_COMPLETE', count: fileList.length, batchId: batchIdToUploadTo });

        } catch (error) {
            console.error("Mobile upload failed:", error);
            // Attempt to get specific error from backend response if available (depends on apiClient setup)
            const errorMsgFromServer = error?.response?.data?.message || error.message;
            setUploadStatus({ message: `Upload failed: ${errorMsgFromServer || 'Unknown error'}`, type: 'error' });
        } finally {
            setIsUploading(false);
        }
    };
  // ---------------------------------------------------------

  // --- Animation Variants ---
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  // --- Render Desktop View (No changes needed) ---
  const renderDesktopView = () => (
    <motion.div
      key="desktop"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      className="flex flex-col items-center text-center max-w-lg mx-auto"
    >
      <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
        Connect Your Mobile Device
      </h2>

      {/* Show QR/ID etc only if NOT connected */}
      {connectionStatus !== "connected" && (
        <>
          <p className="text-gray-600 mb-6">
            {" "}
            Scan the QR code or enter the Connection ID on your mobile to upload
            documents.
          </p>
          {/* QR Code Display */}
          <motion.div
            variants={itemVariants}
            className="mb-3 bg-white p-4 rounded-lg shadow-md border min-w-[200px] min-h-[200px] flex items-center justify-center"
          >
            {isGeneratingId || connectionStatus === "initializing" ? (
              <FiLoader className="w-8 h-8 text-orange-500 animate-spin" />
            ) : connectionId &&
              connectionStatus !== "error" &&
              connectionStatus !== "ws_error" &&
              connectionStatus !== "ws_closed" ? (
              <QRCodeCanvas value={connectionId} size={192} />
            ) : (
              <div className="text-center text-red-600 p-4">
                {" "}
                <FiAlertCircle className="w-8 h-8 mx-auto mb-2" />{" "}
                <p className="text-sm">
                  {errorMessage || "Could not generate ID."}
                </p>{" "}
                <button
                  onClick={fetchConnectionId}
                  className="mt-3 text-xs text-orange-600 hover:underline"
                  disabled={!token}
                >
                  Retry
                </button>{" "}
              </div>
            )}
          </motion.div>
          {/* Connection ID Display */}
          <motion.div variants={itemVariants} className="mb-4">
            <p className="text-sm text-gray-500 mb-2">
              Or enter this ID on mobile:
            </p>
            <div className="flex items-center justify-center gap-3 bg-gray-100 border border-gray-300 px-6 py-3 rounded-lg min-w-[200px]">
              {isGeneratingId || connectionStatus === "initializing" ? (
                <span className="text-2xl font-mono tracking-widest text-gray-400 italic">
                  Loading...
                </span>
              ) : connectionId &&
                connectionStatus !== "error" &&
                connectionStatus !== "ws_error" &&
                connectionStatus !== "ws_closed" ? (
                <>
                  {" "}
                  <span className="text-2xl font-mono tracking-widest text-gray-800">
                    {connectionId}
                  </span>{" "}
                  <button
                    onClick={handleCopyId}
                    className="p-1 text-gray-500 hover:text-orange-600 transition-colors cursor-pointer"
                    title="Copy ID"
                  >
                    {" "}
                    <FiCopy className="w-5 h-5" />{" "}
                  </button>{" "}
                </>
              ) : (
                <span className="text-sm text-red-500">- Failed -</span>
              )}
            </div>
          </motion.div>
          {/* Regenerate Button */}
          {connectionStatus !== "connected" &&
            connectionStatus !== "initializing" && (
              <button
                onClick={fetchConnectionId}
                className="mb-4 text-xs text-gray-500 hover:text-orange-600 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                disabled={isGeneratingId || !token}
              >
                {" "}
                <FiRefreshCw className="w-3 h-3" />{" "}
                {isGeneratingId ? "Generating..." : "Regenerate ID / QR Code"}{" "}
              </button>
            )}
        </>
      )}

      {/* Status Indicator - Always Visible */}
      <motion.div
        variants={itemVariants}
        className="flex items-center justify-center text-gray-600 min-h-[24px] mt-4"
      >
        {connectionStatus === "initializing" && (
          <>
            <FiLoader className="w-5 h-5 mr-2 animate-spin text-orange-500" />
            <span>Initializing connection...</span>
          </>
        )}
        {connectionStatus === "waiting" && (
          <>
            <FiLoader className="w-5 h-5 mr-2 animate-spin text-orange-500" />
            <span>Waiting for mobile connection...</span>
          </>
        )}
        {connectionStatus === "connected" && (
          <>
            <FiCheckCircle className="w-5 h-5 mr-2 text-green-500" />
            <span className="text-green-600 font-semibold">
              Device Connected! Proceed on mobile.
            </span>
          </>
        )}
        {(connectionStatus === "error" ||
          connectionStatus === "ws_error" ||
          connectionStatus === "ws_closed") &&
          !isGeneratingId && (
            <>
              <FiAlertCircle className="w-5 h-5 mr-2 text-red-500" />
              <span className="text-red-600 font-semibold">
                {errorMessage || "Connection Error"}
              </span>
            </>
          )}
      </motion.div>
      {(connectionStatus === "ws_error" ||
        connectionStatus === "ws_closed") && (
        <p className="text-xs text-gray-400 mt-4">
          (Real-time connection failed or closed)
        </p>
      )}
    </motion.div>
  );

  // --- Render Mobile View (Updated Connected State) ---
  const renderMobileView = () => (
    <motion.div
      key="mobile"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      className="flex flex-col items-center text-center max-w-md mx-auto w-full px-4"
    >
      {showScanner ? (
        // --- Scanner View ---
        <motion.div /* Scanner UI */
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="w-full p-4 bg-gray-100 rounded-lg shadow-md border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            Scan QR Code
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Point camera at QR code on desktop.
          </p>
          <div
            id={qrReaderId}
            className="w-full max-w-[300px] aspect-square mx-auto border-4 border-orange-300 rounded-md overflow-hidden mb-4 bg-black"
          ></div>
          {scannerError && (
            <p className="text-red-600 text-sm my-2 flex items-center justify-center">
              {" "}
              <FiAlertCircle className="w-4 h-4 mr-1" /> {scannerError}{" "}
            </p>
          )}
          <button
            onClick={() => setShowScanner(false)}
            className="btn-secondary text-sm py-2 px-4 mt-2"
          >
            {" "}
            <FiXCircle className="w-4 h-4 mr-1.5" /> Cancel Scan{" "}
          </button>
        </motion.div>
      ) : connectionStatus !== "connected" ? (
        <>
          {" "}
          {/* Connection Form View */}
          <div className="flex items-center justify-center gap-4 mb-6 text-orange-500">
            <FiType className="w-12 h-12 " />{" "}
            <span className="text-gray-300 text-xl">OR</span>{" "}
            <FaQrcode className="w-12 h-12" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">
            Connect to Desktop
          </h2>
          <p className="text-gray-600 mb-8 text-sm">
            {" "}
            Method 1: Enter the 6-character ID from desktop.
            <br /> Method 2: Tap "Scan QR Code".
          </p>
          <form
            onSubmit={handleConnect}
            className="w-full flex flex-col items-center gap-4"
          >
            <motion.input
              variants={itemVariants}
              type="text"
              value={mobileEnteredId}
              onChange={handleIdInputChange}
              placeholder="ABCXYZ"
              maxLength={6}
              required
              disabled={isConnecting}
              className="form-input w-full max-w-xs text-center text-2xl font-mono tracking-widest uppercase"
              autoCapitalize="characters"
            />
            {connectionStatus === "error" && errorMessage && (
              <motion.p
                variants={itemVariants}
                className="text-red-600 text-sm mt-1 flex items-center"
              >
                <FiAlertCircle className="w-4 h-4 mr-1" /> {errorMessage}
              </motion.p>
            )}
            <motion.button
              variants={itemVariants}
              type="submit"
              disabled={isConnecting}
              className="btn-primary w-full max-w-xs flex items-center justify-center"
            >
              {" "}
              {isConnecting ? (
                <FiLoader className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <FiSmartphone className="w-5 h-5 mr-2" />
              )}{" "}
              {isConnecting ? "Connecting..." : "Connect via ID"}{" "}
            </motion.button>
          </form>
          <div className="mt-6 text-center w-full max-w-xs">
            <p className="text-xs text-gray-400 mb-2">- OR -</p>
            <button
              type="button"
              disabled={isConnecting}
              className="btn-secondary w-full flex items-center justify-center"
              onClick={() => {
                setScannerError("");
                setShowScanner(true);
              }}
            >
              <FaQrcode className="w-5 h-5 mr-2" /> Scan QR Code
            </button>
          </div>
        </>
      ) : (
        // --- Connected State View (UPLOAD UI) ---
        <motion.div variants={itemVariants} className="text-center w-full">
          <FiCheckCircle className="w-16 h-16 text-green-500 mb-4 mx-auto" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Connected!</h2>
          {/* Display User Info */}
          {connectedUserInfo && (
            <div className="mb-4 text-sm text-gray-600">
              <p>
                To Desktop User:{" "}
                <span className="font-semibold">
                  {connectedUserInfo.name || "User"}
                </span>{" "}
                ({connectedUserInfo.email})
              </p>
            </div>
          )}
          {/* Display target batch ID */}
          <p className="text-xs text-gray-500 mb-6">
            Uploading to Batch ID: {batchIdToUploadTo || "Waiting..."}
          </p>

          {/* Batch ID input */}
          <div className="mb-4 text-sm text-gray-600">
            <p className="text-xs text-gray-500 mb-2">Batch ID (optional):</p>
            <input
              type="text"
              value={batchIdToUploadTo || ""}
              onChange={(e) => setBatchIdToUploadTo(e.target.value)}
              placeholder="Enter Batch ID"
              className="form-input w-full max-w-xs text-center text-sm font-mono tracking-widest uppercase"
              autoCapitalize="characters"
            />
          </div>

          {/* --- UPLOAD UI --- */}
          <div className="w-full p-4 bg-gray-100 border border-gray-200 rounded-lg space-y-4 text-left">
            <h3 className="font-semibold text-gray-700 text-center text-lg mb-4">
              Upload Documents
            </h3>

            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={`p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors duration-200 ease-in-out ${
                isDragActive
                  ? "border-orange-500 bg-orange-50"
                  : "border-gray-300 hover:border-gray-400 bg-white"
              }`}
            >
              <input {...getInputProps()} disabled={isUploading} />
              <FiUploadCloud className="mx-auto h-10 w-10 text-gray-400 mb-2" />
              <p className="text-sm font-medium text-gray-600">
                {isDragActive
                  ? "Drop files here..."
                  : "Drag 'n' drop, click to select, or use camera"}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Supports Images & PDF
              </p>
              {/* Camera Input - opens native camera */}
              <label
                htmlFor="cameraInput"
                className="mt-3 inline-block text-sm text-orange-600 hover:text-orange-800 cursor-pointer underline"
              >
                Or tap to use Camera
              </label>
              <input
                id="cameraInput"
                type="file"
                accept="image/*"
                capture="environment" // Prioritize back camera
                className="hidden" // Hide the default input
                onChange={(e) => onDrop(Array.from(e.target.files))} // Use the same onDrop handler
                disabled={isUploading}
              />
            </div>

            {/* File Preview List */}
            {filesToUpload.length > 0 && (
              <div className="mt-4 space-y-2 max-h-48 overflow-y-auto pr-1">
                <p className="text-sm font-medium text-gray-700">
                  Files to upload:
                </p>
                {filesToUpload.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-white border border-gray-200 p-2 rounded shadow-sm"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="flex-shrink-0">
                        {item.preview ? (
                          <img
                            src={item.preview}
                            alt="Preview"
                            className="w-8 h-8 object-cover rounded"
                          />
                        ) : (
                          <div className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded">
                            {getFileTypeIcon(item.file.type)}
                          </div>
                        )}
                      </div>
                      <div className="flex-grow min-w-0">
                        <p
                          className="text-xs font-medium text-gray-800 truncate"
                          title={item.file.name}
                        >
                          {item.file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatBytes(item.file.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      title="Remove file"
                      className="ml-2 flex-shrink-0 text-gray-400 hover:text-red-500 disabled:opacity-50"
                      disabled={isUploading}
                    >
                      <FiXCircle className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Button */}
            {filesToUpload.length > 0 && (
              <div className="mt-4 text-center">
                <button
                  onClick={handleMobileUpload}
                  disabled={isUploading || !batchIdToUploadTo}
                  className={`btn-primary w-full flex items-center justify-center gap-2 ${
                    !batchIdToUploadTo ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {isUploading ? (
                    <>
                      <FiLoader className="animate-spin h-5 w-5" /> Uploading...
                    </>
                  ) : (
                    <>
                      <FiUploadCloud className="h-5 w-5" /> Upload{" "}
                      {filesToUpload.length} File(s)
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Upload Status Message */}
            {uploadStatus.message && (
              <div
                className={`mt-3 text-center p-2 rounded-md text-xs font-medium ${
                  uploadStatus.type === "success"
                    ? "bg-green-100 text-green-700"
                    : uploadStatus.type === "error"
                    ? "bg-red-100 text-red-700"
                    : uploadStatus.type === "loading"
                    ? "bg-orange-100 text-orange-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {uploadStatus.type === "success" && (
                  <FiCheckCircle className="inline mr-1 mb-px w-3 h-3" />
                )}
                {uploadStatus.type === "error" && (
                  <FiAlertCircle className="inline mr-1 mb-px w-3 h-3" />
                )}
                {uploadStatus.type === "loading" && (
                  <FiLoader className="inline animate-spin mr-1 mb-px w-3 h-3" />
                )}
                {uploadStatus.message}
              </div>
            )}
          </div>
          {/* --- END UPLOAD UI --- */}
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