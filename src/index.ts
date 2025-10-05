import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { ScanController } from '@/controllers/ScanController';
import { EmailController } from '@/controllers/EmailController';
import { SampleController } from '@/controllers/SampleController';

dotenv.config();

class App {
  public app: express.Application;
  private scanController: ScanController;
  private emailController: EmailController;
  private sampleController: SampleController;

  constructor() {
    this.app = express();
    this.scanController = new ScanController();
    this.emailController = new EmailController();
    this.sampleController = new SampleController();
    
    this.initializeMiddlewares();
    this.initializeRoutes();
  }

  private initializeMiddlewares(): void {
    this.app.use(helmet());
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true
    }));
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
  }

  private initializeRoutes(): void {
    this.app.get('/health', (req, res) => {
      res.json({ status: 'OK', timestamp: new Date().toISOString() });
    });

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
  }

  public listen(): void {
    const port = process.env.PORT || 3001;
    this.app.listen(port, () => {
      console.log(`🚀 AccessTime Backend running on port ${port}`);
      console.log(`📧 MailHog: http://${process.env.MAILHOG_HOST}:${process.env.MAILHOG_WEB_PORT}`);
      console.log(`🌐 CORS Origin: ${process.env.CORS_ORIGIN}`);
    });
  }
}

const app = new App();
app.listen();
