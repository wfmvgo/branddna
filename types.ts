export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

export interface Typography {
  headingFont: string;
  bodyFont: string;
  description: string;
}

export interface BusinessDNA {
  businessName: string;
  tagline: string;
  brandSummary: string;
  toneOfVoice: string[];
  colors: ColorPalette;
  typography: Typography;
  logoPrompt: string; // Used internally to generate the logo
  imageStylePrompt: string; // Used internally to generate stock images
  logoUrl?: string; // Populated after image generation
  brandImageUrl?: string; // Populated after image generation
  sources?: string[]; // URLs found during grounding
}

export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  GENERATING_ASSETS = 'GENERATING_ASSETS',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}