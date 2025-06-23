module.exports = (api) => {
  // Cache the configuration based on the NODE_ENV
  const isTest = api.env('test');
  api.cache(true);

  const presets = [
    [
      'next/babel',
      {
        'preset-react': {
          runtime: 'automatic',
          importSource: '@emotion/react',
        },
      },
    ],
  ];

  const plugins = [
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    ['@babel/plugin-proposal-class-properties', { loose: true }],
    ['@babel/plugin-proposal-private-methods', { loose: true }],
    ['@babel/plugin-proposal-private-property-in-object', { loose: true }],
    'babel-plugin-styled-components',
  ];

  // Only add these plugins for test environment
  if (isTest) {
    plugins.push(
      // Add any test-specific plugins here
    );
  }


  return {
    presets,
    plugins,
  };
};
