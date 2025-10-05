import { chromium } from 'playwright';
import { ScanResult, ScanRequest } from '@/types';

export class AccessibilityScanner {
  async scanHtml(request: ScanRequest): Promise<ScanResult> {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    try {
      await page.setContent(request.html);
      
      const results = await page.evaluate(() => {
        const violations: any[] = [];
        const passes: any[] = [];
        const incomplete: any[] = [];
        const inapplicable: any[] = [];

        const images = document.querySelectorAll('img');
        images.forEach((img: Element, index: number) => {
          const imgElement = img as HTMLImageElement;
          if (!imgElement.alt || imgElement.alt.trim() === '') {
            violations.push({
              id: 'image-alt',
              impact: 'critical',
              tags: ['cat.text-alternatives', 'wcag2a', 'wcag111'],
              description: 'Ensures images have alternate text',
              help: 'Images must have alternate text',
              helpUrl: 'https://dequeuniversity.com/rules/axe/4.0/image-alt',
              nodes: [{
                target: [`img[${index}]`],
                html: imgElement.outerHTML,
                failureSummary: 'Image missing alt text'
              }]
            });
          } else {
            passes.push({
              id: 'image-alt',
              impact: null,
              tags: ['cat.text-alternatives', 'wcag2a', 'wcag111'],
              description: 'Ensures images have alternate text',
              nodes: [{
                target: [`img[${index}]`],
                html: imgElement.outerHTML
              }]
            });
          }
        });

        const buttons = document.querySelectorAll('button');
        buttons.forEach((button: Element, index: number) => {
          const buttonElement = button as HTMLButtonElement;
          if (!buttonElement.textContent?.trim() && !buttonElement.getAttribute('aria-label') && !buttonElement.getAttribute('aria-labelledby')) {
            violations.push({
              id: 'button-name',
              impact: 'critical',
              tags: ['cat.name-role-value', 'wcag2a', 'wcag412'],
              description: 'Ensures buttons have discernible text',
              help: 'Buttons must have discernible text',
              helpUrl: 'https://dequeuniversity.com/rules/axe/4.0/button-name',
              nodes: [{
                target: [`button[${index}]`],
                html: buttonElement.outerHTML,
                failureSummary: 'Button missing accessible name'
              }]
            });
          } else {
            passes.push({
              id: 'button-name',
              impact: null,
              tags: ['cat.name-role-value', 'wcag2a', 'wcag412'],
              description: 'Ensures buttons have discernible text',
              nodes: [{
                target: [`button[${index}]`],
                html: buttonElement.outerHTML
              }]
            });
          }
        });

        const inputs = document.querySelectorAll('input');
        inputs.forEach((input: Element, index: number) => {
          const inputElement = input as HTMLInputElement;
          if (inputElement.type === 'hidden') {
            inapplicable.push({
              id: 'label',
              impact: null,
              tags: ['cat.forms', 'wcag2a', 'wcag412'],
              description: 'Ensures every form element has a label',
              nodes: [{
                target: [`input[${index}]`],
                html: inputElement.outerHTML
              }]
            });
            return;
          }
          if (!inputElement.getAttribute('aria-label') && !inputElement.getAttribute('aria-labelledby')) {
            const label = document.querySelector(`label[for="${inputElement.id}"]`);
            if (!label) {
              violations.push({
                id: 'label',
                impact: 'critical',
                tags: ['cat.forms', 'wcag2a', 'wcag412'],
                description: 'Ensures every form element has a label',
                help: 'Form elements must have labels',
                helpUrl: 'https://dequeuniversity.com/rules/axe/4.0/label',
                nodes: [{
                  target: [`input[${index}]`],
                  html: inputElement.outerHTML,
                  failureSummary: 'Form input missing label'
                }]
              });
            } else {
              passes.push({
                id: 'label',
                impact: null,
                tags: ['cat.forms', 'wcag2a', 'wcag412'],
                description: 'Ensures every form element has a label',
                nodes: [{
                  target: [`input[${index}]`],
                  html: inputElement.outerHTML
                }]
              });
            }
          } else {
            passes.push({
              id: 'label',
              impact: null,
              tags: ['cat.forms', 'wcag2a', 'wcag412'],
              description: 'Ensures every form element has a label',
              nodes: [{
                target: [`input[${index}]`],
                html: inputElement.outerHTML
              }]
            });
          }
        });

        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        let lastLevel = 0;
        headings.forEach((heading: Element, index: number) => {
          const headingElement = heading as HTMLHeadingElement;
          const level = parseInt(headingElement.tagName.charAt(1));
          if (level > lastLevel + 1 && lastLevel > 0) {
            violations.push({
              id: 'heading-order',
              impact: 'moderate',
              tags: ['cat.semantics', 'best-practice'],
              description: 'Ensures headings have a correct hierarchy',
              help: 'Heading levels should only increase by one',
              helpUrl: 'https://dequeuniversity.com/rules/axe/4.0/heading-order',
              nodes: [{
                target: [`heading[${index}]`],
                html: headingElement.outerHTML,
                failureSummary: `Heading level ${level} skipped from level ${lastLevel}`
              }]
            });
          } else {
            passes.push({
              id: 'heading-order',
              impact: null,
              tags: ['cat.semantics', 'best-practice'],
              description: 'Ensures headings have a correct hierarchy',
              nodes: [{
                target: [`heading[${index}]`],
                html: headingElement.outerHTML
              }]
            });
          }
          lastLevel = level;
        });

        const links = document.querySelectorAll('a[href]');
        links.forEach((link: Element, index: number) => {
          const linkElement = link as HTMLAnchorElement;
          const text = linkElement.textContent?.trim();
          if (!text || text === 'Click here' || text === 'Read more' || text === 'Download' || text === 'Learn more') {
            violations.push({
              id: 'link-name',
              impact: 'serious',
              tags: ['cat.name-role-value', 'wcag2a', 'wcag412'],
              description: 'Ensures links have discernible text',
              help: 'Links must have discernible text',
              helpUrl: 'https://dequeuniversity.com/rules/axe/4.0/link-name',
              nodes: [{
                target: [`a[${index}]`],
                html: linkElement.outerHTML,
                failureSummary: 'Link text is not descriptive'
              }]
            });
          } else {
            passes.push({
              id: 'link-name',
              impact: null,
              tags: ['cat.name-role-value', 'wcag2a', 'wcag412'],
              description: 'Ensures links have discernible text',
              nodes: [{
                target: [`a[${index}]`],
                html: linkElement.outerHTML
              }]
            });
          }
        });

        const tables = document.querySelectorAll('table');
        tables.forEach((table: Element, index: number) => {
          const tableElement = table as HTMLTableElement;
          const headers = tableElement.querySelectorAll('th');
          if (headers.length === 0) {
            violations.push({
              id: 'th-has-data-cells',
              impact: 'moderate',
              tags: ['cat.tables', 'wcag2a', 'wcag131'],
              description: 'Ensures that table headers are not empty',
              help: 'Table headers must not be empty',
              helpUrl: 'https://dequeuniversity.com/rules/axe/4.0/th-has-data-cells',
              nodes: [{
                target: [`table[${index}]`],
                html: tableElement.outerHTML,
                failureSummary: 'Table missing headers'
              }]
            });
          } else {
            passes.push({
              id: 'th-has-data-cells',
              impact: null,
              tags: ['cat.tables', 'wcag2a', 'wcag131'],
              description: 'Ensures that table headers are not empty',
              nodes: [{
                target: [`table[${index}]`],
                html: tableElement.outerHTML
              }]
            });
          }
        });

        if (document.querySelectorAll('video').length > 0) {
          incomplete.push({
            id: 'video-caption',
            impact: 'moderate',
            tags: ['cat.time-and-media', 'wcag2a', 'wcag121'],
            description: 'Ensures video elements have captions',
            nodes: [{
              target: ['video'],
              html: '<video>',
              failureSummary: 'Video caption check requires manual review'
            }]
          });
        }

        if (document.querySelectorAll('canvas').length === 0) {
          inapplicable.push({
            id: 'canvas-replaced-text',
            impact: null,
            tags: ['cat.text-alternatives', 'wcag2a', 'wcag111'],
            description: 'Ensures canvas elements have replaced text',
            nodes: []
          });
        }

        return {
          violations,
          passes,
          incomplete,
          inapplicable
        };
      });

      return results;
    } finally {
      await browser.close();
    }
  }
}
