import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
  Animated,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import colors from '../../theme/colors';
import { getInitials } from '../../helpers/getInitials';
import { Logout, BlackOkulr, OkulrLogo, LogoLeftAlign } from '../../assets';

const { width } = Dimensions.get('window');

const SideDrawer = ({ visible, onClose, navigation, userData }) => {
  const { logout } = useAuth();
  const translateX = useRef(new Animated.Value(-width)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    console.log(userData);

    if (visible) {
      setModalVisible(true);
      translateX.setValue(-width);
      opacity.setValue(0);

      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (modalVisible) {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -width,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setModalVisible(false);
      });
    }
  }, [visible, modalVisible]);

  const handleLogoutPress = () => {
    setShowLogoutModal(true);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      setShowLogoutModal(false);
      onClose();
      navigation.reset({
        index: 0,
        routes: [
          {
            name: 'AuthNavigator',
            state: {
              index: 0,
              routes: [{ name: 'LoginScreen' }],
            },
          },
        ],
      });
    } catch (error) {
      console.log('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

  const handleOverlayPress = () => {
    onClose();
  };

  const handleDrawerPress = () => {};

  return (
    <Modal
      visible={modalVisible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={handleOverlayPress}>
        <Animated.View
          style={[
            styles.overlay,
            {
              opacity: opacity,
            },
          ]}
        >
          <TouchableWithoutFeedback onPress={handleDrawerPress}>
            <Animated.View
              style={[
                styles.drawerContainer,
                {
                  transform: [{ translateX: translateX }],
                },
              ]}
            >
              <View style={styles.drawerContent}>
                <View style={styles.topSection}>
                  <View style={styles.headerContainer}>
                    <View style={styles.userBg}>
                      <Text style={styles.initialsText}>
                        {getInitials(userData?.name)}
                      </Text>
                    </View>
                    <OkulrLogo />
                  </View>
                  <View style={styles.topDetailsSection}>
                    <Text style={styles.userName}>{userData?.name}</Text>
                    <Text style={styles.topDetailsTxt}>{userData?.email}</Text>
                    {/* <Text style={styles.topDetailsTxt}>+91 7802877996</Text> */}
                    {userData?.role === 'ADMIN' && (
                      <>
                        <Text style={styles.topDetailsTxt}>
                          Government High School
                        </Text>
                        <Text style={styles.topDetailsTxt}>
                          Soudhamini, 122, B-Block, III main, Gruhalakshmi
                          Layout II Stage, Kamalanagar, Basaveshwar Nagar
                        </Text>
                        <Text style={styles.topDetailsTxt}>
                          Bengaluru - 560079
                        </Text>
                      </>
                    )}
                    {userData?.role === 'TEACHER' && (
                      <Text style={styles.topDetailsTxt}>
                        {userData?.username}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={styles.bottomSection}>
                  <View>
                    <TouchableOpacity
                      onPress={handleLogoutPress}
                      style={styles.logoutsection}
                    >
                      <Logout />
                      <Text style={styles.logoutTxt}>Logout</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{ marginTop: 20, marginBottom: 15 }}
                    >
                      <Text style={styles.commonTxt}>Terms & Conditions</Text>
                    </TouchableOpacity>
                    <TouchableOpacity>
                      <Text style={styles.commonTxt}>About us</Text>
                    </TouchableOpacity>
                  </View>
                  <View>
                    <LogoLeftAlign />
                    <View style={styles.okulrSection}>
                      <Text style={styles.profuctOfTxt}>Product of</Text>
                      <BlackOkulr />
                    </View>
                    <Text style={styles.versionTxt}>Version 1.0.0</Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>

      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelLogout}
      >
        <TouchableWithoutFeedback onPress={handleCancelLogout}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.logoutModalContainer}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Confirm Logout?</Text>
                  <Text style={styles.modalMessage}>
                    You will not receive any notifications
                  </Text>
                </View>
                <View style={styles.modalDivider} />

                <View style={styles.modalButtons}>
                  {isLoggingOut ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text style={styles.loadingText}>Logging out...</Text>
                    </View>
                  ) : (
                    <>
                      <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={handleLogout}
                      >
                        <Text style={styles.logoutButtonText}>Logout</Text>
                      </TouchableOpacity>
                      <View style={styles.buttonDivider} />
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={handleCancelLogout}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    flexDirection: 'row',
  },
  drawerContainer: {
    width: width * 0.75,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  drawerContent: {
    flex: 1,
  },
  userBg: {
    backgroundColor: colors.userBg,
    height: 47,
    width: 47,
    borderRadius: 90 / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    color: colors.semiWhite,
    fontSize: 20,
  },
  topSection: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: Platform.OS === 'ios' ? 55 : 30,
  },
  topDetailsSection: {
    marginTop: 15,
  },
  userName: {
    fontSize: 18,
    color: colors.white,
    fontWeight: 'semibold',
  },
  topDetailsTxt: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'medium',
    marginTop: 10,
    textAlign: 'left',
  },
  bottomSection: {
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingVertical: 50,
    flex: 1,
    justifyContent: 'space-between',
  },
  logoutsection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutTxt: {
    color: colors.red,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 10,
  },
  commonTxt: {
    color: colors.darkGray,
    fontSize: 14,
  },
  okulrSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 10,
  },
  profuctOfTxt: {
    fontSize: 12,
    color: colors.grayText,
    marginRight: 5,
  },
  versionTxt: {
    fontSize: 10,
    color: colors.grayText,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutModalContainer: {
    backgroundColor: colors.white,
    borderRadius: 10,
    width: 310,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 35,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.darkGray,
  },
  closeButton: {
    fontSize: 24,
    color: colors.grayText,
    paddingHorizontal: 4,
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#F2F2F2',
    marginHorizontal: 20,
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: colors.darkGray,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    height: 56,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F2',
  },
  cancelButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.darkGray,
    fontSize: 16,
    fontWeight: '500',
  },
  buttonDivider: {
    width: 1,
    backgroundColor: '#F2F2F2',
  },
  logoutButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButtonText: {
    color: colors.red,
    fontSize: 16,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 16,
    color: colors.darkGray,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

export default SideDrawer;
