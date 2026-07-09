import React, { useState } from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import Toast from 'react-native-toast-message';
import AppHeader from '../../components/header/AppHeader';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../../theme/colors';
import ReusableFaceDetection from '../../components/faceDetection/ReusableFaceDetection';
import AppLoader from '../../helpers/AppLoader';
import { useAuth } from '../../contexts/AuthContext';
import { getTeachersAttendance, recognizeTeacher } from '../../api/teachersApi';

const TeachersAttendance = ({ navigation, route }) => {
  const { accessToken, configuredIP } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const { sessionId } = route?.params || {};
  const item = route?.params;

  const handleFacesDetected = faces => {
    // console.log('CaptureScreen: Faces detected:', faces.length);
  };

  const handleFaceCapture = async faceData => {
    setIsLoading(true);
    try {
      const response = await recognizeTeacher(
        configuredIP,
        faceData.uri,
        sessionId,
        accessToken,
      );
      console.log('Teacher recognition', response);
      if (response?.recognized === true) {
        verifyTeacherAttendance(accessToken, sessionId);
      }
    } catch (error) {
      console.log('Teacher recognition', error);
      Toast.show({
        type: 'error',
        text1: 'Recognition Failed',
        text2: error.message || 'Failed to recognize teacher face',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyTeacherAttendance = async (token, sessionId) => {
    const response = await getTeachersAttendance(
      configuredIP,
      token,
      sessionId,
    );
    navigation.replace('StudentsAttendance', {
      userData: response,
      token: token,
    });
  };

  const handleError = error => {
    // console.error('CaptureScreen: Face detection error:', error);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.headerBg} />
      <AppHeader
        title={'My Attendance'}
        onPressBack={() => navigation.goBack()}
      />
      <Toast />
      <AppLoader isLoading={isLoading} text="Recognizing face..." />

      <ReusableFaceDetection
        mode="multi"
        enableCropping={true}
        cropPadding={0.0}
        onFacesDetected={handleFacesDetected}
        onFaceCapture={handleFaceCapture}
        onError={handleError}
        showModeToggle={false}
        showCaptureButton={true}
        showFaceCounter={false}
        showPreview={false}
        cameraFacing="front"
        autoMode={true}
        customStyles={{
          container: { backgroundColor: colors.headerBg },
          faceCounter: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
          },
          manualCaptureButton: {
            backgroundColor: colors.background,
            height: 70,
            width: 70,
            borderRadius: 90 / 2,
            borderWidth: 5,
            borderColor: colors.primary,
          },
        }}
        navigation={navigation}
        route={route}
        item={item}
      />
    </SafeAreaView>
  );
};

export default TeachersAttendance;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.headerBg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.headerBg,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textPrimary,
  },
});
