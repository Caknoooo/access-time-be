# AccessTime Backend

Backend service for Email Accessibility Scanner built with Node.js, Express, and @axe-core/playwright.

## Features

- 🔍 **Accessibility Scanning** using @axe-core/playwright
- 📧 **Real-time Email Monitoring** with Server-Sent Events
- 🧪 **Test Samples Management** for various testing scenarios
- 📊 **Detailed Accessibility Reports** with HTML email reports
- 🚀 **Clean Architecture** with TypeScript and best practices
- 🔒 **Security** with Helmet.js and proper CORS
- 📝 **Structured Logging** with Winston

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Accessibility**: @axe-core/playwright
- **Email Testing**: MailHog integration
- **Logging**: Winston with structured logging
- **Security**: Helmet.js
- **Package Manager**: pnpm

## Setup

1. **Install dependencies:**
```bash
pnpm install
```

2. **Copy environment file:**
```bash
cp env.example .env
```

3. **Update environment variables in `.env`:**
```env
NODE_ENV=development
LOG_LEVEL=info
PORT=3001
CORS_ORIGIN=http://localhost:3000
MAILHOG_HOST=localhost
MAILHOG_WEB_PORT=8025
MAILHOG_SMTP_PORT=1025
DEFAULT_FROM_EMAIL=scanner@access-time.com
DEFAULT_TO_EMAIL=test@access-time.com
SMTP_SECURE=false
SMTP_IGNORE_TLS=true
```

4. **Run development server:**
```bash
pnpm dev
```

5. **Build for production:**
```bash
pnpm build
pnpm start
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check with system info |
| GET | `/api/events` | Server-Sent Events for real-time updates |
| POST | `/api/scan` | Scan HTML for accessibility issues |
| GET | `/api/emails` | Check for new emails in MailHog |
| GET | `/api/test-samples` | Get list of test samples |
| POST | `/api/test-samples` | Handle sample actions (send/preview) |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `LOG_LEVEL` | Logging level | `info` |
| `PORT` | Server port | `3001` |
| `CORS_ORIGIN` | Frontend URL for CORS | `http://localhost:3000` |
| `MAILHOG_HOST` | MailHog host | `localhost` |
| `MAILHOG_WEB_PORT` | MailHog web port | `8025` |
| `MAILHOG_SMTP_PORT` | MailHog SMTP port | `1025` |
| `DEFAULT_FROM_EMAIL` | Default sender email | `scanner@access-time.com` |
| `DEFAULT_TO_EMAIL` | Default recipient email | `test@access-time.com` |
| `SMTP_SECURE` | SMTP secure connection | `false` |
| `SMTP_IGNORE_TLS` | Ignore TLS for SMTP | `true` |

## Development

### Scripts

```bash
pnpm dev          # Start development server with hot reload
pnpm build        # Build TypeScript to JavaScript
pnpm start        # Start production server
pnpm test         # Run tests (if available)
```

### Project Structure

```
src/
├── controllers/     # Request handlers
│   ├── EmailController.ts
│   ├── ScanController.ts
│   └── SampleController.ts
├── services/        # Business logic
│   ├── AccessibilityScanner.ts
│   ├── EmailListenerService.ts
│   └── MailHogService.ts
├── types/           # TypeScript definitions
│   └── index.ts
└── index.ts         # Application entry point
```

