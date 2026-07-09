import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  StatusBar,
  RefreshControl,
  Dimensions,
} from 'react-native';
import MainHeader from '../../components/header/MainHeader';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../../theme/colors';
import CalendarDateItem from '../../components/attendance/CalendarDateItem';
import ClassCard from '../../components/attendance/ClassCard';
import EmptyState from '../../components/attendance/EmptyState';
import AttendanceModal from '../../components/attendance/AttendanceModal';
import AppLoader from '../../helpers/AppLoader';
import Toast from 'react-native-toast-message';
import {
  generateCalendarDates,
  getTodayIndex,
} from '../../helpers/attendanceHelpers';
import { generateSessionId, getTeachersSessions } from '../../api/teachersApi';
import moment from 'moment';
import { useAuth } from '../../contexts/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CALENDAR_ITEM_WIDTH = 63;

const AttendanceScreen = ({ navigation }) => {
  const todayIndex = getTodayIndex();
  const [selectedDate, setSelectedDate] = useState(todayIndex.toString());
  const [hasClasses, setHasClasses] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sessionsData, setSessionsData] = useState([]);
  const [currentDate, setCurrentDate] = useState(moment().format('YYYY-MM-DD'));
  const scrollRef = useRef(null);
  const { accessToken, configuredIP, userDetails } = useAuth();

  const calendarDates = useMemo(() => generateCalendarDates(), []);
  const selectedDateData = useMemo(
    () => calendarDates.find(d => d.id === selectedDate),
    [selectedDate, calendarDates],
  );

  const scrollToCenter = useCallback(index => {
    if (scrollRef.current) {
      const selectedIndex = parseInt(index);
      const itemPosition = selectedIndex * CALENDAR_ITEM_WIDTH;
      const centerOffset = SCREEN_WIDTH / 2 - CALENDAR_ITEM_WIDTH / 2;
      const scrollPosition = Math.max(0, itemPosition - centerOffset);

      scrollRef.current.scrollTo({ x: scrollPosition, animated: true });
    }
  }, []);

  // Function to fetch teachers sessions
  const fetchTeachersSessions = useCallback(async date => {
    try {
      setIsLoading(true);
      const ip = configuredIP;
      const token = accessToken;

      const response = await getTeachersSessions(ip, token, date);

      const transformedSessions =
        response.sessions?.map((session, index) => {
          const selectedDateMoment = moment(date, 'YYYY-MM-DD');
          const sessionStartTime = moment(session.Period?.Start_time);
          const sessionEndTime = moment(session.Period?.End_time);

          const sessionStartDateTime = moment(selectedDateMoment)
            .hour(sessionStartTime.hour())
            .minute(sessionStartTime.minute())
            .second(sessionStartTime.second());

          const sessionEndDateTime = moment(selectedDateMoment)
            .hour(sessionEndTime.hour())
            .minute(sessionEndTime.minute())
            .second(sessionEndTime.second());

          const now = moment();
          const isSessionActive = now.isBetween(
            sessionStartDateTime,
            sessionEndDateTime,
            null,
            '[]',
          );

          return {
            id: session.Session_id || index.toString(),
            className: `Class ${session.Class_id}`,
            section: `Section ${session.Section_id}`,
            subject: session.Subject?.Subject_Name || 'Unknown Subject',
            period: session.Period?.Period_Name || 'Unknown Period',
            time: sessionStartDateTime.format('HH:mm'),
            endTime: sessionEndDateTime,
            startTime: sessionStartDateTime,
            teacher: session.Teacher?.Name || 'Unknown Teacher',
            isActive: isSessionActive,
            sessionData: session,
          };
        }) || [];

      setSessionsData(transformedSessions);
      setHasClasses(transformedSessions.length > 0);
    } catch (error) {
      console.error('Failed to fetch teachers sessions:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to fetch sessions data',
      });
      setSessionsData([]);
      setHasClasses(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchTeachersSessions(currentDate);
    } finally {
      setRefreshing(false);
    }
  }, [currentDate, fetchTeachersSessions]);

  useEffect(() => {
    setCurrentDate(moment().format('YYYY-MM-DD'));
    fetchTeachersSessions(moment().format('YYYY-MM-DD'));

    setTimeout(() => {
      scrollToCenter(todayIndex.toString());
    }, 100);
  }, []);

  // Fetch sessions when selected date changes
  useEffect(() => {
    const selectedDateObj = calendarDates.find(d => d.id === selectedDate);
    if (selectedDateObj && !selectedDateObj.disabled) {
      const dateForApi = selectedDateObj.fullDate;

      setCurrentDate(dateForApi);
      fetchTeachersSessions(dateForApi);
    }
  }, [selectedDate, calendarDates, fetchTeachersSessions]);

  const handleDatePress = useCallback(
    (id, isDisabled) => {
      if (isDisabled) {
        Toast.show({
          type: 'info',
          text1: 'Future Date',
          text2: 'Cannot select future dates',
          position: 'bottom',
        });
        return;
      }

      setSelectedDate(id);
      scrollToCenter(id);
    },
    [scrollToCenter],
  );

  const handleOpenModal = useCallback(() => {
    setModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
  }, []);

  const handleSubmitAttendance = useCallback(
    async sessionItem => {
      setModalVisible(false);
      setIsLoading(true);

      try {
        const ip = configuredIP;
        const token = accessToken;

        const userId = userDetails?.User_id;

        if (!userId) {
          throw new Error('User ID not found. Please log in again.');
        }

        let originalSession = sessionItem.sessionData;
        if (!originalSession) {
          console.log('No sessionData found, creating fallback data');
          originalSession = {
            Class_id: sessionItem.classId || 1,
            Section_id: sessionItem.sectionId || 1,
            Period: {
              Period_id: sessionItem.periodId || 1,
            },
            Subject: {
              Subject_id: sessionItem.subjectId || 1,
            },
          };
        }

        const classId = originalSession.Class_id;
        const sectionId = originalSession.Section_id;
        const periodId = originalSession.Period?.Period_id;
        const subjectId = originalSession.Subject?.Subject_id;

        if (!classId || !sectionId || !periodId || !subjectId) {
          throw new Error('Missing required session data for attendance');
        }

        const sessionResponse = await generateSessionId(
          ip,
          token,
          classId,
          sectionId,
          periodId,
          subjectId,
          userId,
        );

        if (sessionItem.isActive) {
          navigation.navigate('StudentsAttendance', {
            userData: {
              session: sessionResponse.Session_id,
              ...sessionItem.attendanceData,
            },
            token: token,
          });
        } else {
          navigation.navigate('TeachersAttendance', {
            sessionId: sessionResponse.Session_id,
            attendanceData: {
              classId,
              sectionId,
              periodId,
              subjectId,
              className: sessionItem.className || sessionItem.name,
              section: sessionItem.section,
              subject: sessionItem.subject,
              period: sessionItem.period,
              time: sessionItem.time,
            },
          });
        }
      } catch (error) {
        console.error('Failed to generate session ID:', error);
        Toast.show({
          type: 'error',
          text1: 'Session Generation Failed',
          text2: error.message || 'Failed to generate attendance session',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [navigation],
  );

  const renderClassItem = useCallback(
    ({ item }) => (
      <ClassCard
        item={item}
        onPress={item.isActive ? () => handleSubmitAttendance(item) : undefined}
      />
    ),
    [handleSubmitAttendance],
  );

  const keyExtractor = useCallback(item => item.id, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      <MainHeader navigation={navigation} />
      <AppLoader isLoading={isLoading} text="Generating session..." />

      <View style={styles.calendarContainer}>
        <View style={styles.monthLabel}>
          <Text style={styles.monthText}>{selectedDateData?.month}</Text>
        </View>
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {calendarDates.map(item => (
            <CalendarDateItem
              key={item.id}
              item={item}
              isSelected={item.id === selectedDate}
              onPress={() => handleDatePress(item.id, item.disabled)}
              disabled={item.disabled}
            />
          ))}
        </ScrollView>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>
          Classes for the day ({sessionsData.length})
        </Text>
        {hasClasses ? (
          <FlatList
            data={sessionsData}
            renderItem={renderClassItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.classList}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
          />
        ) : (
          <EmptyState />
        )}
        {selectedDateData?.fullDate === moment().format('YYYY-MM-DD') && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.captureButton}
              activeOpacity={0.8}
              onPress={handleOpenModal}
            >
              <Text style={styles.captureButtonText}>CAPTURE ATTENDANCE</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <AttendanceModal
        visible={modalVisible}
        onClose={handleCloseModal}
        onSubmit={handleSubmitAttendance}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  calendarContainer: {
    backgroundColor: colors.primary,
    paddingVertical: 5,
    position: 'relative',
  },
  monthLabel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 1,
    backgroundColor: colors.userBg,
    padding: 5,
  },
  monthText: {
    color: colors.black,
    fontSize: 12,
    fontWeight: 'bold',
    transform: [{ rotate: '-90deg' }],
  },
  scrollContent: {
    paddingHorizontal: 10,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 15,
  },
  classList: {
    paddingBottom: 20,
  },
  buttonContainer: {
    paddingVertical: 20,
    paddingHorizontal: 50,
  },
  captureButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  captureButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default AttendanceScreen;
