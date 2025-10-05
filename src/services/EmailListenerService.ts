import { MailHogService } from './MailHogService';
import { AccessibilityScanner } from './AccessibilityScanner';
import { EmailData } from '@/types';

export interface EmailEvent {
  type: 'email_received' | 'scan_complete' | 'scan_error' | 'status_update';
  data: any;
  timestamp: string;
}

export class EmailListenerService {
  private mailHogService: MailHogService;
  private accessibilityScanner: AccessibilityScanner;
  private clients: Set<any> = new Set();
  private lastEmailId: string | null = null;
  private isPolling: boolean = false;
  private pollingInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.mailHogService = new MailHogService();
    this.accessibilityScanner = new AccessibilityScanner();
  }

  addClient(res: any): void {
    this.clients.add(res);
    
    // Send initial status
    this.sendToClient(res, {
      type: 'status_update',
      data: { status: 'listening', message: 'Email listener active' },
      timestamp: new Date().toISOString()
    });

    // Start polling if not already started
    if (!this.isPolling) {
      this.startPolling();
    }

    // Handle client disconnect
    res.on('close', () => {
      this.clients.delete(res);
      if (this.clients.size === 0) {
        this.stopPolling();
      }
    });
  }

  private startPolling(): void {
    if (this.isPolling) return;
    
    this.isPolling = true;
    console.log('Starting email polling for SSE clients...');
    
    this.pollingInterval = setInterval(async () => {
      try {
        const emailData = await this.mailHogService.checkForEmails();
        
        if (emailData.hasNewEmail && emailData.emailId !== this.lastEmailId) {
          this.lastEmailId = emailData.emailId!;
          
          // Send email received event
          this.broadcast({
            type: 'email_received',
            data: {
              emailId: emailData.emailId,
              subject: emailData.subject,
              hasContent: !!emailData.htmlContent
            },
            timestamp: new Date().toISOString()
          });

          // If email has content, scan it
          if (emailData.htmlContent && emailData.htmlContent.trim().length > 0) {
            try {
              const scanResults = await this.accessibilityScanner.scanHtml({
                html: emailData.htmlContent
              });
              
              this.broadcast({
                type: 'scan_complete',
                data: {
                  emailId: emailData.emailId,
                  subject: emailData.subject,
                  results: scanResults
                },
                timestamp: new Date().toISOString()
              });
            } catch (error) {
              this.broadcast({
                type: 'scan_error',
                data: {
                  emailId: emailData.emailId,
                  error: error instanceof Error ? error.message : 'Unknown error'
                },
                timestamp: new Date().toISOString()
              });
            }
          }
        }
      } catch (error) {
        console.error('Email polling error:', error);
        this.broadcast({
          type: 'scan_error',
          data: {
            error: error instanceof Error ? error.message : 'Unknown error'
          },
          timestamp: new Date().toISOString()
        });
      }
    }, 5000); // Poll every 5 seconds
  }

  private stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.isPolling = false;
    console.log('Stopped email polling - no active clients');
  }

  private sendToClient(res: any, event: EmailEvent): void {
    try {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    } catch (error) {
      console.error('Error sending SSE event:', error);
      this.clients.delete(res);
    }
  }

  private broadcast(event: EmailEvent): void {
    const deadClients: any[] = [];
    
    this.clients.forEach(client => {
      try {
        client.write(`data: ${JSON.stringify(event)}\n\n`);
      } catch (error) {
        deadClients.push(client);
      }
    });

    // Remove dead clients
    deadClients.forEach(client => this.clients.delete(client));
  }

  getActiveClientsCount(): number {
    return this.clients.size;
  }

  isActive(): boolean {
    return this.isPolling;
  }
}
