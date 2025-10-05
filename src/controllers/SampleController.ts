import { Request, Response } from 'express';
import { SampleService } from '@/services/SampleService';

export class SampleController {
  private sampleService: SampleService;

  constructor() {
    this.sampleService = new SampleService();
  }

  async getSamples(req: Request, res: Response): Promise<void> {
    try {
      const samples = await this.sampleService.loadSamples();
      res.json({ emailSamples: samples });
    } catch (error) {
      console.error('Get samples error:', error);
      res.status(500).json({ 
        error: `Failed to load samples: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  }

  async getSampleContent(req: Request, res: Response): Promise<void> {
    try {
      const { sampleId } = req.body;
      
      if (!sampleId) {
        res.status(400).json({ error: 'Sample ID is required' });
        return;
      }

      const htmlContent = await this.sampleService.getSampleContent(sampleId);
      res.json({ htmlContent });
    } catch (error) {
      console.error('Get sample content error:', error);
      res.status(500).json({ 
        error: `Failed to get sample content: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  }

  async sendSample(req: Request, res: Response): Promise<void> {
    try {
      const { sampleId } = req.body;
      
      if (!sampleId) {
        res.status(400).json({ error: 'Sample ID is required' });
        return;
      }

      const sent = await this.sampleService.sendSampleToMailHog(sampleId);
      
      if (!sent) {
        res.status(500).json({ error: 'Failed to send sample to MailHog' });
        return;
      }

      res.json({ sent: true });
    } catch (error) {
      console.error('Send sample error:', error);
      res.status(500).json({ 
        error: `Failed to send sample: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  }

  async handleSampleAction(req: Request, res: Response): Promise<void> {
    try {
      const { sampleId, action } = req.body;
      
      if (!sampleId) {
        res.status(400).json({ error: 'Sample ID is required' });
        return;
      }

      if (action === 'send') {
        const sent = await this.sampleService.sendSampleToMailHog(sampleId);
        res.json({ sent });
      } else {
        const htmlContent = await this.sampleService.getSampleContent(sampleId);
        res.json({ htmlContent });
      }
    } catch (error) {
      console.error('Sample action error:', error);
      res.status(500).json({ 
        error: `Failed to process sample action: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  }
}
