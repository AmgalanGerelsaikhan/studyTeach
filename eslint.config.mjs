// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/build/**',
      '**/coverage/**',
      'studyTeach (2)/**',
      'apps/api/migrations/**/*.sql',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  // NestJS DI uses class identity at runtime via emitDecoratorMetadata.
  // Even a constructor-only `private readonly svc: Svc` reference needs the
  // class imported as a runtime value, not a type. Disable the type-imports
  // rule for the api source tree.
  {
    files: ['apps/api/src/**/*.ts'],
    rules: {
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },
  // Service worker runs in its own global scope.
  {
    files: ['apps/web/public/sw.js'],
    languageOptions: {
      globals: {
        self: 'readonly',
        caches: 'readonly',
        fetch: 'readonly',
        Response: 'readonly',
        Request: 'readonly',
        URL: 'readonly',
        clients: 'readonly',
      },
    },
  },
  // Web app — guard against the <Link><StButton> regression. <button> inside
  // <a> is invalid HTML and triggers a React hydration warning. Callers must
  // use StLinkButton for navigation-as-button.
  {
    files: ['apps/web/**/*.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "JSXElement[openingElement.name.name='Link'] > JSXElement[openingElement.name.name='StButton']",
          message:
            'Use <StLinkButton href=...> instead of <Link><StButton>...</StButton></Link>. <button> inside <a> is invalid HTML — see docs/DESIGN_SYSTEM.md#button-variant-semantics.',
        },
      ],
    },
  },
  prettier,
);
