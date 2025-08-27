import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Text, TouchableOpacity, View } from 'react-native';
import { getDishImage, updateDishImage, uploadImageToStorage } from '../../lib/foodRatingService';
import { foodTypeImageMap } from '../constants/foodTypes';
import { DishDataShape } from './DishDetails';

interface DishImageProps {
  dishData: DishDataShape;
  setDishData: React.Dispatch<React.SetStateAction<DishDataShape | null>>;
}

export default function DishImage({ dishData, setDishData }: DishImageProps) {
  const [editingImage, setEditingImage] = useState(false);
  const [tempImageUri, setTempImageUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const imageUri = dishData.image ? getDishImage(dishData.image) : null;

  // Reset when dish changes
  useEffect(() => {
    setEditingImage(false);
    setTempImageUri(null);
  }, [dishData.id]);

  async function handlePickImage() {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Permission Needed', 'Media library permission is required to select an image.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled) {
        setTempImageUri(result.assets[0].uri);
        setEditingImage(true);
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not open image picker');
    }
  }

  function handleSaveImage() {
    if (!tempImageUri) return;
    // Optimistic local update
    setDishData(prev => prev ? { ...prev, image: tempImageUri } : prev);

    // If dish is persisted, upload & update backend
    if (dishData.id != null) {
      setSaving(true);
      uploadImageToStorage(tempImageUri, dishData.id)
        .then(({ data, error }) => {
          if (error || !data) {
            console.error(error);
            Alert.alert('Upload Failed', 'Could not upload image.');
            return;
          }
          const fileName = data.Key;
          console.log('Image uploaded to storage with key:', fileName);
          return updateDishImage(dishData.id!, fileName).then(({ error: updErr }) => {
            if (updErr) {
              console.error(updErr);
              Alert.alert('Save Failed', 'Image uploaded but database update failed.');
            }
          });
        })
        .finally(() => setSaving(false));
    }

    setEditingImage(false);
    setTempImageUri(null);
  }

  function handleCancelImage() {
    setEditingImage(false);
    setTempImageUri(null);
  }

  return (
    <>
      <Image
        source={editingImage && tempImageUri ? { uri: tempImageUri } : (dishData.image ? { uri: imageUri } : foodTypeImageMap[dishData.type] || foodTypeImageMap['Other'])}
        style={{ width: 320, height: 320, borderRadius: 16, marginBottom: 12, backgroundColor: '#ffffff33', opacity: dishData.image ? 1 : 0.7 }}
        resizeMode='cover'
      />
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
        {!editingImage && !dishData.image && (
          <TouchableOpacity disabled={saving} onPress={handlePickImage} style={{ backgroundColor: '#1565C0', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, opacity: saving ? 0.6 : 1 }}>
            <Text style={{ color: '#fff', fontWeight: '600' }}>Edit Image</Text>
          </TouchableOpacity>
        )}
        {editingImage && (
          <>
            <TouchableOpacity disabled={saving} onPress={handleSaveImage} style={{ backgroundColor: '#2E7D32', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, opacity: saving ? 0.7 : 1 }}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '600' }}>Save Image</Text>}
            </TouchableOpacity>
            <TouchableOpacity disabled={saving} onPress={handleCancelImage} style={{ backgroundColor: '#B71C1C', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, opacity: saving ? 0.7 : 1 }}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </>
  );
}
