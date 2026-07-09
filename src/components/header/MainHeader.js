import React, { useEffect, useState, useRef } from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Keyboard,
} from 'react-native';
import colors from '../../theme/colors';
import { useAuth } from '../../contexts/AuthContext';
import { getInitials } from '../../helpers/getInitials';
import { SettingIcon } from '../../assets';
import SideDrawer from '../drawer/SideDrawer';
import IpConfigModal from '../IpConfigModal';
import Toast from 'react-native-toast-message';

const MainHeader = ({ navigation }) => {
  const { userDetails, configuredIP, updateIP } = useAuth();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [ipAddress, setIpAddress] = useState('');
  const [isConfiguring, setIsConfiguring] = useState(false);

  const ipInputRef = useRef(null);

  useEffect(() => {
    if (configuredIP) {
      setIpAddress(configuredIP);
    }
  }, [configuredIP]);

  const handleDrawerOpen = () => {
    setDrawerVisible(true);
  };

  const handleDrawerClose = () => {
    setDrawerVisible(false);
  };

  const openConfigModal = () => {
    setModalVisible(true);
  };

  const closeConfigModal = () => {
    setModalVisible(false);
    setIsConfiguring(false);
    Keyboard.dismiss();
  };

  const handleConfigure = async () => {
    const value = ipAddress.trim();

    if (!value) {
      Keyboard.dismiss();
      Toast.show({
        type: 'AppError',
        text1: 'Validation',
        text2: 'Please enter an IP address',
        position: 'bottom',
      });
      return;
    }

    try {
      setIsConfiguring(true);
      Keyboard.dismiss();
      await updateIP(value);
      setTimeout(() => {
        setIsConfiguring(false);
        closeConfigModal();
        Toast.show({
          type: 'AppSuccess',
          text1: 'Success',
          text2: 'IP address configured successfully',
          position: 'bottom',
        });
      }, 600);
    } catch (e) {
      setIsConfiguring(false);
      Toast.show({
        type: 'AppError',
        text1: 'Error',
        text2: 'Failed to save IP address',
        position: 'bottom',
      });
    }
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
        <TouchableOpacity onPress={openConfigModal}>
          <SettingIcon />
        </TouchableOpacity>
      </View>
      <SideDrawer
        visible={drawerVisible}
        onClose={handleDrawerClose}
        navigation={navigation}
        userData={userDetails}
      />

      <IpConfigModal
        visible={modalVisible}
        onRequestClose={closeConfigModal}
        value={ipAddress}
        onChangeText={setIpAddress}
        onSubmitEditing={handleConfigure}
        onPress={handleConfigure}
        isLoading={isConfiguring}
        inputRef={ipInputRef}
        onShow={() => ipInputRef.current?.focus()}
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
