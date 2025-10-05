export interface EmailSample {
  id: string;
  name: string;
  file: string;
  description: string;
  features: string[];
  violationsExpected: number;
}

export interface ScanResult {
  violations: AccessibilityViolation[];
  passes: AccessibilityPass[];
  incomplete: AccessibilityIncomplete[];
  inapplicable: AccessibilityInapplicable[];
  sampleInfo?: EmailSample;
}

export interface AccessibilityViolation {
  id: string;
  impact: string;
  tags: string[];
  description: string;
  help: string;
  helpUrl: string;
  nodes: AccessibilityNode[];
}

export interface AccessibilityPass {
  id: string;
  impact: null;
  tags: string[];
  description: string;
  nodes: AccessibilityNode[];
}

export interface AccessibilityIncomplete {
  id: string;
  impact: string;
  tags: string[];
  description: string;
  nodes: AccessibilityNode[];
}

export interface AccessibilityInapplicable {
  id: string;
  impact: null;
  tags: string[];
  description: string;
  nodes: AccessibilityNode[];
}

export interface AccessibilityNode {
  target: string[];
  html: string;
  failureSummary?: string;
}

export interface EmailData {
  hasNewEmail: boolean;
  emailId?: string;
  htmlContent?: string;
  subject?: string;
}

export interface ScanRequest {
  html: string;
  sendEmail?: boolean;
}

export interface EmailResponse {
  hasNewEmail: boolean;
  emailId?: string;
  htmlContent?: string;
  subject?: string;
}
