import React, { useEffect, useState } from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import colors from '../../theme/colors';
import { BackArrow } from '../../assets';

const AppHeader = props => {
  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={colors.headerBg} barStyle={'dark-content'} />
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={props.onPressBack}>
          <BackArrow />
        </TouchableOpacity>
        <Text style={styles.title}>{props.title}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.headerBg,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  title: {
    fontSize: 16,
    color: colors.black,
    fontWeight: '600',
    marginLeft: 10,
  },
});

export default AppHeader;
