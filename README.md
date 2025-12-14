# Rewrite Your Resume

A React Native application that allows users to upload their resume, add desired keywords and instructions, and submit the information to a webhook endpoint.

## Features

- 📄 Resume file upload (PDF, DOC, DOCX)
- 🏷️ Keywords input (comma-separated)
- 📝 Optional instructions field
- 🔗 Webhook integration with session ID management
- 💾 Persistent session ID storage

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the Expo development server:
```bash
npm start
```

3. Run on iOS simulator:
```bash
npm run ios
```

4. Run on Android emulator:
```bash
npm run android
```

## Usage

1. **Upload Resume**: Tap "Choose Resume File" to select your resume (PDF, DOC, or DOCX)
2. **Add Keywords**: Enter desired keywords separated by commas
3. **Add Instructions** (optional): Include any specific requirements or instructions
4. **Submit**: Tap the "Submit" button to send all information to the webhook

## Technical Details

- **Framework**: React Native with Expo
- **UI Library**: React Native Paper
- **File Picker**: expo-document-picker
- **Session Management**: AsyncStorage for persistent session IDs
- **Webhook URL**: `https://primary-production-da3f.up.railway.app/webhook-test/7eab2e1f-99b9-42ee-ab90-480548527e58`

## Data Format

The app sends the following JSON payload to the webhook:

```json
{
  "sessionId": "uuid-string",
  "resume": {
    "name": "filename.pdf",
    "size": 12345,
    "mimeType": "application/pdf",
    "data": "base64-encoded-file-content"
  },
  "keywords": "keyword1, keyword2, keyword3",
  "instructions": "user instructions"
}
```

## Requirements

- Node.js 16+ 
- Expo CLI (installed globally or via npx)
- iOS Simulator (for iOS testing) or Android Emulator (for Android testing)

