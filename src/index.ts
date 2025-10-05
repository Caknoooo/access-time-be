import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createLogger, format, transports } from 'winston';
import { ScanController } from '@/controllers/ScanController';
import { EmailController } from '@/controllers/EmailController';
import { SampleController } from '@/controllers/SampleController';
import { EmailListenerService } from '@/services/EmailListenerService';

dotenv.config();

// Configure Winston logger
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  defaultMeta: { service: 'access-time-backend' },
  transports: [
    new transports.File({ filename: 'logs/error.log' }),
    new transports.File({ filename: 'logs/combined.log' }),
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    })
  ],
});

// Create logs directory if it doesn't exist
import fs from 'fs';
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

class App {
  public app: express.Application;
  private scanController: ScanController;
  private emailController: EmailController;
  private sampleController: SampleController;
  private emailListenerService: EmailListenerService;

  constructor() {
    this.app = express();
    this.scanController = new ScanController();
    this.emailController = new EmailController();
    this.sampleController = new SampleController();
    this.emailListenerService = new EmailListenerService();
    
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS configuration
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control']
    }));

    // Body parsing middleware
    this.app.use(express.json({ 
      limit: '10mb',
      verify: (req: express.Request, res: express.Response, buf: Buffer) => {
        try {
          JSON.parse(buf.toString());
        } catch (e) {
          logger.error('Invalid JSON payload', { error: e instanceof Error ? e.message : 'Unknown error' });
          throw new Error('Invalid JSON');
        }
      }
    }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging middleware
    this.app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info('HTTP Request', {
          method: req.method,
          url: req.url,
          status: res.statusCode,
          duration: `${duration}ms`,
          userAgent: req.get('User-Agent'),
          ip: req.ip
        });
      });
      next();
    });
  }

  private initializeRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.env.npm_package_version || '1.0.0'
      });
    });

    // Server-Sent Events endpoint for real-time email monitoring
    this.app.get('/api/events', (req, res) => {
      try {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || 'http://localhost:3000',
          'Access-Control-Allow-Credentials': 'true'
        });

        this.emailListenerService.addClient(res);
        logger.info('SSE client connected', { 
          clientCount: this.emailListenerService.getActiveClientsCount() 
        });
      } catch (error) {
        logger.error('SSE connection error', { error: error instanceof Error ? error.message : 'Unknown error' });
        res.status(500).json({ error: 'Failed to establish SSE connection' });
      }
    });

    // API routes
    this.app.post('/api/scan', (req, res) => {
      this.scanController.scanHtml(req, res);
    });

    this.app.get('/api/emails', (req, res) => {
      this.emailController.checkForEmails(req, res);
    });

    this.app.get('/api/test-samples', (req, res) => {
      this.sampleController.getSamples(req, res);
    });

    this.app.post('/api/test-samples', (req, res) => {
      this.sampleController.handleSampleAction(req, res);
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      logger.warn('Route not found', { method: req.method, url: req.originalUrl });
      res.status(404).json({ 
        error: 'Route not found',
        method: req.method,
        url: req.originalUrl
      });
    });
  }

  private initializeErrorHandling(): void {
    // Global error handler
    this.app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('Unhandled error', {
        error: error.message,
        stack: error.stack,
        method: req.method,
        url: req.url,
        body: req.body
      });

      res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
        timestamp: new Date().toISOString()
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection', { reason, promise });
      process.exit(1);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      this.shutdown();
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      this.shutdown();
    });
  }

  private shutdown(): void {
    logger.info('Shutting down server...');
    process.exit(0);
  }

  public listen(): void {
    const port = process.env.PORT || 3001;
    const server = this.app.listen(port, () => {
      logger.info('AccessTime Backend started', {
        port,
        environment: process.env.NODE_ENV || 'development',
        mailhog: `http://${process.env.MAILHOG_HOST}:${process.env.MAILHOG_WEB_PORT}`,
        corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000'
      });
    });

    // Handle server errors
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.syscall !== 'listen') {
        throw error;
      }

      const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

      switch (error.code) {
        case 'EACCES':
          logger.error(`${bind} requires elevated privileges`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          logger.error(`${bind} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });
  }
}

const app = new App();
app.listen();