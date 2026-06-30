export type BlockType = 
  | "rich-text"
  | "image"
  | "video"
  | "gallery"
  | "custom-html"
  | "spacer"
  | "divider"
  | "hero"
  | "hero-with-preview"
  | "hero-split"
  | "features-grid"
  | "stats"
  | "logo-cloud"
  | "cta"
  | "pricing-table"
  | "faq"
  | "testimonials"
  | "team"
  | "timeline"
  | "contact-form"
  | "blog-list";

export interface PageBlock {
  id: string;
  type: BlockType;
  
  // Generic content (HTML for rich-text)
  content?: string;
  
  // Configuration for the block (titles, styles, etc)
  data?: Record<string, any>;
  
  // Sub-items (like feature cards in a features-grid, or steps in a timeline)
  items?: any[];
  
  style?: Record<string, any>;
}
