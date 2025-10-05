import { chromium } from 'playwright';
import { injectAxe, getViolations } from '@axe-core/playwright';
import { ScanResult, ScanRequest } from '@/types';

export class AccessibilityScanner {
  async scanHtml(request: ScanRequest): Promise<ScanResult> {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    try {
      await page.setContent(request.html);
      await injectAxe(page);
      
      const violations = await getViolations(page, null, {
        detailedReport: true,
        include: ['wcag2a', 'wcag2aa', 'wcag21aa']
      });

      const results: ScanResult = {
        violations: violations.map(violation => ({
          id: violation.id,
          impact: violation.impact,
          tags: violation.tags,
          description: violation.description,
          help: violation.help,
          helpUrl: violation.helpUrl,
          nodes: violation.nodes.map(node => ({
            target: node.target,
            html: node.html,
            failureSummary: node.failureSummary
          }))
        })),
        passes: [],
        incomplete: [],
        inapplicable: []
      };

      return results;
    } finally {
      await browser.close();
    }
  }
}
