import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import colors from '../../theme/colors';
import moment from 'moment';

const calculateTimeRemaining = (startTime, endTime) => {
  if (!startTime || !endTime) return null;

  const now = moment();
  const start = moment(startTime);
  const end = moment(endTime);

  if (now.isBetween(start, end, null, '[]')) {
    const diffToEnd = end.diff(now, 'seconds');
    const duration = moment.duration(diffToEnd, 'seconds');
    const hours = duration.hours();
    const minutes = duration.minutes();
    const seconds = duration.seconds();

    if (hours > 0) {
      return `Ends in ${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `Ends in ${minutes}m ${seconds}s`;
    } else {
      return `Ends in ${seconds}s`;
    }
  }

  return;
};

const ClassCard = React.memo(({ item, onPress }) => {
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    if (item.startTime && item.endTime) {
      const interval = setInterval(() => {
        const remaining = calculateTimeRemaining(item.startTime, item.endTime);
        setTimeRemaining(remaining);
      }, 1000);

      const initialRemaining = calculateTimeRemaining(
        item.startTime,
        item.endTime,
      );
      setTimeRemaining(initialRemaining);

      return () => clearInterval(interval);
    } else {
      setTimeRemaining('');
    }
  }, [item.startTime, item.endTime]);

  const isClickable =
    item.isActive ||
    (item.startTime && moment().isAfter(moment(item.startTime)));

  return (
    <TouchableOpacity
      style={styles.classCard}
      onPress={onPress}
      disabled={!isClickable}
    >
      <View style={styles.classInfo}>
        <Text
          style={styles.className}
        >{`${item.className} - ${item.section}`}</Text>
        <Text style={styles.periodText}>{`${item.period} (${moment(
          item.startTime,
        ).format('hh:mm A')} - ${moment(item.endTime).format(
          'hh:mm A',
        )})`}</Text>
        <Text style={styles.subjectText}>{item.subject}</Text>
      </View>
      <View style={styles.attendanceInfo}>
        <Text style={styles.attendanceNumbers}>
          {`${item?.sessionData?.attendance?.present}`}/
          {`${item?.sessionData?.attendance?.total}`}
        </Text>
        {timeRemaining && (
          <Text style={styles.timeRemainingText}>{timeRemaining}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  classCard: {
    backgroundColor: colors.headerBg,
    borderRadius: 4,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  periodText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  subjectText: {
    fontSize: 12,
    color: '#666',
  },
  timeRemainingText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    color: colors.greenColor,
  },
  attendanceInfo: {
    alignItems: 'center',
  },
  attendanceNumbers: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
});

export default ClassCard;
