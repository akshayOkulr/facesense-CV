import { StyleSheet } from 'react-native';
import { Text } from 'react-native';

const AppText = ({ text, style }) => {
  return <Text style={[styles.txt, style]}>{text}</Text>;
};
export default AppText;

const styles = StyleSheet.create({
  txt: {
    fontFamily: 'Inter_28pt-Regular',
  },
});
