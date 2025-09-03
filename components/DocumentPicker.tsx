import * as ImagePicker from 'expo-image-picker';
import React from 'react';
import { Alert, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';

interface DocumentPickerProps {
  onDocumentPicked: (uri: string, name: string) => void;
}

const DocumentPicker: React.FC<DocumentPickerProps> = ({ onDocumentPicked }) => {
  const pickDocument = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      const filename = uri.split('/').pop();
      if (filename) {
        onDocumentPicked(uri, filename);
      } else {
        Alert.alert('Error', 'Could not get filename.');
      }
    } else {
      Alert.alert('Info', 'Document picking cancelled.');
    }
  };

  return (
    <Button mode="outlined" onPress={pickDocument} style={styles.button}>
      Pick Document
    </Button>
  );
};

const styles = StyleSheet.create({
  button: {
    marginTop: 10,
    marginBottom: 10,
    width: '100%',
  },
});

export default DocumentPicker;
