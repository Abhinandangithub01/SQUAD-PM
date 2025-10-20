'use client';

import { useEffect } from 'react';
import { Amplify } from 'aws-amplify';

export function ConfigureAmplifyClientSide() {
  useEffect(() => {
    try {
      // Dynamic import to handle missing file gracefully
      import('../../amplify_outputs.json')
        .then((outputs) => {
          Amplify.configure(outputs.default || outputs, { ssr: true });
        })
        .catch((error) => {
          console.warn('Amplify outputs not found. Run "npx ampx sandbox" to generate backend configuration.');
        });
    } catch (error) {
      console.warn('Amplify configuration error:', error);
    }
  }, []);

  return null;
}
