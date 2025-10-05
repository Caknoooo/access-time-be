import { chromium } from 'playwright';
import injectAxe from '@axe-core/playwright';
import { ScanResult, ScanRequest } from '@/types';

export class AccessibilityScanner {
  async scanHtml(request: ScanRequest): Promise<ScanResult> {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      await page.setContent(request.html);
      
      const results = await new injectAxe({ page }).analyze();

      return results as ScanResult;
    } catch (error) {
      console.error('Accessibility scan error:', error);
      return {
        violations: [],
        passes: [],
        incomplete: [],
        inapplicable: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      await context.close();
      await browser.close();
    }
  }
}
