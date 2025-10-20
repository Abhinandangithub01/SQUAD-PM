'use client';

import { Amplify } from 'aws-amplify';
import outputs from '../../amplify_outputs.json';

// Configure Amplify immediately on module load
if (typeof window !== 'undefined') {
  try {
    Amplify.configure(outputs, { ssr: true });
  } catch (error) {
    console.error('Failed to configure Amplify:', error);
  }
}

export function ConfigureAmplifyClientSide() {
  return null;
}
