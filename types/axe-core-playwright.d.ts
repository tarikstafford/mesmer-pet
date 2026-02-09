declare module '@axe-core/playwright' {
  import { Page } from '@playwright/test';

  interface AxeResults {
    violations: Array<{
      id: string;
      impact: string;
      description: string;
      help: string;
      helpUrl: string;
      tags: string[];
      nodes: Array<{
        html: string;
        impact: string;
        target: string[];
        failureSummary: string;
      }>;
    }>;
    passes: Array<unknown>;
    incomplete: Array<unknown>;
    inapplicable: Array<unknown>;
  }

  interface AxeBuilderOptions {
    disableRules?: string[];
    withTags?: string[];
  }

  class AxeBuilder {
    constructor(page: Page | { page: Page });
    withTags(tags: string[]): this;
    disableRules(rules: string[]): this;
    include(selector: string | string[]): this;
    exclude(selector: string | string[]): this;
    analyze(): Promise<AxeResults>;
  }

  export default AxeBuilder;
  export { AxeResults, AxeBuilderOptions };
}
