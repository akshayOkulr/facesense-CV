import React, { useRef, useState } from 'react';
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
import colors from '../theme/colors';

const DROPDOWN_HEIGHT = 160;

const ClassSectionModal = ({
  visible,
  onClose,
  classes = [],
  sections = [],
  selectedClass,
  selectedSection,
  onClassChange,
  onSectionChange,
  onConfirm,
}) => {
  const [showClass, setShowClass] = useState(false);
  const [showSection, setShowSection] = useState(false);

  const classAnim = useRef(new Animated.Value(0)).current;
  const sectionAnim = useRef(new Animated.Value(0)).current;

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
    setShowClass(false);
    setShowSection(false);
  };

  const toggleDropdown = type => {
    if (type === 'class') {
      const open = !showClass;
      animateDropdown(classAnim, open);
      animateDropdown(sectionAnim, false);
      setShowClass(open);
      setShowSection(false);
    } else {
      const open = !showSection;
      animateDropdown(sectionAnim, open);
      animateDropdown(classAnim, false);
      setShowSection(open);
      setShowClass(false);
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

  const selectedClassName =
    classes.find(c => c.Class_id === selectedClass)?.Class_Name || 'Class';

  const selectedSectionName =
    sections.find(s => s.Section_id === selectedSection)?.Section_Name ||
    'Section';

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
              <Text style={styles.dropdownText}>{selectedClassName}</Text>
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
                        onClassChange(cls.Class_id);
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
              <Text style={styles.dropdownText}>{selectedSectionName}</Text>
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
                        onSectionChange(sec.Section_id);
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
              style={styles.confirmButton}
              onPress={() => {
                closeAllDropdowns();
                onConfirm();
              }}
            >
              <Text style={styles.confirmText}>NEXT</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default ClassSectionModal;
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
  confirmText: {
    color: colors.white,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
