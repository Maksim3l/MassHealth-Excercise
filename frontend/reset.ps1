# Clean up previous builds
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue android/.gradle
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue android/app/build
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue android/build

# Uninstall and reinstall problematic native modules
npm uninstall react-native-reanimated react-native-gesture-handler react-native-screens react-native-safe-area-context react-native-svg react-native-webview

# Install compatible versions
npm install react-native-reanimated@3.6.0 react-native-gesture-handler@2.14.0 react-native-screens@3.29.0 react-native-safe-area-context@4.8.2 react-native-svg@14.1.0 react-native-webview@13.6.3

# Regenerate native code
npx expo prebuild --clean

# Try building again
cd android
./gradlew clean
cd ..
npx expo run:android
