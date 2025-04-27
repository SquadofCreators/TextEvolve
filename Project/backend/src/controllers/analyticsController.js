import prisma from '../config/db.js'; // Import Status enum if needed for filtering
import pkg from '@prisma/client';
const { Status } = pkg;

// Helper function to calculate start date for trend periods
const getStartDateForPeriod = (period = 'month') => {
    const now = new Date();
    const startDate = new Date(now); // Clone current date

    switch (period.toLowerCase()) {
        case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
        case 'year':
            startDate.setFullYear(now.getFullYear() - 1);
            break;
        case 'month':
        default:
            startDate.setMonth(now.getMonth() - 1);
            break;
    }
    startDate.setHours(0, 0, 0, 0); // Start of the day
    return startDate;
};


// @desc    Get summary analytics statistics for the logged-in user
// @route   GET /api/analytics/summary
// @access  Private
export const getAnalyticsSummary = async (req, res, next) => {
    const userId = req.user.id; // Assuming protect middleware adds user

    try {
        // --- Total Batches and Documents ---
        // Use aggregate on Batch model
        const batchStats = await prisma.batch.aggregate({
            where: { userId: userId },
            _count: {
                id: true, // Counts batches
            },
            _sum: {
                totalFileCount: true, // Sums documents across all batches
            },
        });

        // --- Average Accuracy ---
        // Aggregate only on COMPLETED batches that have an accuracy value
        const accuracyStats = await prisma.batch.aggregate({
            where: {
                userId: userId,
                status: Status.COMPLETED,
                accuracy: { not: null }, // Only include batches with accuracy
            },
            _avg: {
                accuracy: true,
            },
            _count: {
                 accuracy: true, // Count how many batches contributed to the average
            }
        });

        // --- Recent Trend (Example: Batches created in last 7 days) ---
        const oneWeekAgo = getStartDateForPeriod('week');
        const twoWeeksAgo = new Date(oneWeekAgo);
        twoWeeksAgo.setDate(oneWeekAgo.getDate() - 7);

        const countLastWeek = await prisma.batch.count({
            where: {
                userId: userId,
                createdAt: { gte: oneWeekAgo },
            },
        });

        const countPreviousWeek = await prisma.batch.count({
             where: {
                 userId: userId,
                 createdAt: { gte: twoWeeksAgo, lt: oneWeekAgo },
             },
        });

        // Calculate trend percentage (handle division by zero)
        let batchTrend = null;
        if (countPreviousWeek > 0) {
             batchTrend = (countLastWeek - countPreviousWeek) / countPreviousWeek;
        } else if (countLastWeek > 0) {
            batchTrend = 1; // Infinite increase if previous was 0 and current > 0
        } else {
            batchTrend = 0; // No change if both are 0
        }


        // --- Assemble Summary Response ---
        const summary = {
            totalBatches: batchStats._count.id || 0,
            totalDocuments: Number(batchStats._sum.totalFileCount || 0), // Convert BigInt sum if needed, ensure number
            averageAccuracy: (accuracyStats._count.accuracy > 0) ? accuracyStats._avg.accuracy : null, // Avoid returning avg if count is 0
            averageDocsPerDay: (batchStats._count.id > 0) ? Math.round(batchStats._sum.totalFileCount / batchStats._count.id) : null,
            // Add more stats as needed (e.g., avg processing time - harder)
            // Trends (add more as needed)
            docsConvertedTrend: batchTrend, // Example trend based on batch count
            // accuracyTrend: ... // Calculate similarly if desired
        };

        res.status(200).json(summary);

    } catch (error) {
        console.error("Error fetching analytics summary:", error);
        next(error); // Pass error to handler
    }
};


// @desc    Get data for conversion trends chart
// @route   GET /api/analytics/trends?period=week|month|year
// @access  Private
export const getAnalyticsTrends = async (req, res, next) => {
    const userId = req.user.id;
    const period = req.query.period || 'month'; // Default to month

    try {
        const startDate = getStartDateForPeriod(period);

        // Fetch batches created since the start date
        const batches = await prisma.batch.findMany({
            where: {
                userId: userId,
                createdAt: { gte: startDate },
            },
            select: {
                createdAt: true,
            },
            orderBy: {
                 createdAt: 'asc' // Order is important for grouping
            }
        });

        // --- Group by date client-side (simpler for cross-db compatibility) ---
        // For very large datasets, a database aggregation ($group in MongoDB) would be better
        const trendsMap = new Map();
        const dateFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit' }; // YYYY-MM-DD format

        batches.forEach(batch => {
             try {
                // Format date as YYYY-MM-DD for consistent grouping keys
                const dateKey = batch.createdAt.toLocaleDateString('sv-SE', dateFormatOptions); // sv-SE locale gives YYYY-MM-DD
                trendsMap.set(dateKey, (trendsMap.get(dateKey) || 0) + 1);
            } catch (e) {
                console.warn("Skipping batch due to invalid date for trends:", batch.createdAt)
            }

        });

        // Convert map to array format expected by frontend chart
        const trendsData = Array.from(trendsMap.entries())
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date)); // Ensure chronological order


        res.status(200).json(trendsData);

    } catch (error) {
        console.error(`Error fetching analytics trends (${period}):`, error);
        next(error);
    }
};

// @desc    Get data for accuracy trends chart
// @route   GET /api/analytics/accuracy-trends?period=week|month|year
// @access  Private
export const getAccuracyTrends = async (req, res, next) => {
    const userId = req.user.id;
    const period = req.query.period || 'month'; // Default to month

    try {
        const startDate = getStartDateForPeriod(period);

        // --- Query Logic ---
        // Fetch COMPLETED batches within the period that have an accuracy score
        const completedBatches = await prisma.batch.findMany({
            where: {
                userId: userId,
                status: Status.COMPLETED,
                accuracy: { not: null }, // Ensure accuracy exists
                updatedAt: { gte: startDate }, // Use updatedAt as completion time? Or createdAt? Choose one.
                                               // Using updatedAt might be better if status changes later.
            },
            select: {
                updatedAt: true, // Or createdAt
                accuracy: true,
            },
             orderBy: {
                 updatedAt: 'asc' // Order by date for easier grouping later
            }
        });

        // --- Group by Date and Calculate Average Accuracy (in Node.js) ---
        // For large datasets, $group aggregation in MongoDB would be more efficient
        const trendsMap = new Map();
        const countsMap = new Map(); // To track count for averaging
        const dateFormatOptions = (period === 'year')
             ? { year: 'numeric', month: 'short' } // Group by month for yearly view
             : { year: 'numeric', month: '2-digit', day: '2-digit' }; // Group by day for week/month view
        const locale = 'sv-SE'; // Use locale that gives YYYY-MM-DD or similar for sorting

        completedBatches.forEach(batch => {
            if (batch.accuracy === null) return; // Skip if accuracy is null somehow

            try {
                // Group key (YYYY-MM-DD or YYYY-MM for year view)
                const dateKey = batch.updatedAt.toLocaleDateString(locale, dateFormatOptions);

                trendsMap.set(dateKey, (trendsMap.get(dateKey) || 0) + batch.accuracy);
                countsMap.set(dateKey, (countsMap.get(dateKey) || 0) + 1);
            } catch (e) {
                 console.warn("Skipping batch due to invalid date for accuracy trends:", batch.updatedAt)
            }
        });

        // Calculate average and format output
        const accuracyTrendsData = Array.from(trendsMap.entries())
            .map(([date, totalAccuracy]) => {
                const count = countsMap.get(date);
                const avgAccuracy = count > 0 ? totalAccuracy / count : 0;
                return {
                    date: date, // Keep date string as key initially for sorting
                    avgAccuracy: avgAccuracy
                 };
            })
            // Ensure proper date sorting before returning
            .sort((a, b) => a.date.localeCompare(b.date))
             // Optionally reformat date string here if needed by chart after sorting
            // .map(item => ({ ...item, date: new Date(item.date).toISOString().split('T')[0] }));


        res.status(200).json(accuracyTrendsData);

    } catch (error) {
        console.error(`Error fetching accuracy trends (${period}):`, error);
        next(error);
    }
};

// @desc    Get distribution of document types for the user
// @route   GET /api/analytics/doc-types
// @access  Private
export const getAnalyticsDocTypes = async (req, res, next) => {
    const userId = req.user.id;

    try {
        // 1. Find all batch IDs for the user
        const userBatches = await prisma.batch.findMany({
            where: { userId: userId },
            select: { id: true }
        });
        const batchIds = userBatches.map(b => b.id);

        if (batchIds.length === 0) {
            return res.status(200).json([]); // No batches, so no doc types
        }

        // 2. Group documents by mimeType for those batches
        // Using Prisma's groupBy
        const docTypeCounts = await prisma.document.groupBy({
            by: ['mimeType'],
            where: {
                batchId: { in: batchIds },
                mimeType: { not: null } // Exclude docs without a mimeType
            },
            _count: {
                id: true // Count documents for each mimeType
            },
             orderBy: {
                 _count: {
                     id: 'desc' // Optional: Order by count descending
                 }
            }
        });

        // 3. (Optional) Simplify mime types into broader categories
        const simplifiedDocTypes = docTypeCounts.reduce((acc, item) => {
             let type = 'Other'; // Default category
             const mime = item.mimeType?.toLowerCase() || '';

             if (mime.includes('pdf')) type = 'PDF';
             else if (mime.startsWith('image/')) type = 'Image'; // Group all images
             else if (mime.includes('word')) type = 'Word'; // Covers doc, docx
             else if (mime.includes('excel') || mime.includes('spreadsheet')) type = 'Excel';
             else if (mime.startsWith('text/')) type = 'Text';
             // Add more specific types if needed (e.g., 'Image (PNG)')

             acc[type] = (acc[type] || 0) + item._count.id;
             return acc;
        }, {});

        // 4. Convert to final array format
        const docTypeData = Object.entries(simplifiedDocTypes)
            .map(([type, count]) => ({ type, count }))
            .sort((a, b) => b.count - a.count); // Order by count


        res.status(200).json(docTypeData);

    } catch (error) {
        console.error("Error fetching document type analytics:", error);
        next(error);
    }
};

// @desc    Get detailed log of documents for the user
// @route   GET /api/analytics/documents-log?page=1&limit=10
// @access  Private
export const getDocumentsLog = async (req, res, next) => {
    const userId = req.user.id;
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    const skip = (page - 1) * limit;
    // Add sorting logic based on req.query.sortBy, req.query.sortOrder

    try {
        const userBatches = await prisma.batch.findMany({ where: { userId }, select: { id: true } });
        const batchIds = userBatches.map(b => b.id);

        if (batchIds.length === 0) { return res.status(200).json({ documents: [], currentPage: 1, totalPages: 0, totalDocuments: 0 }); }

        const documents = await prisma.document.findMany({
             where: { batchId: { in: batchIds } },
             include: { batch: { select: { name: true } } }, // Include batch name
             orderBy: { createdAt: 'desc' }, // Example sort
             skip: skip,
             take: limit,
        });

        const totalDocuments = await prisma.document.count({ where: { batchId: { in: batchIds } } });
        const totalPages = Math.ceil(totalDocuments / limit);

        // Format response (e.g., handle BigInt for fileSize)
        const formattedDocuments = documents.map(doc => ({
            ...doc,
            fileSize: doc.fileSize.toString(), // Convert BigInt to string
            batchName: doc.batch.name
        }));

        res.status(200).json({
             documents: formattedDocuments,
             currentPage: page,
             totalPages: totalPages,
             totalDocuments: totalDocuments
        });

    } catch (error) { next(error); }
}
