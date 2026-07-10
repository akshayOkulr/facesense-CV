import React, { useState } from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import colors from '../../theme/colors';
import { useAuth } from '../../contexts/AuthContext';
import { getInitials } from '../../helpers/getInitials';
import SideDrawer from '../drawer/SideDrawer';

const MainHeader = ({ navigation }) => {
  const { userDetails } = useAuth();
  const [drawerVisible, setDrawerVisible] = useState(false);

  const handleDrawerOpen = () => {
    setDrawerVisible(true);
  };

  const handleDrawerClose = () => {
    setDrawerVisible(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={colors.headerBg} barStyle={'dark-content'} />
      <View style={styles.headerContainer}>
        <View style={styles.leftContainer}>
          <TouchableOpacity style={styles.userBg} onPress={handleDrawerOpen}>
            <Text style={styles.initialsText}>
              {getInitials(userDetails?.name)}
            </Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.userNameTxt}>{userDetails?.name}</Text>
            <Text style={styles.subText}>{userDetails?.email}</Text>
          </View>
        </View>
      </View>
      <SideDrawer
        visible={drawerVisible}
        onClose={handleDrawerClose}
        navigation={navigation}
        userData={userDetails}
      />
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
    justifyContent: 'space-between',
    padding: 15,
  },
  userBg: {
    backgroundColor: colors.userBg,
    height: 48,
    width: 48,
    borderRadius: 90 / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  initialsText: {
    color: colors.semiWhite,
    fontSize: 20,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userNameTxt: {
    color: colors.black,
    fontSize: 16,
    fontWeight: '600',
  },
  subText: {
    color: colors.grayText,
    fontSize: 12,
  },
});

export default MainHeader;
