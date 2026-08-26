const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

/** Hex solto, numero de espacamento solto e fontFamily solto sao erro, nao questao de estilo. */
const valoresSoltos = [
  {
    selector: "Literal[value=/^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/]",
    message: 'Cor literal e proibida. Use um token de src/ui/theme.ts.',
  },
  {
    selector: "Property[key.name='fontFamily'] > Literal",
    message: 'fontFamily literal e proibida. Use fontFamily de src/ui/theme.ts.',
  },
];

const bordaDoDominio = [
  {
    selector: "NewExpression[callee.name='Date'][arguments.length=0]",
    message: 'O dominio nao sabe que horas sao. Receba o relogio por parametro.',
  },
  {
    selector: "CallExpression[callee.object.name='Date'][callee.property.name='now']",
    message: 'O dominio nao sabe que horas sao. Receba o relogio por parametro.',
  },
];

module.exports = defineConfig([
  expoConfig,
  { ignores: ['dist/*', 'android/*', 'ios/*', '.expo/*'] },
  {
    files: ['src/domain/**/*.ts'],
    rules: {
      'no-restricted-syntax': ['error', ...bordaDoDominio],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'react',
                'react-native',
                'react-native/*',
                'react-native-*',
                'expo',
                'expo-*',
                '@expo/*',
                'drizzle-orm',
                'drizzle-orm/*',
                '@/data/*',
                '@/ui/*',
                '@/features/*',
                '@/app/*',
                '@/widget/*',
                '../data/*',
                '../ui/*',
                '../features/*',
                '../app/*',
                '../widget/*',
              ],
              message: 'src/domain/ e puro: sem React, sem banco, sem UI.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/app/**/*.tsx', 'src/features/**/*.tsx', 'src/ui/**/*.tsx', 'src/widget/**/*.tsx'],
    rules: { 'no-restricted-syntax': ['error', ...valoresSoltos] },
  },
]);
