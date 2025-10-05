import axios from 'axios';
import { EmailData } from '@/types';

export class MailHogService {
  private readonly apiUrl: string;

  constructor() {
    console.log('MailHog Config:', {
      host: process.env.MAILHOG_HOST,
      webPort: process.env.MAILHOG_WEB_PORT,
      smtpPort: process.env.MAILHOG_SMTP_PORT
    });
    this.apiUrl = `http://${process.env.MAILHOG_HOST}:${process.env.MAILHOG_WEB_PORT}/api/v2`;
  }

  async checkForEmails(): Promise<EmailData> {
    try {
      const response = await axios.get(`${this.apiUrl}/messages`);
      const messages = response.data.items || [];
      
      if (messages.length === 0) {
        return { hasNewEmail: false };
      }
      
      const latestEmail = messages[0];
      
      let htmlContent = '';
      
      if (latestEmail.MIME && latestEmail.MIME.Parts) {
        const htmlPart = latestEmail.MIME.Parts.find((part: any) => {
          const contentType = part.Headers && part.Headers['Content-Type'] ? part.Headers['Content-Type'][0] : '';
          return contentType.includes('text/html');
        });
        
        if (htmlPart) {
          htmlContent = htmlPart.Body || '';
        }
      }
      
      if (!htmlContent && latestEmail.Body) {
        htmlContent = latestEmail.Body;
      }
      
      if (!htmlContent && latestEmail.Content && latestEmail.Content.Body) {
        htmlContent = latestEmail.Content.Body;
      }
      
      htmlContent = htmlContent
        .replace(/\\r\\n/g, '\n')
        .replace(/\\n/g, '\n')
        .replace(/\\"/g, '"')
        .replace(/\\t/g, '\t');
      
      if (!htmlContent || htmlContent.trim().length === 0) {
        let textContent = '';
        if (latestEmail.MIME && latestEmail.MIME.Parts) {
          const textPart = latestEmail.MIME.Parts.find((part: any) => {
            const contentType = part.Headers && part.Headers['Content-Type'] ? part.Headers['Content-Type'][0] : '';
            return contentType.includes('text/plain');
          });
          if (textPart) {
            textContent = textPart.Body || '';
          }
        }
        
        if (!textContent && latestEmail.Content && latestEmail.Content.Body) {
          textContent = latestEmail.Content.Body;
        }
        
        if (textContent) {
          htmlContent = `<html><body><pre>${textContent.replace(/\n/g, '<br>')}</pre></body></html>`;
        } else {
          return {
            hasNewEmail: true,
            emailId: latestEmail.ID,
            htmlContent: '',
            subject: latestEmail.Content?.Headers?.Subject?.[0] || 'Test Email'
          };
        }
      }
      
      return {
        hasNewEmail: true,
        emailId: latestEmail.ID,
        htmlContent,
        subject: latestEmail.Content?.Headers?.Subject?.[0] || 'Test Email'
      };
    } catch (error) {
      throw new Error(`Failed to fetch emails: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      const nodemailer = require('nodemailer');
      
      const transporter = nodemailer.createTransport({
        host: process.env.MAILHOG_HOST,
        port: Number(process.env.MAILHOG_SMTP_PORT),
        secure: process.env.SMTP_SECURE === 'true',
        ignoreTLS: process.env.SMTP_IGNORE_TLS === 'true',
      });

      await transporter.sendMail({
        from: process.env.DEFAULT_FROM_EMAIL,
        to,
        subject,
        html
      });
    } catch (error) {
      throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

