import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
  Pressable,
} from 'react-native';
import colors from '../../theme/colors';
import {
  getClasses,
  getSections,
  getPeriods,
  getAllSubjects,
} from '../../api/adminApi';
import moment from 'moment';
import { useAuth } from '../../contexts/AuthContext';

const DROPDOWN_HEIGHT = 160;

const AttendanceModal = ({ visible, onClose, onSubmit }) => {
  const { accessToken, configuredIP, userDetails } = useAuth();

  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [showClass, setShowClass] = useState(false);
  const [showSection, setShowSection] = useState(false);
  const [showPeriod, setShowPeriod] = useState(false);
  const [showSubject, setShowSubject] = useState(false);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const classAnim = useRef(new Animated.Value(0)).current;
  const sectionAnim = useRef(new Animated.Value(0)).current;
  const periodAnim = useRef(new Animated.Value(0)).current;
  const subjectAnim = useRef(new Animated.Value(0)).current;

  const fetchClasses = useCallback(async () => {
    try {
      const ip = configuredIP;
      const token = accessToken;
      const response = await getClasses(ip, token);
      setClasses(response.classes || []);
    } catch (err) {
      console.error('Failed to fetch classes:', err);
      setClasses([]);
    }
  }, []);

  const fetchSections = useCallback(async classId => {
    if (!classId) {
      setSections([]);
      return;
    }
    try {
      const ip = configuredIP;
      const token = accessToken;
      const response = await getSections(ip, token, classId);
      setSections(response.sections || []);
    } catch (err) {
      console.error('Failed to fetch sections:', err);
      setSections([]);
    }
  }, []);

  const fetchPeriods = useCallback(async (classId, sectionId) => {
    if (!classId || !sectionId) {
      setPeriods([]);
      return;
    }
    try {
      const ip = configuredIP;
      const token = accessToken;
      const response = await getPeriods(ip, token, classId, sectionId);
      console.log('response', response);

      setPeriods(response.periods || []);
    } catch (err) {
      console.error('Failed to fetch periods:', err);
      setPeriods([]);
    }
  }, []);

  const fetchSubjects = useCallback(async () => {
    try {
      const ip = configuredIP;
      const token = accessToken;
      const response = await getAllSubjects(ip, token);
      setSubjects(response.subjects || []);
    } catch (err) {
      console.error('Failed to fetch subjects:', err);
      setSubjects([]);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
    fetchSubjects();
  }, [fetchClasses, fetchSubjects]);

  useEffect(() => {
    if (selectedClass) {
      fetchSections(selectedClass);
      setSelectedSection(null); // Reset section when class changes
      setSelectedPeriod(''); // Reset period when class changes
    }
  }, [selectedClass, fetchSections]);

  useEffect(() => {
    if (selectedClass && selectedSection) {
      fetchPeriods(selectedClass, selectedSection);
      setSelectedPeriod(''); // Reset period when section changes
    }
  }, [selectedClass, selectedSection, fetchPeriods]);

  const animateDropdown = (animValue, open) => {
    Animated.timing(animValue, {
      toValue: open ? 1 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start();
  };

  const closeAllDropdowns = () => {
    animateDropdown(classAnim, false);
    animateDropdown(sectionAnim, false);
    animateDropdown(periodAnim, false);
    animateDropdown(subjectAnim, false);
    setShowClass(false);
    setShowSection(false);
    setShowPeriod(false);
    setShowSubject(false);
  };

  const toggleDropdown = type => {
    if (type === 'class') {
      const open = !showClass;
      animateDropdown(classAnim, open);
      animateDropdown(sectionAnim, false);
      animateDropdown(periodAnim, false);
      animateDropdown(subjectAnim, false);
      setShowClass(open);
      setShowSection(false);
      setShowPeriod(false);
      setShowSubject(false);
    } else if (type === 'section') {
      const open = !showSection;
      animateDropdown(sectionAnim, open);
      animateDropdown(classAnim, false);
      animateDropdown(periodAnim, false);
      animateDropdown(subjectAnim, false);
      setShowSection(open);
      setShowClass(false);
      setShowPeriod(false);
      setShowSubject(false);
    } else if (type === 'period') {
      const open = !showPeriod;
      animateDropdown(periodAnim, open);
      animateDropdown(classAnim, false);
      animateDropdown(sectionAnim, false);
      animateDropdown(subjectAnim, false);
      setShowPeriod(open);
      setShowClass(false);
      setShowSection(false);
      setShowSubject(false);
    } else if (type === 'subject' && selectedPeriod) {
      const open = !showSubject;
      animateDropdown(subjectAnim, open);
      animateDropdown(classAnim, false);
      animateDropdown(sectionAnim, false);
      animateDropdown(periodAnim, false);
      setShowSubject(open);
      setShowClass(false);
      setShowSection(false);
      setShowPeriod(false);
    }
  };

  const classHeight = classAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, DROPDOWN_HEIGHT],
  });

  const classOpacity = classAnim;

  const sectionHeight = sectionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, DROPDOWN_HEIGHT],
  });

  const sectionOpacity = sectionAnim;

  const periodHeight = periodAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, DROPDOWN_HEIGHT],
  });

  const periodOpacity = periodAnim;

  const subjectHeight = subjectAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, DROPDOWN_HEIGHT],
  });

  const subjectOpacity = subjectAnim;

  const handleNext = () => {
    if (selectedClass && selectedSection && selectedPeriod && selectedSubject) {
      const className = classes.find(
        c => c.Class_id === selectedClass,
      )?.Class_Name;
      const sectionName = sections.find(
        s => s.Section_id === selectedSection,
      )?.Section_Name;
      const periodName =
        periods.find(p => p.Period_id === selectedPeriod)?.Period_Name ||
        selectedPeriod;
      const subjectName =
        subjects.find(s => s.Subject_id === selectedSubject)?.Subject_Name ||
        selectedSubject;
      onSubmit({
        class: className,
        section: sectionName,
        period: periodName,
        subject: subjectName,
        classId: selectedClass,
        sectionId: selectedSection,
        periodId: selectedPeriod,
        subjectId: selectedSubject,
      });
      setSelectedClass(null);
      setSelectedSection(null);
      setSelectedPeriod('');
      setSelectedSubject('');
      closeAllDropdowns();
    }
  };

  const isFormValid =
    selectedClass !== null &&
    selectedSection !== null &&
    selectedPeriod &&
    selectedSubject;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable
        style={styles.overlay}
        onPress={() => {
          closeAllDropdowns();
          onClose();
        }}
      >
        <Pressable onPress={() => {}} style={{ width: '80%' }}>
          <View style={styles.modal}>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => toggleDropdown('class')}
            >
              <Text style={styles.dropdownText}>
                {selectedClass
                  ? classes.find(c => c.Class_id === selectedClass)?.Class_Name
                  : 'Class'}
              </Text>
              <Text style={styles.arrow}>▼</Text>
            </TouchableOpacity>

            {showClass && (
              <Animated.View
                style={[
                  styles.dropdownList,
                  { height: classHeight, opacity: classOpacity },
                ]}
              >
                <ScrollView keyboardShouldPersistTaps="handled">
                  {classes.map(cls => (
                    <TouchableOpacity
                      key={cls.Class_id}
                      style={styles.option}
                      onPress={() => {
                        setSelectedClass(cls.Class_id);
                        closeAllDropdowns();
                      }}
                    >
                      <Text style={styles.optionText}>{cls.Class_Name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </Animated.View>
            )}

            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => toggleDropdown('section')}
            >
              <Text style={styles.dropdownText}>
                {selectedSection
                  ? sections.find(s => s.Section_id === selectedSection)
                      ?.Section_Name
                  : 'Section'}
              </Text>
              <Text style={styles.arrow}>▼</Text>
            </TouchableOpacity>

            {showSection && (
              <Animated.View
                style={[
                  styles.dropdownList,
                  { height: sectionHeight, opacity: sectionOpacity },
                ]}
              >
                <ScrollView keyboardShouldPersistTaps="handled">
                  {sections.map(sec => (
                    <TouchableOpacity
                      key={sec.Section_id}
                      style={styles.option}
                      onPress={() => {
                        setSelectedSection(sec.Section_id);
                        closeAllDropdowns();
                      }}
                    >
                      <Text style={styles.optionText}>{sec.Section_Name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </Animated.View>
            )}

            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => toggleDropdown('period')}
            >
              <Text style={styles.dropdownText}>
                {selectedPeriod
                  ? periods.find(p => p.Period_id === selectedPeriod)
                      ?.Period_Name || selectedPeriod
                  : 'Period'}
              </Text>
              <Text style={styles.arrow}>▼</Text>
            </TouchableOpacity>

            {showPeriod && (
              <Animated.View
                style={[
                  styles.dropdownList,
                  { height: periodHeight, opacity: periodOpacity },
                ]}
              >
                <ScrollView keyboardShouldPersistTaps="handled">
                  {periods.map((period, index) => (
                    <TouchableOpacity
                      key={period.Period_id || `period-${index}`}
                      style={styles.option}
                      onPress={() => {
                        setSelectedPeriod(period.Period_id);
                        setSelectedSubject(period.Subject_id);
                        setSelectedSubject(period.Subject.Subject_id);
                        closeAllDropdowns();
                      }}
                    >
                      <Text style={styles.optionText}>
                        {period.Period_Name}
                      </Text>
                      <Text style={styles.optionText}>
                        {moment(period.Start_time).format('hh:mm A')} -{' '}
                        {moment(period.End_time).format('hh:mm A')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </Animated.View>
            )}

            {selectedPeriod && (
              <>
                <TouchableOpacity
                  style={styles.dropdown}
                  onPress={() => toggleDropdown('subject')}
                >
                  <Text style={styles.dropdownText}>
                    {selectedSubject
                      ? subjects.find(s => s.Subject_id === selectedSubject)
                          ?.Subject_Name || selectedSubject
                      : 'Subject'}
                  </Text>
                  <Text style={styles.arrow}>▼</Text>
                </TouchableOpacity>

                {showSubject && (
                  <Animated.View
                    style={[
                      styles.dropdownList,
                      { height: subjectHeight, opacity: subjectOpacity },
                    ]}
                  >
                    <ScrollView keyboardShouldPersistTaps="handled">
                      {subjects.map((subject, index) => (
                        <TouchableOpacity
                          key={subject.Subject_id || `subject-${index}`}
                          style={styles.option}
                          onPress={() => {
                            setSelectedSubject(subject.Subject_id);
                            closeAllDropdowns();
                          }}
                        >
                          <Text style={styles.optionText}>
                            {subject.Subject_Name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </Animated.View>
                )}
              </>
            )}

            <TouchableOpacity
              style={[
                styles.confirmButton,
                !isFormValid && styles.confirmButtonDisabled,
              ]}
              onPress={handleNext}
              disabled={!isFormValid}
            >
              <Text style={styles.confirmText}>NEXT</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 30,
    width: '100%',
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.silverGray,
    borderRadius: 4,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  dropdownText: {
    fontSize: 16,
    color: colors.black,
  },
  arrow: {
    fontSize: 14,
  },
  dropdownList: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.silverGray,
    borderRadius: 6,
    marginBottom: 15,
  },
  option: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSeparator,
  },
  optionText: {
    fontSize: 16,
    color: colors.black,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 10,
    width: '50%',
    alignSelf: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  confirmText: {
    color: colors.white,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default AttendanceModal;
