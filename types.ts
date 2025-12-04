

export interface Suggestions {
  originalDescription: string;
  expressions: string[];
  clothing: string[];
  scenes: string[];
  styles: string[];
}

export interface SelectedOptions {
  expression: string | null;
  clothing: string | null;
  scene: string | null;
  style: string | null;
  hijab: string | null;
  clothingColor: string | null;
  isViral: boolean;
  isManualMode: boolean;
}

export enum AppState {
  UPLOAD = 'UPLOAD',
  ANALYZING = 'ANALYZING',
  OPTIONS = 'OPTIONS',
  GENERATING = 'GENERATING',
  RESULT = 'RESULT',
}

export enum Quality {
  STANDARD = 'STANDARD',
  HIGH = 'HIGH',
}

export interface GeneratedImage {
  url: string;
  prompt: string;
}

export interface SocialPost {
  headline: string;
  content: string;
  hashtags: string[];
}

export type Language = 'en' | 'ms';

export type FBPostType = 'REACTION' | 'TUTORIAL' | 'STORY' | 'CORPORATE' | 'MEME';
