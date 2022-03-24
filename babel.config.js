module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current'
        }
      }
    ],
    '@babel/preset-typescript'
  ],
  plugins: [
    [
      'module-resolver',
      {
        alias: {
          '@config': './src/config',
          '@middlewares': './src/middlewares',
          '@models': './src/models',
          '@providers': './src/providers',
          '@services': './src/services',
          '@useCases': './src/useCases'
        }
      }
    ]
  ],
  ignore: ['**/*.spec.ts']
};
