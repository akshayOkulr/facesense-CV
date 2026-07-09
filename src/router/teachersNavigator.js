import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AttendanceScreen from '../screens/teachers/AttendanceScreen';
import TeachersAttendance from '../screens/teachers/TeachersAttendance';
import StudentsAttendance from '../screens/teachers/StudentsAttendance';

const Stack = createNativeStackNavigator();
export default function TeachersNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="AttendanceScreen"
    >
      <Stack.Screen name="AttendanceScreen" component={AttendanceScreen} />
      <Stack.Screen name="TeachersAttendance" component={TeachersAttendance} />
      <Stack.Screen name="StudentsAttendance" component={StudentsAttendance} />
    </Stack.Navigator>
  );
}
