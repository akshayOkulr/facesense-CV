import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Modal,
} from 'react-native';
import colors from '../theme/colors';
import AppText from './AppText';

const IpConfigModal = ({
  visible,
  onRequestClose,
  title = 'Configure IP Address',
  placeholder = 'Enter IP (e.g. 192.168.0.172)',
  value,
  onChangeText,
  onSubmitEditing,
  buttonText = 'CONFIGURE',
  onPress,
  isLoading = false,
  inputRef,
  onShow,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onRequestClose}
      statusBarTranslucent
      onShow={onShow}
    >
      <Pressable style={styles.modalOverlay} onPress={onRequestClose}>
        <Pressable
          onPress={e => e.stopPropagation?.()}
          onStartShouldSetResponder={() => true}
          style={styles.modalContainer}
        >
          <AppText text={title} style={styles.modalTitle} />

          <TextInput
            ref={inputRef}
            style={styles.modalInput}
            placeholder={placeholder}
            placeholderTextColor="#999"
            value={value}
            onChangeText={onChangeText}
            keyboardType="default"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={onSubmitEditing}
          />

          <TouchableOpacity
            style={[
              styles.configureButton,
              isLoading && styles.configuringButton,
            ]}
            onPress={onPress}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.configuringText}>Configuring...</Text>
              </View>
            ) : (
              <Text style={styles.configureButtonText}>{buttonText}</Text>
            )}
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default IpConfigModal;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'left',
    marginBottom: 15,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    color: '#333',
    backgroundColor: '#f9f9f9',
  },
  configureButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    alignSelf: 'center',
  },
  configuringButton: {
    opacity: 0.8,
  },
  configureButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  configuringText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 8,
  },
});
