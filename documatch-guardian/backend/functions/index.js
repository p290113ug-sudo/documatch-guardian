const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const path = require("path");

// Initialize Firebase Admin
// Try to load service account if available locally, otherwise use default credentials (for Cloud)
try {
    const serviceAccount = require("../../config/firebase-admin.json");
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    logger.info("Firebase Admin initialized with service account.");
} catch (e) {
    admin.initializeApp();
    logger.info("Firebase Admin initialized with default credentials.");
}

// Import Tier 1 Functions
const { processInvoice } = require("./tier1-auditor/invoiceProcessor");

// Export Functions
exports.processInvoice = processInvoice;
