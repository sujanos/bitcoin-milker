module.exports = {
  env: {
    node: true,
  },
  extends: ['../../.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  parserOptions: { project: true },
  rules: {
    'no-underscore-dangle': ['off'],
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'default',
        format: [
          'camelCase',
          'strictCamelCase',
          'PascalCase',
          'StrictPascalCase',
          'snake_case',
          'UPPER_CASE',
        ],
        leadingUnderscore: 'allow',
      },
    ],
  },
  ignorePatterns: ['.eslintrc.cjs'],
  overrides: [
    {
      files: ['test.spec.ts'],
      env: { jest: true },
    },
  ],
};
