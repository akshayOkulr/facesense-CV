import React from 'react';
import { Modal, Text, StyleSheet, Pressable } from 'react-native';
import colors from '../theme/colors';

const ForgotPasswordModal = ({ visible, onClose }) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modal} onPress={e => e.stopPropagation()}>
          <Text style={styles.title}>Forgot ID/Password?</Text>

          <Text style={styles.description}>
            Contact your school admin to know your{'\n'}
            <Text style={styles.emphasis}>USER ID</Text> and for resetting your{' '}
            <Text style={styles.emphasis}>PASSWORD</Text>.
          </Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default ForgotPasswordModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 40,
    maxWidth: 600,
    width: '90%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.black,
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 12,
    color: '#666',
    lineHeight: 20,
    textAlign: 'center',
  },
  emphasis: {
    fontWeight: '600',
    color: '#333',
    fontSize: 12,
  },
});
