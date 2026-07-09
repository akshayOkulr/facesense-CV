import ToastContainer from './CustomToast';

export const toastConfig = {
  AppSuccess: props => (
    <ToastContainer
      {...props}
      status="Success"
      bgColor="#D9FBE6"
      progressColor="#16A34A"
    />
  ),

  AppError: props => (
    <ToastContainer
      {...props}
      status="Error"
      bgColor="#FFDAD6"
      progressColor="#DC2626"
    />
  ),
};
