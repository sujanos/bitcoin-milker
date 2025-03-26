module.exports = {
  env: {
    node: true,
  },
  extends: ['../../.eslintrc.cjs'],
  rules: {
    'no-underscore-dangle': ['off'],
  },
  ignorePatterns: 'esbuild.mjs',
  overrides: [
    {
      files: ['test.spec.ts'],
      env: { jest: true },
    },
  ],
};
