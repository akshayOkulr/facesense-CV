import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import {
  Text,
  StyleSheet,
  StatusBar,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import MainHeader from '../../components/header/MainHeader';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../../theme/colors';
import {
  AppUserFace,
  Search,
  StudentsIcon,
  StudentsIcon1,
  TeachersIcon,
  TeachersIcon1,
} from '../../assets';
import {
  getTeachers,
  getStudents,
  getClasses,
  getSections,
} from '../../api/adminApi';
import ClassSectionModal from '../../components/ClassSectionModal';
import SkeletonLoader from '../../components/SkeletonLoader';
import { useAuth } from '../../contexts/AuthContext';
import FastImage from 'react-native-fast-image';

const AdminHomeScreen = ({ navigation, route }) => {
  const {
    accessToken,
    configuredIP,
    isAuthenticated,
    isLoading: authLoading,
  } = useAuth();

  const { selectedTab } = route?.params || {};
  const [isActiveTab, setIsActiveTab] = useState(selectedTab || 0);
  const [teachersList, setTeachersList] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [inputText, setInputText] = useState(''); // For immediate input display
  const [isSearching, setIsSearching] = useState(false); // Loading indicator
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);

  const skeletonData = Array.from({ length: 5 }, (_, i) => ({ id: i }));

  // Use ref instead of state for timeout
  const searchTimeoutRef = useRef(null);
  // Ref to prevent concurrent API calls
  const isFetchingRef = useRef(false);
  // Removed animation refs

  const fetchClasses = useCallback(async () => {
    if (!configuredIP) {
      console.error(
        'AdminHomeScreen: Cannot fetch classes - IP is null/undefined',
      );
      return;
    }

    try {
      const response = await getClasses(configuredIP, accessToken);
      setClasses(response.classes || []);
    } catch (err) {
      console.error('Failed to fetch classes:', err);
      setClasses([]);
    }
  }, [configuredIP, accessToken]);

  const fetchSections = useCallback(
    async classId => {
      if (!classId) {
        setSections([]);
        return;
      }
      try {
        const response = await getSections(configuredIP, accessToken, classId);
        setSections(response.sections || []);
      } catch (err) {
        console.error('Failed to fetch sections:', err);
        setSections([]);
      }
    },
    [configuredIP, accessToken],
  );

  const onPressSelectClassSection = () => {
    setModalVisible(true);
  };

  const onClassChange = classId => {
    setSelectedClass(classId);
    setSelectedSection(null);
    fetchSections(classId);
  };

  const onConfirmSelection = () => {
    setModalVisible(false);
    fetchStudentsList();
  };

  const fetchTeachersList = useCallback(
    async (isRefreshing = false) => {
      if (!configuredIP) {
        console.error(
          'AdminHomeScreen: Cannot fetch teachers - IP is null/undefined',
        );
        return;
      }

      try {
        if (!isRefreshing && !searchText.trim()) {
          setIsLoading(true);
        }
        const response = await getTeachers(
          configuredIP,
          accessToken,
          searchText,
        );
        setTeachersList(response.teachers || []);
      } catch (err) {
        console.error('Failed to fetch teachers:', err);
        setTeachersList([]);
      } finally {
        setIsLoading(false);
        setIsSearching(false);
      }
    },
    [configuredIP, accessToken, searchText],
  );

  const fetchStudentsList = useCallback(
    async (isRefreshing = false) => {
      if (!configuredIP) {
        console.error(
          'AdminHomeScreen: Cannot fetch students - IP is null/undefined',
        );
        return;
      }

      try {
        if (!isRefreshing && !searchText.trim()) {
          setIsLoading(true);
        }
        const response = await getStudents(
          configuredIP,
          accessToken,
          selectedClass,
          selectedSection,
          searchText,
        );
        setStudentsList(response.students || []);
      } catch (err) {
        console.error('Failed to fetch students:', err);
        setStudentsList([]);
      } finally {
        setIsLoading(false);
        setIsSearching(false);
      }
    },
    [configuredIP, accessToken, selectedClass, selectedSection, searchText],
  );

  const fetchCurrentList = useCallback(
    async (isRefreshing = false) => {
      if (isFetchingRef.current) return; // Prevent concurrent calls

      isFetchingRef.current = true;
      try {
        if (isActiveTab === 0) {
          await fetchTeachersList(isRefreshing);
        } else {
          await fetchStudentsList(isRefreshing);
        }
      } finally {
        isFetchingRef.current = false;
      }
    },
    [isActiveTab, fetchTeachersList, fetchStudentsList],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setIsLoading(false);
    await fetchCurrentList(true);
    setRefreshing(false);
  }, [fetchCurrentList]);

  const debouncedSearch = useCallback(text => {
    setInputText(text);
    setIsSearching(true);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setSearchText(text);
    }, 300);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (configuredIP) {
      fetchClasses();
    } else {
      console.warn('AdminHomeScreen: Skipping fetchClasses - no IP configured');
    }
  }, [fetchClasses, configuredIP]);

  useEffect(() => {
    if (configuredIP) {
      fetchCurrentList();
    } else {
      console.warn(
        'AdminHomeScreen: Skipping fetchCurrentList - no IP configured',
      );
    }
  }, [isActiveTab, searchText, fetchCurrentList, configuredIP]);

  const currentList = isActiveTab === 0 ? teachersList : studentsList;

  const handleTabPress = useCallback(tabIndex => {
    setIsActiveTab(tabIndex);
    setSearchText('');
    setInputText('');
    setIsSearching(false);
  }, []);

  const renderItem = useCallback(
    ({ item }) =>
      isLoading && !refreshing ? (
        renderSkeletonItem()
      ) : (
        <TouchableOpacity
          style={styles.listItem}
          onPress={() =>
            navigation.navigate('CaptureScreen', {
              item,
              selectedTab: isActiveTab,
            })
          }
        >
          <View>
            {item.Photo_uri && configuredIP ? (
              <FastImage
                source={{
                  uri: `http://${configuredIP}:4005${item.Photo_uri}`,
                  priority: FastImage.priority.high,
                }}
                style={{
                  height: 40,
                  width: 40,
                  borderRadius: 4,
                  backgroundColor: colors.userBg,
                }}
                resizeMode={FastImage.resizeMode.cover}
              />
            ) : (
              <AppUserFace />
            )}
          </View>
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.teacherName}>
              {isActiveTab === 0 ? item?.Name : item?.Student_Name}
            </Text>
            <Text style={styles.teacherDetail}>
              {item?.Teacher_id ?? item?.STS_id ?? ''}
            </Text>
          </View>
        </TouchableOpacity>
      ),
    [
      isActiveTab,
      navigation,
      configuredIP,
      isLoading,
      refreshing,
      renderSkeletonItem,
    ],
  );

  const keyExtractor = useCallback(
    item => (item.User_id || item.Student_id || item.id).toString(),
    [],
  );

  const renderSkeletonItem = useCallback(
    () => (
      <View style={styles.listItem}>
        <SkeletonLoader
          width={40}
          height={40}
          style={{ borderRadius: 4, backgroundColor: colors.userBg }}
        />
        <View style={{ marginLeft: 10 }}>
          <SkeletonLoader width={100} height={14} style={{ marginBottom: 5 }} />
          <SkeletonLoader width={80} height={12} />
        </View>
      </View>
    ),
    [],
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.headerBg} />
      <MainHeader navigation={navigation} />

      <View style={styles.subContainer}>
        <TouchableOpacity
          disabled={!isActiveTab}
          style={styles.selectionStatusContainer}
          onPress={onPressSelectClassSection}
        >
          <Text style={styles.statusText}>
            {isActiveTab === 0
              ? 'Registered Teachers'
              : selectedClass && selectedSection
              ? `${
                  classes.find(c => c.Class_id === selectedClass)?.Class_Name ||
                  'Class'
                } - ${
                  sections.find(s => s.Section_id === selectedSection)
                    ?.Section_Name || 'Section'
                }`
              : 'Select Class & Section ▼'}
          </Text>
          <Text style={styles.countText}>{currentList.length} Found</Text>
        </TouchableOpacity>

        <View style={styles.searchBarContainer}>
          <Search />
          <TextInput
            placeholder={
              isActiveTab ? 'Search by Name or STS Number' : 'Search by Name'
            }
            placeholderTextColor={colors.gray}
            style={styles.searchBox}
            value={inputText}
            onChangeText={debouncedSearch}
          />
          {isSearching && (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={styles.searchLoader}
            />
          )}
        </View>

        <View style={styles.listContainer}>
          <FlatList
            data={isLoading && !refreshing ? skeletonData : currentList}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {searchText.trim()
                  ? 'No matching results found'
                  : isActiveTab === 0
                  ? 'No teachers found'
                  : 'No students found'}
              </Text>
            }
            getItemLayout={(data, index) => ({
              length: 70,
              offset: 70 * index,
              index,
            })}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={10}
          />
        </View>

        <View style={styles.TabContainer}>
          <View
            style={[
              styles.slider,
              isActiveTab === 0 ? styles.sliderLeft : styles.sliderRight,
            ]}
          />
          <TouchableOpacity
            style={styles.touchArea}
            onPress={() => handleTabPress(0)}
            activeOpacity={0.7}
          >
            {isActiveTab === 0 ? <TeachersIcon /> : <TeachersIcon1 />}
            <Text
              style={
                isActiveTab === 0 ? styles.activeText : styles.inactiveText
              }
            >
              Teachers
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.touchArea}
            onPress={() => handleTabPress(1)}
            activeOpacity={0.7}
          >
            {isActiveTab === 0 ? <StudentsIcon /> : <StudentsIcon1 />}
            <Text
              style={
                isActiveTab === 1 ? styles.activeText : styles.inactiveText
              }
            >
              Students
            </Text>
          </TouchableOpacity>
        </View>

        <ClassSectionModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          classes={classes}
          sections={sections}
          selectedClass={selectedClass}
          selectedSection={selectedSection}
          onClassChange={onClassChange}
          onSectionChange={setSelectedSection}
          onConfirm={onConfirmSelection}
        />
      </View>
    </SafeAreaView>
  );
};

export default AdminHomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  subContainer: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 15,
  },
  selectionStatusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusText: {
    color: colors.black,
    fontWeight: '600',
    fontSize: 14,
  },
  countText: {
    color: colors.silverGray,
    fontSize: 12,
  },
  searchBarContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: colors.silverGray,
    alignItems: 'center',
    marginVertical: 10,
  },
  searchBox: {
    flex: 1,
    fontSize: 12,
    fontWeight: '400',
    marginLeft: 8,
    paddingVertical: 6,
  },
  searchLoader: {
    marginRight: 8,
  },
  listContainer: {
    flex: 1,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  teacherName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.darkGrayText,
    marginBottom: 5,
  },
  teacherDetail: {
    fontSize: 12,
    color: colors.grayText,
  },
  separator: {
    borderColor: colors.borderSeparator,
    borderBottomWidth: 1,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.grayText,
    marginTop: 40,
  },
  TabContainer: {
    position: 'absolute',
    bottom: 15,
    height: 56,
    width: '100%',
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 30,
    padding: 5,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  slider: {
    position: 'absolute',
    width: '50%',
    height: 46,
    backgroundColor: colors.primary,
    borderRadius: 30,
    top: 5,
  },
  sliderLeft: {
    left: 5,
  },
  sliderRight: {
    left: '50%',
  },
  touchArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  activeText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
    marginHorizontal: 5,
  },
  inactiveText: {
    color: colors.grayText,
    fontWeight: '600',
    fontSize: 14,
    marginHorizontal: 5,
  },
});
