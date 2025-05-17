declare module 'pdfkit' {
  // This is a simplified definition that is forgiving on types
  class PDFDocument {
    constructor(options?: any);
    text(text: string, options?: any): this;
    fontSize(size: number): this;
    font(name: string, path?: string): this;
    moveDown(lines?: number): this;
    on(event: string, callback: Function): this;
    end(): void;
  }
  
  export = PDFDocument;
} 