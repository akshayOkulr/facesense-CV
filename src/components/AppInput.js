import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import colors from '../theme/colors';
import { ClosedEye, OpenEye } from '../assets';

const AppInput = ({
  value,
  onChangeText,
  onFocus,
  onBlur,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoCorrect = false,
  label,
  style,
  inputStyle,
  placeholderTextColor = 'rgba(255,255,255,0.7)',
  accessibilityLabel,
  accessibilityHint,
  testID,
  isPassword = false,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleFocus = () => {
    setIsFocused(true);
    if (onFocus) onFocus();
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (onBlur) onBlur();
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const showLabel = isFocused || value;
  const isPasswordField = secureTextEntry || isPassword;

  const finalAccessibilityLabel = accessibilityLabel || label || placeholder;
  const finalAccessibilityHint =
    accessibilityHint ||
    (isPasswordField
      ? 'Enter your password securely'
      : `Enter your ${label?.toLowerCase() || 'information'}`);

  return (
    <View style={[styles.inputWrapper, style]} accessible={false}>
      {showLabel && <Text style={styles.floatingLabel}>{label}</Text>}
      <View style={styles.inputContainer}>
        <TextInput
          placeholder={showLabel ? '' : placeholder}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={isPasswordField && !isPasswordVisible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          style={[
            styles.input,
            isPasswordField && styles.passwordInput,
            inputStyle,
          ]}
          placeholderTextColor={placeholderTextColor}
          accessibilityLabel={finalAccessibilityLabel}
          accessibilityHint={finalAccessibilityHint}
          testID={testID}
          textContentType={isPasswordField ? 'password' : 'none'}
          enablesReturnKeyAutomatically={true}
          {...props}
        />
        {isPasswordField && (
          <TouchableOpacity
            style={styles.eyeIconContainer}
            onPress={togglePasswordVisibility}
            activeOpacity={0.7}
            accessibilityLabel={
              isPasswordVisible ? 'Hide password' : 'Show password'
            }
            accessibilityRole="button"
          >
            {isPasswordVisible ? <OpenEye /> : <ClosedEye />}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  inputWrapper: {
    position: 'relative',
    marginBottom: 15,
  },
  floatingLabel: {
    position: 'absolute',
    top: -10,
    left: 10,
    zIndex: 1,
    fontSize: 12,
    color: colors.white,
    backgroundColor: colors.primary,
    paddingHorizontal: 4,
    borderRadius: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  input: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    color: colors.white,
    fontSize: 16,
    backgroundColor: colors.primary,
    fontWeight: '600',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeIconContainer: {
    position: 'absolute',
    right: 12,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 44,
    minHeight: 44,
  },
  iconContainer: {
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 44,
    minHeight: 44,
  },
});

export default AppInput;
