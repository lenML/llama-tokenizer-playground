class Alert {
  private element: HTMLDivElement | null = null;
  private message: string;
  private linkUrl: string;

  constructor(message: string, linkUrl: string) {
    this.message = message;
    this.linkUrl = linkUrl;
  }

  public show(): void {
    if (this.element) return;

    this.element = document.createElement("div");
    this.element.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background-color: #f8d7da;
        color: #721c24;
        padding: 12px 40px 12px 12px;
        font-size: 14px;
        line-height: 1.5;
        z-index: 1000;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      `;

    const content = document.createElement("div");
    content.innerHTML = this.formatMessage();

    const closeButton = document.createElement("button");
    closeButton.innerHTML = "&times;";
    closeButton.style.cssText = `
        position: absolute;
        top: 8px;
        right: 10px;
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        color: #721c24;
      `;
    closeButton.addEventListener("click", () => this.close());

    this.element.appendChild(content);
    this.element.appendChild(closeButton);

    document.body.prepend(this.element);
  }

  private formatMessage(): string {
    return this.message
      .replace(
        "https://github.com/lenML/tokenizers",
        `<a href="${this.linkUrl}" target="_blank" style="color: #0056b3;">https://github.com/lenML/tokenizers</a>`
      )
      .replace(/\n/gi, "<br/>");
  }

  public close(): void {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }
}

// Usage
document.addEventListener("DOMContentLoaded", () => {
  const alertMessage = `⚠️ IMPORTANT UPDATE ⚠️
  Our library @lenml/llama2-tokenizer has been deprecated. We are excited to introduce our new library @lenml/tokenizers as its replacement, offering a broader set of features and an enhanced experience.
  
  Why switch to @lenml/tokenizers?
  • Fully Compatible with transformers.js Interfaces
  • Support for a Wide Range of Models
  • Rich Feature Implementation
  
  Learn more: https://github.com/lenML/tokenizers`;

  const alert = new Alert(alertMessage, "https://github.com/lenML/tokenizers");
  alert.show();
});

export {};
