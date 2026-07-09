/**
 * Cropped Face Preview Component
 * Displays cropped face images in a grid layout
 */

import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
} from 'react-native';

const CroppedFacePreview = ({ croppedFaces, onBack }) => {
  return (
    <SafeAreaView style={styles.previewContainer}>
      <View style={styles.previewHeader}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.previewTitle}>
          Cropped Faces ({croppedFaces.length})
        </Text>
      </View>
      <FlatList
        data={croppedFaces}
        keyExtractor={(item, index) => index.toString()}
        style={styles.croppedFacesContainer}
        numColumns={3}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item: face, index }) => (
          <View style={styles.croppedFaceItem}>
            <Image source={{ uri: face.uri }} style={styles.croppedFaceImage} />
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  previewContainer: { flex: 1, backgroundColor: '#000' },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  backButton: { padding: 10 },
  backButtonText: { color: 'white', fontSize: 16 },
  previewTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 20,
  },
  croppedFacesContainer: { flex: 1 },
  croppedFaceItem: {
    margin: 10,
    height: 50,
    width: 50,
    overflow: 'hidden',
  },
  croppedFaceImage: {
    width: '100%',
    height: '100%',
    marginBottom: 10,
    resizeMode: 'contain',
  },
});

export default CroppedFacePreview;
