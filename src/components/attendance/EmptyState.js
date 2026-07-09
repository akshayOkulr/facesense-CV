import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '../../theme/colors';
import { NoSession } from '../../assets';

const EmptyState = () => (
  <View style={styles.emptyContainer}>
    <NoSession />
    <Text style={styles.emptyText}>No Active Sessions!</Text>
  </View>
);

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.darkText,
  },
});

export default EmptyState;
