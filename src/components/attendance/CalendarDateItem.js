import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import colors from '../../theme/colors';

const CalendarDateItem = ({ item, isSelected, onPress, disabled }) => {
  return (
    <TouchableOpacity
      style={[styles.dateItem, isSelected && styles.selectedDateItem]}
      onPress={onPress}
      activeOpacity={disabled ? 1 : 0.7}
      disabled={disabled}
    >
      <View style={styles.dateContent}>
        <Text
          style={[
            styles.dayText,
            isSelected && styles.selectedText,
            disabled && styles.disabledText,
          ]}
        >
          {item.day}
        </Text>
        <Text
          style={[
            styles.dateText,
            isSelected && styles.selectedText,
            disabled && styles.disabledText,
          ]}
        >
          {item.date}
        </Text>
        {item.isToday && !isSelected && <View style={styles.todayIndicator} />}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  dateItem: {
    width: 55,
    height: 65,
    marginHorizontal: 4,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  selectedDateItem: {
    backgroundColor: colors.userBg,
    shadowRadius: 4,
  },
  dateContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: '500',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 18,
    color: colors.white,
    fontWeight: 'bold',
  },
  selectedText: {
    color: colors.primary,
  },
  disabledText: {
    color: 'rgba(255, 255, 255, 0.4)',
  },
  todayIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.white,
    marginTop: 4,
  },
});

export default CalendarDateItem;
