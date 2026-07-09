import {
  StatusBar,
  StyleSheet,
  Text,
  View,
  Alert,
  ActivityIndicator,
} from 'react-native';
import React from 'react';
import AppHeader from '../../components/header/AppHeader';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../../theme/colors';
import ReusableFaceDetection from '../../components/faceDetection/ReusableFaceDetection';
import { enrollFace } from '../../api/adminApi';
import { useAuth } from '../../contexts/AuthContext';
import Sound from 'react-native-sound';

const CaptureScreen = ({ navigation, route }) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const { item, selectedTab } = route?.params || {};
  const { accessToken, configuredIP } = useAuth();

  // Sound initialization
  const shutterSound = new Sound('shutter.mp3', Sound.MAIN_BUNDLE, error => {
    if (error) console.log('Failed to load shutter sound', error);
  });

  const isTeacher = item?.User_id;

  const studentId = isTeacher ? item?.User_id : item?.Student_id;

  const handleFacesDetected = faces => {};

  const handleFaceCapture = async faceData => {
    // Play shutter sound
    if (shutterSound) shutterSound.play();

    if (!studentId) {
      Alert.alert('Error', 'No student/teacher ID provided');
      return;
    }

    if (!faceData?.uri) {
      Alert.alert('Error', 'No image data available');
      return;
    }

    setIsLoading(true);

    try {
      // Call the enrollment API
      const response = await enrollFace(
        configuredIP,
        accessToken,
        studentId,
        faceData.uri,
        isTeacher,
      );

      console.log('Enrollment successful, response:', response);

      navigation.replace('CapturePreviewScreen', {
        faceData: faceData,
        apiResponse: response,
        item: item,
        selectedTab: selectedTab,
      });
    } catch (error) {
      console.error('Error:', error);

      Alert.alert(
        'Enrollment Failed',
        error.message || 'Failed to enroll face. Please try again.',
        [
          {
            text: 'Retry',
            onPress: () => handleFaceCapture(faceData),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ],
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleError = error => {
    console.error('CaptureScreen: Face detection error:', error);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.headerBg} />
        <AppHeader
          title={'Capture Photo'}
          onPressBack={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Enrolling face...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.headerBg} />
      <AppHeader
        title={'Capture Photo'}
        onPressBack={() => navigation.goBack()}
      />
      <ReusableFaceDetection
        mode="single"
        enableCropping={true}
        cropPadding={0.5}
        onFacesDetected={handleFacesDetected}
        onFaceCapture={handleFaceCapture}
        onError={handleError}
        showModeToggle={false}
        showCaptureButton={true}
        showFaceCounter={false}
        showPreview={false}
        showFlash={true}
        showCameraFlip={true}
        cameraFacing="back"
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
          },
        }}
        navigation={navigation}
        route={route}
        item={item}
      />
    </SafeAreaView>
  );
};

export default CaptureScreen;

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
