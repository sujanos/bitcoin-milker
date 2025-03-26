module.exports = {
  env: {
    node: true,
  },
  extends: ['../../.eslintrc.cjs'],
  rules: {
    'no-underscore-dangle': ['off'],
  },
  ignorePatterns: 'esbuild.js',
  overrides: [
    {
      files: ['test.spec.ts'],
      env: { jest: true },
    },
  ],
};
