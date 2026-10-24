import nextVitals from 'eslint-config-next/core-web-vitals';

const config = [
  ...nextVitals,
  {
    rules: {
      'react/prop-types': 'off',
      'react/no-unescaped-entities': 'off',
      // Content images are CMS/JSON driven and served unoptimised (next.config.mjs).
      '@next/next/no-img-element': 'off',
    },
  },
  {
    ignores: ['.next/**', 'out/**', 'node_modules/**', 'public/**', 'coverage/**', 'next-env.d.ts', 'products/**'],
  },
];

export default config;
