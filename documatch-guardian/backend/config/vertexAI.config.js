/**
 * Vertex AI Configuration
 * 
 * IMPORTANT: Ensure the Google Cloud Project has the Vertex AI API enabled.
 * You must set the GCLOUD_PROJECT and GCLOUD_LOCATION environment variables
 * or replace the values below.
 */

require('dotenv').config();

module.exports = {
    project: process.env.GCLOUD_PROJECT || "your-project-id",
    location: process.env.GCLOUD_LOCATION || "us-central1",
    model: "gemini-1.5-pro-preview-0409", // Or latest available version
    publisher: "google"
};
