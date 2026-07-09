import Toast from 'react-native-toast-message';

export const showAppSuccess = text1 => {
  Toast.show({
    type: 'AppSuccess',
    text1,
    position: 'bottom',
    visibilityTime: 3000,
    autoHide: true,
  });
};

export const showAppError = text1 => {
  Toast.show({
    type: 'AppError',
    text1,
    position: 'bottom',
    visibilityTime: 3000,
    autoHide: true,
  });
};
