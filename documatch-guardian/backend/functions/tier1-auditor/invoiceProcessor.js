const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const vertexAIClient = require("../shared/vertexAIClient");
const cors = require('cors')({ origin: true });

// Tier 1 Extraction Prompt
const TIER1_PROMPT = `
Analyze this invoice PDF and extract the following in JSON format:
{
  "vendor_name": "exact company name",
  "invoice_number": "invoice ID",
  "invoice_amount": 1234.56,
  "invoice_date": "YYYY-MM-DD"
}
Return only valid JSON. If a field is not found, use null.
`;

/**
 * Cloud Function: processInvoice
 * Trigger: HTTP Request
 * Body: { fileBase64: string, mimeType: string }
 */
exports.processInvoice = onRequest((req, res) => {
    cors(req, res, async () => {
        try {
            if (req.method !== 'POST') {
                return res.status(405).send({ error: 'Method Not Allowed' });
            }

            const { fileBase64, mimeType } = req.body;

            if (!fileBase64) {
                return res.status(400).send({ error: 'Missing fileBase64' });
            }

            const buffer = Buffer.from(fileBase64, 'base64');
            const safeMimeType = mimeType || 'application/pdf';

            logger.info("Processing invoice...");

            const data = await vertexAIClient.extractInvoiceData(buffer, safeMimeType, TIER1_PROMPT);

            logger.info("Extraction complete.");
            res.status(200).send({ success: true, data });

        } catch (error) {
            logger.error("Error processing invoice:", error);
            res.status(500).send({ success: false, error: error.message });
        }
    });
});
