import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  StatusBar,
  View,
  Text,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Platform,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import colors from '../../theme/colors';
import AppLoader from '../../helpers/AppLoader';
import ReusableFaceDetection from '../../components/faceDetection/ReusableFaceDetection';
import { SafeAreaView } from 'react-native-safe-area-context';
import Sound from 'react-native-sound';
import {
  getStudentsList,
  getStudentsAttendanceMArked,
  recognizeStudent,
} from '../../api/teachersApi';
import { BackIcon, CheckMark } from '../../assets';
import { useAuth } from '../../contexts/AuthContext';

const StudentsAttendance = ({ navigation, route }) => {
  const { userData, token } = route?.params;
  const { accessToken, configuredIP } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const [students, setStudents] = useState([]);
  const [capturedFaces, setCapturedFaces] = useState([]);
  const [detectedFacesCount, setDetectedFacesCount] = useState(0);
  const [authToken, setAuthToken] = useState(token);
  const [serverIpAddress, setServerIpAddress] = useState('');
  const [attendanceData, setAttendanceData] = useState(null);
  const [sessionId, setSessionId] = useState(null);

  const faceDetectionRef = useRef(null);
  const flatListRef = useRef(null);

  // Sound initialization
  const shutterSound = new Sound('shutter.mp3', Sound.MAIN_BUNDLE, error => {
    if (error) console.log('Failed to load shutter sound', error);
  });
  const notificationSound = new Sound(
    'notification.mp3',
    Sound.MAIN_BUNDLE,
    error => {
      if (error) console.log('Failed to load notification sound', error);
    },
  );

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    if (configuredIP) {
      setServerIpAddress(configuredIP);
    }
  }, [configuredIP]);

  const { width, height } = dimensions;
  const isLandscape = width > height;

  const totalStudents = students.length;
  const detectedStudents = students.filter(s => s.detected).length;

  useEffect(() => {
    const loadAttendanceData = async () => {
      try {
        setIsLoading(true);

        const data = await getStudentsList(
          configuredIP,
          accessToken,
          userData?.session,
        );
        setAttendanceData(data);

        if (data && data.Session_id) {
          setSessionId(data.Session_id);
        }

        console.log('Attendance data loaded:==>', data);

        const attendanceArray = [
          {
            sessionId: data.Session_id,
            context: data.context,
            counts: data.counts,
            pagination: data.pagination,
            students: data.students,
          },
        ];

        console.log('Stored attendance array:', attendanceArray);

        if (data && data.students && Array.isArray(data.students)) {
          const processedStudents = data.students
            .map(studentRecord => ({
              id: studentRecord.Student_id,
              name: studentRecord.Student_Name,
              detected: studentRecord.marked || false,
              marked: studentRecord.marked,
            }))
            .sort((a, b) => {
              if (a.marked && !b.marked) return -1;
              if (!a.marked && b.marked) return 1;
              return a.name.localeCompare(b.name);
            });

          setStudents(processedStudents);
        }
      } catch (error) {
        console.error('Failed to load attendance data:', error);
        Alert.alert('Error', 'Failed to load attendance data');
      } finally {
        setIsLoading(false);
      }
    };

    loadAttendanceData();
  }, [accessToken, configuredIP, userData?.session]);

  const handleFacesDetected = useCallback(faces => {
    setDetectedFacesCount(faces?.length || 0);
  }, []);

  const handleFaceCapture = useCallback(
    async faceData => {
      setCapturedFaces(prevFaces => [...prevFaces, faceData]);

      try {
        if (!sessionId) {
          throw new Error('Session ID not available');
        }

        const recognitionResult = await recognizeStudent(
          serverIpAddress,
          faceData.uri,
          sessionId,
          authToken,
        );

        console.log('Recognition result:', recognitionResult);

        // After successful recognition, get updated marked attendance
        try {
          const updatedAttendanceData = await getStudentsAttendanceMArked(
            serverIpAddress,
            sessionId,
          );

          console.log('Updated attendance data:', updatedAttendanceData);

          // Update students list based on the marked attendance data
          if (
            updatedAttendanceData &&
            updatedAttendanceData.attendance &&
            Array.isArray(updatedAttendanceData.attendance)
          ) {
            // Create a set of student IDs that are marked present
            const markedStudentIds = new Set(
              updatedAttendanceData.attendance.map(record => record.Student_id),
            );

            const updatedStudents = students
              .map(student => ({
                ...student,
                detected: markedStudentIds.has(student.id),
                marked: markedStudentIds.has(student.id),
              }))
              .sort((a, b) => {
                if (a.marked && !b.marked) return -1;
                if (!a.marked && b.marked) return 1;
                return a.name.localeCompare(b.name);
              });

            setStudents(updatedStudents);

            // Scroll to top if there are marked students
            if (markedStudentIds.size > 0 && flatListRef.current) {
              flatListRef.current.scrollToOffset({ offset: 0, animated: true });
            }

            // Play notification sound
            if (notificationSound && markedStudentIds.size > 0)
              notificationSound.play();

            console.log('Updated students list with marked attendance');
            console.log('Marked student IDs:', Array.from(markedStudentIds));
          }
        } catch (attendanceError) {
          console.error('Failed to get updated attendance:', attendanceError);
          // Still update with recognition result if attendance fetch fails
          if (recognitionResult && recognitionResult.matchedStudents) {
            setStudents(prevStudents =>
              prevStudents
                .map(student => ({
                  ...student,
                  detected:
                    recognitionResult.matchedStudents.includes(student.id) ||
                    student.detected,
                }))
                .sort((a, b) => {
                  if (a.marked && !b.marked) return -1;
                  if (!a.marked && b.marked) return 1;
                  return a.name.localeCompare(b.name);
                }),
            );

            // Play notification sound for recognition
            if (notificationSound) notificationSound.play();
          }
        }
      } catch (error) {
        console.error('Student recognition failed:', error);
      }
    },
    [authToken, serverIpAddress, sessionId, students, notificationSound],
  );

  const onCapture = useCallback(() => {
    // Play shutter sound
    if (shutterSound) shutterSound.play();

    if (faceDetectionRef.current) {
      faceDetectionRef.current.captureAndCropFaces();
    }
  }, [shutterSound]);

  const rightHeaderWidth = isLandscape ? 60 : 50;
  const bottomStripHeight = isLandscape ? 140 : 130;

  const renderStudentItem = ({ item }) => (
    <TouchableOpacity style={styles.studentItem} activeOpacity={0.7}>
      <View
        style={[
          styles.studentAvatar,
          item.detected && styles.studentAvatarDetected,
        ]}
      >
        <CheckMark />
      </View>
      <Text
        style={[
          styles.studentName,
          item.detected && styles.studentNameDetected,
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      <ReusableFaceDetection
        ref={faceDetectionRef}
        mode="multi"
        cropPadding={0.0}
        orientation={'portrait'}
        showFaceCounter={true}
        showModeToggle={false}
        showCaptureButton={false}
        showPreview={false}
        showAlerts={false}
        autoMode={true}
        onFacesDetected={handleFacesDetected}
        onFaceCapture={handleFaceCapture}
        onError={console.error}
      />

      {/* Single Reverse L-Shaped Fade Container */}
      <View
        style={[
          styles.lShapedFadeWrapper,
          {
            right: rightHeaderWidth - 80,
            bottom: bottomStripHeight - 80,
          },
        ]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={[
            'rgba(0,0,0,0)',
            'rgba(0,0,0,0.15)',
            'rgba(0,0,0,0.35)',
            'rgba(0,0,0,0.6)',
            'rgba(0,0,0,0.85)',
          ]}
          locations={[0, 0.25, 0.5, 0.75, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.lShapedGradient}
        />
      </View>

      <View style={[styles.rightHeader, { width: rightHeaderWidth }]}>
        <SafeAreaView>
          <View
            style={[
              styles.headerGradient,
              {
                width: height,
                height: rightHeaderWidth,
              },
            ]}
          >
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <BackIcon />
              <Text style={styles.headerTitle}>Student Attendance</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              Students ({detectedStudents}/{totalStudents})
            </Text>
          </View>
        </SafeAreaView>
      </View>

      <View
        style={[
          styles.bottomContainer,
          {
            right: rightHeaderWidth,
            height: bottomStripHeight,
          },
        ]}
      >
        <View style={styles.bottomGradient}>
          <View style={styles.bottomContent}>
            <View style={styles.listContainer}>
              <FlatList
                ref={flatListRef}
                data={students}
                renderItem={renderStudentItem}
                keyExtractor={item => item.id.toString()}
                showsVerticalScrollIndicator={false}
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                windowSize={10}
                initialNumToRender={8}
                getItemLayout={(data, index) => ({
                  length: 75,
                  offset: 75 * index,
                  index,
                })}
              />
            </View>

            <View style={styles.captureButtonWrapper}>
              <TouchableOpacity
                style={styles.captureButton}
                activeOpacity={0.8}
                onPress={onCapture}
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <SafeAreaView />
      </View>
      <AppLoader isLoading={isLoading} />
    </View>
  );
};

export default StudentsAttendance;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  lShapedFadeWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 11,
  },
  lShapedGradient: {
    width: '100%',
    height: '100%',
  },
  rightHeader: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 15,
  },
  headerGradient: {
    transform: [{ rotate: '90deg' }],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    paddingRight: 50,
  },
  backButton: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    marginLeft: 30,
  },
  bottomContainer: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    zIndex: 15,
  },
  bottomGradient: {
    flex: 1,
  },
  bottomContent: {
    transform: [{ rotate: '90deg' }],
    alignItems: 'flex-end',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  listContainer: {
    height: 230,
  },
  studentItem: {
    alignItems: 'center',
    marginBottom: 10,
    width: 70,
    flexDirection: 'row',
  },
  studentAvatar: {
    width: 16,
    height: 16,
    borderRadius: 90 / 2,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
  },
  studentAvatarDetected: {
    backgroundColor: colors.darkGreen,
  },
  studentName: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  captureButtonWrapper: {
    justifyContent: 'center',
    zIndex: 999999,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.4,
        shadowRadius: 5,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  captureButtonInner: {
    width: 58,
    height: 58,
    borderRadius: 90 / 2,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.22)',
  },
  captureButtonDisabled: {
    opacity: 0.6,
  },
  studentNameDetected: {
    color: colors.darkGreen,
  },
});
