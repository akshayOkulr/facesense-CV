import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from '../screens/auth/SplashScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import AdminNavigator from './adminNavigator';
import TeachersNavigator from './teachersNavigator';
import CreatePasswordScreen from '../screens/auth/CreatePasswordScreen';

const Stack = createNativeStackNavigator();
export default function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="SplashScreen"
    >
      <Stack.Screen name="SplashScreen" component={SplashScreen} />
      <Stack.Screen name="LoginScreen" component={LoginScreen} />
      <Stack.Screen
        name="CreatePasswordScreen"
        component={CreatePasswordScreen}
      />
      <Stack.Screen name="AdminNavigator" component={AdminNavigator} />
      <Stack.Screen name="TeachersNavigator" component={TeachersNavigator} />
    </Stack.Navigator>
  );
}
