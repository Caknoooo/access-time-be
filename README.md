# AccessTime Backend

Backend service untuk Email Accessibility Scanner menggunakan Node.js dan Express.

## Features

- 🔍 Accessibility scanning menggunakan @axe-core/playwright
- 📧 Email listener dengan MailHog integration
- 🧪 Test samples management
- 📊 Detailed accessibility reports
- 🚀 Clean architecture dengan TypeScript

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Update environment variables di `.env`

4. Run development server:
```bash
npm run dev
```

5. Build untuk production:
```bash
npm run build
npm start
```

## API Endpoints

- `GET /health` - Health check
- `POST /api/scan` - Scan HTML untuk accessibility issues
- `GET /api/emails` - Check untuk emails baru di MailHog
- `GET /api/test-samples` - Get list test samples
- `POST /api/test-samples` - Handle sample actions (send/preview)

## Environment Variables

- `PORT` - Server port (default: 3001)
- `MAILHOG_HOST` - MailHog host
- `MAILHOG_WEB_PORT` - MailHog web port
- `MAILHOG_SMTP_PORT` - MailHog SMTP port
- `CORS_ORIGIN` - Frontend URL untuk CORS
- `DEFAULT_FROM_EMAIL` - Default sender email
- `DEFAULT_TO_EMAIL` - Default recipient email
