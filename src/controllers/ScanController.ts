import { Request, Response } from 'express';
import { AccessibilityScanner } from '@/services/AccessibilityScanner';
import { MailHogService } from '@/services/MailHogService';
import { ScanRequest, ScanResult } from '@/types';

export class ScanController {
  private scanner: AccessibilityScanner;
  private mailHogService: MailHogService;

  constructor() {
    this.scanner = new AccessibilityScanner();
    this.mailHogService = new MailHogService();
  }

  async scanHtml(req: Request, res: Response): Promise<void> {
    try {
      const { html, sendEmail = false }: ScanRequest = req.body;
      
      // Validate input
      if (!html || typeof html !== 'string') {
        res.status(400).json({
          error: 'Invalid request',
          message: 'HTML content is required and must be a string',
          timestamp: new Date().toISOString()
        });
        return;
      }

      if (html.trim().length === 0) {
        res.status(400).json({
          error: 'Invalid request',
          message: 'HTML content cannot be empty',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Check HTML size limit
      if (html.length > 1024 * 1024) { // 1MB limit
        res.status(413).json({
          error: 'Payload too large',
          message: 'HTML content exceeds 1MB limit',
          timestamp: new Date().toISOString()
        });
        return;
      }

      console.log('Starting accessibility scan', {
        htmlLength: html.length,
        sendEmail: sendEmail || false,
        timestamp: new Date().toISOString()
      });

      const startTime = Date.now();
      const results: ScanResult = await this.scanner.scanHtml({ html, sendEmail });
      const duration = Date.now() - startTime;

      console.log('Accessibility scan completed', {
        duration: `${duration}ms`,
        violationsCount: results.violations?.length || 0,
        passesCount: results.passes?.length || 0,
        incompleteCount: results.incomplete?.length || 0,
        inapplicableCount: results.inapplicable?.length || 0
      });

      if (sendEmail) {
        try {
          await this.sendReportEmail(results, html);
          console.log('Report email sent successfully');
        } catch (emailError) {
          console.error('Failed to send report email:', emailError);
          // Don't fail the request if email sending fails
        }
      }

      res.json({
        ...results,
        metadata: {
          scanDuration: duration,
          timestamp: new Date().toISOString(),
          htmlLength: html.length,
          emailSent: sendEmail
        }
      });
    } catch (error) {
      console.error('Scan controller error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const statusCode = errorMessage.includes('timeout') ? 408 : 500;

      res.status(statusCode).json({
        error: 'Scan failed',
        message: errorMessage,
        timestamp: new Date().toISOString()
      });
    }
  }

  private async sendReportEmail(results: ScanResult, originalHtml: string): Promise<void> {
    const timestamp = new Date().toISOString();
    const violationsCount = results.violations?.length || 0;
    const passesCount = results.passes?.length || 0;
    const incompleteCount = results.incomplete?.length || 0;
    const inapplicableCount = results.inapplicable?.length || 0;

    const htmlReport = this.generateHtmlReport(results, originalHtml, timestamp);
    
    await this.mailHogService.sendEmail(
      process.env.DEFAULT_TO_EMAIL!,
      `Accessibility Scan Report - ${violationsCount} Issues Found`,
      htmlReport
    );
  }

  private generateHtmlReport(results: ScanResult, originalHtml: string, timestamp: string): string {
    const violationsCount = results.violations?.length || 0;
    const passesCount = results.passes?.length || 0;
    const incompleteCount = results.incomplete?.length || 0;
    const inapplicableCount = results.inapplicable?.length || 0;

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Accessibility Scan Report</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; 
          line-height: 1.6; 
          color: #333; 
          max-width: 800px; 
          margin: 0 auto; 
          padding: 20px; 
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
          margin-bottom: 30px;
        }
        .summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 15px;
          margin-bottom: 30px;
        }
        .stat-card {
          padding: 15px;
          border-radius: 8px;
          text-align: center;
          color: white;
          font-weight: bold;
        }
        .violations { background: #ef4444; }
        .passes { background: #10b981; }
        .incomplete { background: #f59e0b; }
        .inapplicable { background: #6b7280; }
        .violation-item {
          background: #fee2e2;
          border-left: 4px solid #ef4444;
          padding: 15px;
          margin-bottom: 10px;
          border-radius: 4px;
        }
        .pass-item {
          background: #d1fae5;
          border-left: 4px solid #10b981;
          padding: 15px;
          margin-bottom: 10px;
          border-radius: 4px;
        }
        .code {
          background: #f3f4f6;
          padding: 10px;
          border-radius: 4px;
          font-family: Monaco, monospace;
          font-size: 12px;
          margin: 10px 0;
          overflow-x: auto;
        }
        .section {
          margin-bottom: 30px;
        }
        h3 { color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🔍 Accessibility Scan Report</h1>
        <p>Generated on ${timestamp}</p>
      </div>
      <div class="summary">
        <div class="stat-card violations">
          <div style="font-size: 24px;">${violationsCount}</div>
          <div>Violations</div>
        </div>
        <div class="stat-card passes">
          <div style="font-size: 24px;">${passesCount}</div>
          <div>Passes</div>
        </div>
        <div class="stat-card incomplete">
          <div style="font-size: 24px;">${incompleteCount}</div>
          <div>Incomplete</div>
        </div>
        <div class="stat-card inapplicable">
          <div style="font-size: 24px;">${inapplicableCount}</div>
          <div>Inapplicable</div>
        </div>
      </div>
      ${violationsCount > 0 ? `
      <div class="section">
        <h3>🚨 Accessibility Violations</h3>
        ${results.violations.map((violation, index) => `
          <div class="violation-item">
            <strong>${violation.id}</strong> - ${violation.description}<br>
            <small>Impact: ${violation.impact}</small>
            ${violation.nodes ? violation.nodes.filter(node => node.failureSummary).map(node => `
              <div class="code">${node.failureSummary}</div>
            `).join('') : ''}
          </div>
        `).join('')}
      </div>
      ` : ''}
      ${passesCount > 0 ? `
      <div class="section">
        <h3>✅ Passed Tests</h3>
        ${results.passes.map((pass, index) => `
          <div class="pass-item">
            <strong>${pass.id}</strong> - ${pass.description}<br>
            <small>Target: ${pass.nodes ? pass.nodes.map(node => node.target?.join(', ') || 'N/A').join(', ') : 'N/A'}</small>
          </div>
        `).join('')}
      </div>
      ` : ''}
      ${incompleteCount > 0 ? `
      <div class="section">
        <h3>⚠️ Incomplete Tests</h3>
        ${results.incomplete.map((incomplete) => `
          <div class="violation-item">
            <strong>${incomplete.id}</strong> - ${incomplete.description}<br>
            <small>Requires manual review</small>
          </div>
        `).join('')}
      </div>
      ` : ''}
      <div class="section">
        <h3>📊 Raw JSON Report</h3>
        <div class="code">${JSON.stringify(results, null, 2)}</div>
      </div>
      <div class="section">
        <h3>📄 Original HTML</h3>
        <div class="code">${originalHtml.substring(0, 500)}${originalHtml.length > 500 ? '...' : ''}</div>
      </div>
      <footer style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280;">
        <p>Generated by AccessTime Email Accessibility Scanner</p>
      </footer>
    </body>
    </html>
    `;
  }
}
