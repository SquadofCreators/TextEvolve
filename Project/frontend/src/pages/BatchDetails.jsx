// src/pages/BatchDetails.jsx

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { batchService } from '../services/batchService';
import PageHeader from "../components/utility/PageHeader";
import PreviewModal from "../components/utility/PreviewModal";
import ConfirmationModal from "../components/utility/ConfirmationModal";
import SingleDocCard from "../components/SingleDocCard";
import MetaText from "../components/utility/MetaText";
import { ocrProviders } from "../data/OcrFilters"; // This now contains richer data

// Icons
import { IoArrowForward, IoImageOutline, IoSparklesOutline, IoInformationCircleOutline } from "react-icons/io5"; // Added IoInformationCircleOutline
import { LuCalendarDays, LuCalendarClock } from "react-icons/lu";
import { GrStorage } from "react-icons/gr";
import { MdFolderOpen, MdOutlineInfo, MdVerified, MdScience } from "react-icons/md"; // Added MdVerified, MdScience
import { FaHashtag } from "react-icons/fa6";
import { FiLoader, FiAlertTriangle } from 'react-icons/fi';
import { VscServerProcess } from "react-icons/vsc";

const formatBytes = (bytes, decimals = 2) => {
    if (typeof bytes === 'string') {
        try { bytes = BigInt(bytes); } catch (e) { return 'N/A'; }
    }
    if (bytes === undefined || bytes === null || bytes < 0n) return 'N/A';
    if (bytes === 0n) return '0 Bytes';
    const k = 1024n;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    let i = 0;
    let size = bytes;
    while (size >= k && i < sizes.length - 1) {
        size /= k;
        i++;
    }
    const numSize = Number(bytes) / Number(k ** BigInt(i));
    return parseFloat(numSize.toFixed(dm)) + ' ' + sizes[i];
}

const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    try {
        return new Date(isoString).toLocaleString(undefined, {
            dateStyle: 'medium', timeStyle: 'short'
        });
    } catch (e) { return 'Invalid Date'; }
}

const BatchDetails = () => {
    const { batchId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [batch, setBatch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [previewModalDoc, setPreviewModalDoc] = useState(null);
    const [confirmDoc, setConfirmDoc] = useState(null);
    const [selectedOcrProvider, setSelectedOcrProvider] = useState(ocrProviders[0]?.value || 'google');
    const [extractionSource, setExtractionSource] = useState('original');

    const fetchBatch = useCallback(async (showLoading = true) => {
        if (!batchId) {
            setError("No Batch ID provided."); setLoading(false); return;
        }
        if (showLoading) setLoading(true);
        setError("");
        try {
            const data = await batchService.getBatchById(batchId);
            setBatch(data);
            // Set default OCR provider to 'textevolve_v1' if available, otherwise the first one
            const textEvolveProvider = ocrProviders.find(p => p.value === 'textevolve_v1');
            if (textEvolveProvider) {
                setSelectedOcrProvider('textevolve_v1');
            } else if (ocrProviders.length > 0) {
                setSelectedOcrProvider(ocrProviders[0].value);
            }

            if (location.state?.message && showLoading) {
                navigate(location.pathname, { replace: true, state: {} });
            }
        } catch (err) {
            let specificError = err.message || "Failed to load batch details.";
            if (err.status === 404) specificError = `Batch with ID ${batchId} not found.`;
            else if (err.status === 401 || err.status === 403) specificError = "You are not authorized to view this batch.";
            setError(specificError);
            setBatch(null);
        } finally {
            if (showLoading) setLoading(false);
        }
    }, [batchId, navigate, location]);

    useEffect(() => {
        fetchBatch();
    }, [fetchBatch]);

    const handleImageEnhanced = useCallback((enhancedDocId, newEnhancedStorageKey) => {
        setBatch(prevBatch => {
            if (!prevBatch) return null;
            const updatedDocuments = prevBatch.documents.map(doc =>
                doc.id === enhancedDocId
                    ? { ...doc, enhancedStorageKey: newEnhancedStorageKey, updatedAt: new Date().toISOString() }
                    : doc
            );
            if (previewModalDoc && previewModalDoc.id === enhancedDocId) {
                setPreviewModalDoc(prev => prev ? ({ ...prev, enhancedStorageKey: newEnhancedStorageKey, updatedAt: new Date().toISOString() }) : null);
            }
            return { ...prevBatch, documents: updatedDocuments, updatedAt: new Date().toISOString() };
        });
    }, [previewModalDoc]);

    const openPreviewOrEnhanceModal = useCallback((doc) => {
        if (!batch || !doc || !doc.storageKey) {
            setError("Cannot preview/enhance document: Essential data is missing."); return;
        }
        setPreviewModalDoc({ ...doc, batchId: batch.id, batchName: batch.name });
    }, [batch]);

    const requestDeleteDocument = (doc) => setConfirmDoc(doc);
    const handleCancelDelete = () => setConfirmDoc(null);

    const handleConfirmDelete = useCallback(async () => {
        if (!confirmDoc || !batch) return;
        try {
            await batchService.deleteDocument(batch.id, confirmDoc.id);
            fetchBatch(false); 
            setError("");
        } catch (err) {
            setError(`Failed to delete document: ${err.message || 'Unknown error'}`);
        } finally {
            setConfirmDoc(null);
        }
    }, [confirmDoc, batch, fetchBatch]);

    const handleTextExtraction = useCallback((doc) => {
        if (!batch || !doc) return;
        const isImage = doc.mimeType?.startsWith('image/') || /\.(jpe?g|png|gif|bmp|webp|svg)$/i.test(doc.fileName || '');
        if (!isImage) {
            setError(`Extraction only for images. '${doc.fileName}' is not an image.`);
            setTimeout(() => setError(""), 3000);
            return;
        }

        const isEnhancedSourceSelected = extractionSource === 'enhanced';
        let targetUrl = doc.storageKey;
        let sourceUsed = 'original';

        if (isEnhancedSourceSelected) {
            if (doc.enhancedStorageKey && doc.enhancedStorageKey.trim() !== "") {
                targetUrl = doc.enhancedStorageKey;
                sourceUsed = 'enhanced';
            } else {
                console.warn(`[BatchDetails] Single Extract: Enhanced source selected for Doc ${doc.id}, but no enhanced key. Falling back to original.`);
            }
        }

        if (!targetUrl || targetUrl.trim() === "") {
            setError(`No valid image URL for '${doc.fileName}' (source: ${sourceUsed}).`); return;
        }
        
        const documentToProcess = { 
            url: targetUrl, 
            docId: doc.id, 
            sourceUsed: sourceUsed,
            fileName: doc.fileName
        };

        navigate(`/extract-text/${batch.id}`, {
            state: {
                ocrProvider: selectedOcrProvider,
                documentsToProcess: [documentToProcess],
                batchName: batch.name || `Batch ${batch.id}`,
            }
        });
    }, [batch, selectedOcrProvider, navigate, extractionSource]);

    const handleExtractAll = useCallback(() => {
        if (!batch || !batch.documents || batch.documents.length === 0) {
            setError("No documents to extract text."); return;
        };

        let consideredImageCount = 0;
        const documentsToProcess = batch.documents
            .map(doc => {
                const isImage = doc.mimeType?.startsWith('image/') || /\.(jpe?g|png|gif|bmp|webp|svg)$/i.test(doc.fileName || '');
                if (!isImage) return null;
                consideredImageCount++;

                const isEnhancedSourceSelected = extractionSource === 'enhanced';
                let targetUrl = doc.storageKey;
                let sourceUsed = 'original';

                if (isEnhancedSourceSelected) {
                    if (doc.enhancedStorageKey && doc.enhancedStorageKey.trim() !== "") {
                        targetUrl = doc.enhancedStorageKey;
                        sourceUsed = 'enhanced';
                    } else {
                        console.warn(`[BatchDetails] Extract All: Enhanced selected for ${doc.fileName}, but no key. Falling back to original.`);
                    }
                }
                
                if (!targetUrl || targetUrl.trim() === "") {
                    console.warn(`[BatchDetails] Extract All: Skipping ${doc.fileName}, no valid URL for source '${sourceUsed}'.`);
                    return null;
                }
                return { url: targetUrl, docId: doc.id, sourceUsed: sourceUsed, fileName: doc.fileName };
            })
            .filter(item => item !== null);

        if (documentsToProcess.length === 0) {
            setError(`No image documents with valid URLs found for selected source ('${extractionSource}') out of ${consideredImageCount} image(s).`);
            return;
        }
        
        navigate(`/extract-text/${batch.id}`, {
            state: {
                ocrProvider: selectedOcrProvider,
                documentsToProcess: documentsToProcess,
                batchName: batch.name || `Batch ${batch.id}`,
            }
        });
    }, [batch, selectedOcrProvider, navigate, extractionSource]);

    const hasAnyEnhancedDocument = useMemo(() => {
        return batch?.documents?.some(doc => 
            (doc.mimeType?.startsWith('image/') || /\.(jpe?g|png|gif|bmp|webp|svg)$/i.test(doc.fileName || '')) 
            && !!doc.enhancedStorageKey && doc.enhancedStorageKey.trim() !== ""
        ) || false;
    }, [batch]);

    // ✨ Get details of the currently selected OCR provider ✨
    const selectedProviderDetails = useMemo(() => {
        return ocrProviders.find(p => p.value === selectedOcrProvider);
    }, [selectedOcrProvider]);


    if (loading) { return ( <div className="flex flex-col justify-center items-center h-screen text-center p-4"> <FiLoader className="animate-spin h-10 w-10 text-orange-500 mb-4" /> <p className="text-slate-500 dark:text-slate-400">Loading batch details...</p> </div> ); }
    if (error && !batch) { return ( <div className="flex flex-col justify-center items-center h-screen text-center p-4"> <FiAlertTriangle className="h-12 w-12 text-red-500 mb-4" /> <p className="text-red-600 dark:text-red-400 font-semibold mb-2">Error Loading Batch</p> <p className="text-slate-600 dark:text-slate-400 mb-6">{error}</p> <button onClick={() => navigate("/")} className="px-5 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"> Back to Home </button> </div> ); }
    if (!batch) { return ( <div className="flex justify-center items-center h-screen"> <p className="text-slate-500 dark:text-slate-400">Batch data could not be loaded or was not found.</p> </div> ); }

    return (
        <div className="flex-1 h-full px-3 py-6 md:p-6 overflow-y-auto bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
            <PageHeader title="Batch Details" showBackArrow={true}/>

            {/* Non-critical error display (if batch data is loaded) */}
            {error && batch && (
                <div className="my-4 p-3 rounded-md bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-600 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
                    <FiAlertTriangle className="h-5 w-5" />
                    <span>{error}</span>
                </div>
            )}

            <div className="p-4 md:p-6 mb-6 bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700">
                <h2 className="text-2xl md:text-3xl font-semibold text-slate-800 dark:text-slate-100 mb-4 break-words">
                    {batch.name || `Batch ${batch.id}`}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                    <MetaText icon={<FaHashtag />} title="Batch ID" value={batch.id} textSize="xs" canCopy={true} />
                    <MetaText icon={<LuCalendarDays />} title="Created On" value={formatDate(batch.createdAt)} textSize="sm"/>
                    <MetaText icon={<LuCalendarClock />} title="Last Modified" value={formatDate(batch.updatedAt)} textSize="sm"/>
                    <MetaText icon={<MdFolderOpen />} title="Total Files" value={`${batch.totalFileCount ?? (batch.documents?.length ?? 0)} File(s)`} textSize="sm"/>
                    <MetaText icon={<GrStorage />} title="Total Size" value={formatBytes(batch.totalFileSize)} textSize="sm"/>
                    <MetaText icon={<MdOutlineInfo />} title="Status" value={batch.status || 'N/A'} textSize="sm"/>
                </div>
            </div>

            <div className="p-4 md:p-6 bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4">
                    <h2 className="text-xl md:text-2xl font-semibold text-slate-800 dark:text-slate-100">
                        Documents ({batch.documents?.length ?? 0})
                    </h2>
                    {batch.documents && batch.documents.length > 0 && (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                            <div className="flex-grow sm:flex-grow-0">
                                <label htmlFor="ocrProvider" className="sr-only">OCR Provider</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <VscServerProcess className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <select 
                                        id="ocrProvider" 
                                        value={selectedOcrProvider} 
                                        onChange={(e) => setSelectedOcrProvider(e.target.value)} 
                                        className="block w-full appearance-none rounded-md border border-slate-300 bg-white py-2 pl-10 pr-8 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:border-blue-500"
                                    >
                                        {/* ✨ Modified option display ✨ */}
                                        {ocrProviders.map(provider => (
                                            <option key={provider.value} value={provider.value}>
                                                {provider.label} {provider.isBeta ? '🧪' : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="relative w-full sm:w-auto flex-grow sm:flex-grow-0">
                                <label htmlFor="extractionSource" className="sr-only">Image Source</label>
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    {extractionSource === 'original' ? <IoImageOutline className="w-4 h-4 text-slate-400" /> : <IoSparklesOutline className="w-4 h-4 text-purple-400" />}
                                </div>
                                <select id="extractionSource" value={extractionSource} onChange={(e) => setExtractionSource(e.target.value)} className="block w-full appearance-none rounded-md border border-slate-300 bg-white py-2 pl-10 pr-8 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:border-blue-500">
                                    <option value="original">Original Image</option>
                                    <option value="enhanced" disabled={!hasAnyEnhancedDocument}>
                                        Enhanced Image {hasAnyEnhancedDocument ? '' : '(None in batch)'}
                                    </option>
                                </select>
                            </div>
                            <button 
                                type="button" 
                                onClick={handleExtractAll} 
                                disabled={!batch.documents || batch.documents.length === 0} 
                                className={`w-full sm:w-auto flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors ${(!batch.documents || batch.documents.length === 0) ? 'bg-slate-400 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600'}`}
                            >
                                Extract Text from All <IoArrowForward />
                            </button>
                        </div>
                    )}
                </div>

                {/* ✨ New Section: Display details for the selected OCR provider ✨ */}
                {selectedProviderDetails && batch.documents && batch.documents.length > 0 && (
                    <div 
                        className={`mb-6 p-3 rounded-md text-xs border transition-all duration-300
                                    ${selectedProviderDetails.isBeta 
                                        ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-400 dark:border-amber-700 text-amber-700 dark:text-amber-300' 
                                        : 'bg-sky-50 dark:bg-sky-900/30 border-sky-300 dark:border-sky-600 text-sky-700 dark:text-sky-300'}`}
                    >
                        <div className="flex items-center gap-2 font-semibold text-sm mb-1">
                            {selectedProviderDetails.isBeta ? 
                                <MdScience className="w-4 h-4 text-amber-600 dark:text-amber-400" /> : 
                                <MdVerified className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                            }
                            <span>{selectedProviderDetails.label} - <span className={selectedProviderDetails.isBeta ? "font-normal" : "font-normal"}>{selectedProviderDetails.details}</span></span>
                        </div>
                        <p className="pl-1 text-slate-600 dark:text-slate-300">{selectedProviderDetails.description}</p>
                    </div>
                )}
                {/* ✨ End New Section ✨ */}

                {batch.documents && batch.documents.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                        {batch.documents.map((doc) => {
                            const isImage = doc.mimeType?.startsWith('image/') || /\.(jpe?g|png|gif|bmp|webp|svg)$/i.test(doc.fileName || '');
                            return (
                                <SingleDocCard
                                    key={doc.id}
                                    doc={doc}
                                    batchId={batch.id}
                                    onPreview={() => openPreviewOrEnhanceModal(doc)}
                                    onDelete={() => requestDeleteDocument(doc)}
                                    onExtract={() => handleTextExtraction(doc)}
                                    formatBytes={formatBytes}
                                    formatDate={formatDate}
                                    isImage={isImage} 
                                    hasEnhancedVersion={!!doc.enhancedStorageKey && doc.enhancedStorageKey.trim() !== ""}
                                />
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-10 text-slate-500 dark:text-slate-400">
                        <IoImageOutline className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                        No documents found in this batch.
                    </div>
                )}
            </div>

            {previewModalDoc && (
                <PreviewModal
                    isOpen={!!previewModalDoc}
                    onClose={() => {
                        setPreviewModalDoc(null);
                    }}
                    file={previewModalDoc} 
                    currentPage={0} totalPages={1} onPrev={() => {}} onNext={() => {}} 
                    filesList={batch.documents?.filter(d => d.mimeType?.startsWith('image/')) || []} 
                    showDownloadAll={ (batch.documents?.filter(d => d.mimeType?.startsWith('image/'))?.length || 0) > 1}
                    onEnhancementComplete={handleImageEnhanced}
                />
            )}

            {confirmDoc && (
                 <ConfirmationModal
                    isOpen={!!confirmDoc}
                    onClose={handleCancelDelete}
                    onConfirm={handleConfirmDelete}
                    title={`Delete Document: ${confirmDoc.fileName}?`}
                    message="Are you sure you want to delete this document? This action cannot be undone."
                    confirmText="Delete"
                    icon={<FiAlertTriangle className="text-red-500" />}
                 />
            )}
        </div>
    );
};

export default BatchDetails;