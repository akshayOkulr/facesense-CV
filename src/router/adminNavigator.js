import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdminHomeScreen from '../screens/admin/AdminHomeScreen';
import CaptureScreen from '../screens/admin/CaptureScreen';
import CapturePreviewScreen from '../screens/admin/CapturePreviewScreen';

const Stack = createNativeStackNavigator();
export default function AdminNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="AdminHomeScreen"
    >
      <Stack.Screen name="AdminHomeScreen" component={AdminHomeScreen} />
      <Stack.Screen name="CaptureScreen" component={CaptureScreen} />
      <Stack.Screen
        name="CapturePreviewScreen"
        component={CapturePreviewScreen}
      />
    </Stack.Navigator>
  );
}
