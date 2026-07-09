module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // ['react-native-worklets-core/plugin'],
    'react-native-reanimated/plugin',
  ],
  env: {
    production: {
      plugins: ['transform-remove-console'],
    },
  },
};
