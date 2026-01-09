const { VertexAI } = require('@google-cloud/vertexai');
const config = require('../../config/vertexAI.config');
const logger = require("firebase-functions/logger");

class VertexAIClient {
    constructor() {
        this.vertexAI = new VertexAI({
            project: config.project,
            location: config.location,
        });
        this.model = this.vertexAI.preview.getGenerativeModel({
            model: config.model,
            generation_config: {
                "max_output_tokens": 8192,
                "temperature": 0.1,
                "top_p": 0.95,
            },
        });
    }

    /**
     * Extracts data from a PDF invoice using a specific prompt.
     * @param {Buffer} pdfBuffer - The raw PDF file buffer.
     * @param {string} mimeType - Mime type of the file (application/pdf).
     * @param {string} promptText - The prompt instructions for Gemini.
     * @returns {Promise<Object>} - The parsed JSON result.
     */
    async extractInvoiceData(pdfBuffer, mimeType, promptText) {
        try {
            logger.info("Sending request to Vertex AI Gemini 1.5 Pro...");

            const request = {
                contents: [{
                    role: 'user',
                    parts: [
                        {
                            inline_data: {
                                mime_type: mimeType,
                                data: pdfBuffer.toString('base64')
                            }
                        },
                        { text: promptText }
                    ]
                }],
            };

            const result = await this.model.generateContent(request);
            const response = await result.response;
            const text = response.candidates[0].content.parts[0].text;

            logger.info("Received response from Vertex AI.");

            // Clean up markdown code blocks if present ( ```json ... ``` )
            const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();

            return JSON.parse(cleanedText);
        } catch (error) {
            logger.error("Vertex AI Extraction Error:", error);
            throw new Error(`Vertex AI Extraction Failed: ${error.message}`);
        }
    }
}

module.exports = new VertexAIClient();
