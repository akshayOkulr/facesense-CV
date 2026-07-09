import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthNavigator from './authNavigator';

const Stack = createNativeStackNavigator();

export default function Router() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="AuthNavigator"
    >
      <Stack.Screen name="AuthNavigator" component={AuthNavigator} />
    </Stack.Navigator>
  );
}
