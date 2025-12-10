export interface UserProfile {
  name: string;
  gender: string;
  height: string;
  weight: string;
  bodyType: string;
  role: string;
  restrictions: string;
}

export interface ImageFile {
  file: File;
  previewUrl: string;
  base64: string;
}

export enum AppStep {
  ONBOARDING = 'ONBOARDING',
  PROFILE_INPUT = 'PROFILE_INPUT',
  PHOTO_UPLOAD = 'PHOTO_UPLOAD',
  ANALYZING = 'ANALYZING',
  RESULTS = 'RESULTS',
}

export interface AnalysisResponse {
  markdownText: string;
}