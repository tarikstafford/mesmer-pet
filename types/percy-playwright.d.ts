declare module '@percy/playwright' {
  import { Page } from '@playwright/test';

  interface PercySnapshotOptions {
    widths?: number[];
    minHeight?: number;
    percyCSS?: string;
    enableJavaScript?: boolean;
  }

  function percySnapshot(
    page: Page,
    name: string,
    options?: PercySnapshotOptions
  ): Promise<void>;

  export default percySnapshot;
  export { PercySnapshotOptions };
}
