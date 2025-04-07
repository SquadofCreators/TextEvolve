// src/utils/formatters.js

// Format bytes (handling string BigInt)
export const formatBytes = (bytes, decimals = 2) => {
    if (bytes === undefined || bytes === null) return 'N/A';
    let numBytes;
    try {
        numBytes = BigInt(bytes);
    } catch (e) {
        // Handle non-integer strings gracefully if necessary
        const parsedNum = parseFloat(bytes);
        if (!isNaN(parsedNum)) {
             // Fallback for potential non-BigInt numbers if API changes
             numBytes = BigInt(Math.round(parsedNum));
        } else {
             return 'Invalid Size';
        }
    }

    if (numBytes === 0n) return '0 Bytes';
    const k = 1024n;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    let i = 0;
    let size = numBytes;
    while (size >= k && i < sizes.length - 1) {
        size /= k;
        i++;
    }
    const numSize = Number(numBytes) / Number(k ** BigInt(i));
    return parseFloat(numSize.toFixed(dm)) + ' ' + sizes[i];
}

// Format ISO date string using locale defaults
export const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    try {
        return new Date(isoString).toLocaleString(undefined, {
            dateStyle: 'medium', timeStyle: 'short'
        });
    } catch (e) {
        return 'Invalid Date';
    }
}