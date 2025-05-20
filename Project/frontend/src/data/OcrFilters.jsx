// src/data/OcrFilters.jsx

export const ocrProviders = [
  {
    value: 'azure',
    label: 'Azure Vision OCR',
    details: 'Stable | All Languages',
    description: 'Microsoft Azure\'s comprehensive OCR service. Generally stable and supports a wide range of languages.',
    isBeta: false,
  },
  {
    value: 'google',
    label: 'Google Vision OCR',
    details: 'Stable | All Languages',
    description: 'Google Cloud\'s powerful OCR service. Generally stable with extensive language support.',
    isBeta: false,
  },
  {
    value: 'textevolve_v1', // New value for your custom model
    label: 'TE-3o mini',   // New label
    details: 'Beta | Tamil & English Only',
    description: 'Custom model by TextEvolve, optimized for Tamil and English text. Currently in beta stage.',
    isBeta: true,
  },
  // Add other providers here in the future if needed
];