import { EmailSample } from '@/types';
import fs from 'fs';
import path from 'path';

export class SampleService {
  private samplesPath: string;

  constructor() {
    this.samplesPath = path.join(__dirname, '../../tests/email-samples');
  }

  async loadSamples(): Promise<EmailSample[]> {
    try {
      const indexPath = path.join(__dirname, '../../tests/index.json');
      const indexData = fs.readFileSync(indexPath, 'utf-8');
      const samples = JSON.parse(indexData);
      return samples.emailSamples || [];
    } catch (error) {
      console.error('Error loading samples:', error);
      return [];
    }
  }

  async getSampleContent(sampleId: string): Promise<string> {
    try {
      const samples = await this.loadSamples();
      const sample = samples.find(s => s.id === sampleId);
      
      if (!sample) {
        throw new Error(`Sample with id ${sampleId} not found`);
      }

      const filePath = path.join(this.samplesPath, sample.file);
      return fs.readFileSync(filePath, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to get sample content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async sendSampleToMailHog(sampleId: string): Promise<boolean> {
    try {
      const htmlContent = await this.getSampleContent(sampleId);
      const samples = await this.loadSamples();
      const sample = samples.find(s => s.id === sampleId);
      
      if (!sample) {
        throw new Error(`Sample with id ${sampleId} not found`);
      }

      const nodemailer = require('nodemailer');
      
      const transporter = nodemailer.createTransport({
        host: process.env.MAILHOG_HOST,
        port: Number(process.env.MAILHOG_SMTP_PORT),
        secure: process.env.SMTP_SECURE === 'true',
        ignoreTLS: process.env.SMTP_IGNORE_TLS === 'true',
      });

      await transporter.sendMail({
        from: process.env.DEFAULT_FROM_EMAIL,
        to: process.env.DEFAULT_TO_EMAIL,
        subject: `Test Sample: ${sample.name}`,
        html: htmlContent
      });

      return true;
    } catch (error) {
      console.error('Error sending sample to MailHog:', error);
      return false;
    }
  }
}
