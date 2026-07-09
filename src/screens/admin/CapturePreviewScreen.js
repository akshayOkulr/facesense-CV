import {
  StatusBar,
  StyleSheet,
  Text,
  ScrollView,
  View,
  TouchableOpacity,
  Image,
} from 'react-native';
import AppHeader from '../../components/header/AppHeader';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../../theme/colors';
import { useEffect } from 'react';

const CapturePreviewScreen = ({ navigation, route }) => {
  const { faceData, apiResponse, item, selectedTab } = route?.params || {};

  useEffect(() => {
    console.log('API Response:', apiResponse);
    console.log('item:', item);
  }, []);

  const onSubmit = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'AdminHomeScreen', params: { selectedTab } }],
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.headerBg} />
      <AppHeader title={'Preview'} onPressBack={onSubmit} />

      <ScrollView
        contentContainerStyle={{
          alignItems: 'center',
          justifyContent: 'center',
        }}
        style={styles.contentContainer}
      >
        <View style={styles.imageContainer}>
          <Image source={{ uri: faceData.uri }} style={styles.imageContainer} />
        </View>
        <View>
          <View style={styles.detailsContainer}>
            <Text style={styles.field}>STS Number</Text>
            <Text style={styles.dash}>-</Text>
            <Text style={styles.values}>{item?.STS_id || 'N/A'}</Text>
          </View>
          <View style={styles.detailsContainer}>
            <Text style={styles.field}>Name</Text>
            <Text style={styles.dash}>-</Text>
            <Text style={styles.values}>{item?.Student_Name || 'N/A'}</Text>
          </View>
          <View style={styles.detailsContainer}>
            <Text style={styles.field}>Class</Text>
            <Text style={styles.dash}>-</Text>
            <Text style={styles.values}>
              {item?.Class?.Class_Name || 'N/A'}
            </Text>
          </View>
          <View style={styles.detailsContainer}>
            <Text style={styles.field}>Section</Text>
            <Text style={styles.dash}>-</Text>
            <Text style={styles.values}>
              {item?.Section?.Section_Name || 'N/A'}
            </Text>
          </View>
          <View style={styles.detailsContainer}>
            <Text style={styles.field}>Batch</Text>
            <Text style={styles.dash}>-</Text>
            <Text style={styles.values}>
              {item?.Batch?.Academic_year || 'N/A'}
            </Text>
          </View>
          <View style={styles.detailsContainer}>
            <Text style={styles.field}>Gender</Text>
            <Text style={styles.dash}>-</Text>
            <Text style={styles.values}>{item?.Gender || 'N/A'}</Text>
          </View>
          <View style={styles.detailsContainer}>
            <Text style={styles.field}>DOB</Text>
            <Text style={styles.dash}>-</Text>
            <Text style={styles.values}>
              {item?.Date_of_Birth
                ? new Date(item.Date_of_Birth).toLocaleDateString()
                : 'N/A'}
            </Text>
          </View>
        </View>
        <View style={styles.btnContainer}>
          <TouchableOpacity style={styles.btn} onPress={onSubmit}>
            <Text style={styles.btnTitle}>SUBMIT</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CapturePreviewScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.headerBg,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.background,
  },
  imageContainer: {
    borderWidth: 1,
    height: 280,
    width: 280,
    borderRadius: 10,
  },
  field: {
    fontSize: 14,
    fontWeight: 'medium',
    color: colors.darkGray,
    width: '30%',
    textAlign: 'left',
  },
  values: {
    fontSize: 14,
    color: colors.darkText,
    fontWeight: 'semibold',
    width: '30%',
  },
  detailsContainer: {
    flexDirection: 'row',
    marginTop: 15,
    width: '90%',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  dash: {
    width: '30%',
    textAlign: 'center',
  },
  btnContainer: {
    marginTop: 25,
    padding: 10,
  },
  btn: {
    height: 40,
    width: 140,
    backgroundColor: colors.primary,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnTitle: {
    fontSize: 14,
    color: colors.white,
    fontWeight: 'bold',
  },
});
