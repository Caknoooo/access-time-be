import { Request, Response } from 'express';
import { MailHogService } from '@/services/MailHogService';
import { EmailResponse } from '@/types';

export class EmailController {
  private mailHogService: MailHogService;

  constructor() {
    this.mailHogService = new MailHogService();
  }

  async checkForEmails(req: Request, res: Response): Promise<void> {
    try {
      const emailData = await this.mailHogService.checkForEmails();
      res.json(emailData);
    } catch (error) {
      console.error('Email check error:', error);
      res.status(500).json({ 
        error: `Failed to fetch emails: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  }
}
