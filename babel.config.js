module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'expo-router/babel',  // ← ADICIONA ESTA LINHA
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};