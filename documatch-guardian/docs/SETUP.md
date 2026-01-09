# Development Setup Guide

## Prerequisites
- Node.js (v18 or later)
- npm or yarn
- Firebase CLI (`npm install -g firebase-tools`)
- Google Cloud SDK (optional, for advanced management)
- Visual Studio Code (recommended)

## Initial Setup

1. **Clone the Repository**
   ```bash
   git clone <repository_url>
   cd documatch-guardian
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend/functions
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd frontend
   npm install
   ```

## Firebase Configuration

1. **Login to Firebase**
   ```bash
   firebase login
   ```

2. **Select Project**
   ```bash
   firebase use <project-id>
   ```

3. **Service Account Key**
   - Place `firebase-admin.json` in `backend/config/`.
   - **IMPORTANT**: Do not commit this file! Ensure it is in `.gitignore`.

4. **Environment Variables**
   - Create `.env` in `backend/functions` based on `.env.example`.
   - Set up Vertex AI credentials.

## Running Locally

### Backend (Functions)
```bash
cd backend/functions
npm run serve
```
This typically runs the Firebase Emulator Suite.

### Frontend
```bash
cd frontend
npm start
```

## Vertex AI Setup
Ensure the Google Cloud Project has the Vertex AI API enabled.
Verify strictly that the region in `vertexAI.config.js` matches your GCP project settings.
