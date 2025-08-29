import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { updateDishDescription } from '../../lib/foodRatingService';
import { DishDataShape } from './DishDetails';

interface DishDescriptionProps {
  dishData: DishDataShape;
  setDishData: React.Dispatch<React.SetStateAction<DishDataShape | null>>;
}

export default function DishDescription({ dishData, setDishData }: DishDescriptionProps) {
  const [editing, setEditing] = useState(false);
  const [tempDesc, setTempDesc] = useState('');
  const [inputHeight, setInputHeight] = useState(150);
  const MAX_EDITOR_WIDTH = Dimensions.get('window').width * 0.85;

  // Reset when dish changes
  useEffect(() => {
    setEditing(false);
    setTempDesc('');
    setInputHeight(150);
  }, [dishData.id]);

  function handleEdit() {
    setTempDesc(dishData.description);
    setEditing(true);
  }

  function handleCancel() {
    setEditing(false);
    setTempDesc('');
  }

  function handleSave() {
    const newDesc = tempDesc.trim();
    if (!newDesc) {
      Alert.alert('Empty Description', 'Description cannot be empty.');
      return;
    }
    if (dishData.id == null) {
      setDishData(prev => prev ? { ...prev, description: newDesc } : prev);
      setEditing(false);
      setTempDesc('');
      return;
    }
    const prevDesc = dishData.description;
    setDishData(prev => prev ? { ...prev, description: newDesc } : prev);
    setEditing(false);
    setTempDesc('');
    updateDishDescription(dishData.id, newDesc).then(({ error }) => {
      if (error) {
        Alert.alert('Error', 'Failed to save description.');
        setDishData(prev => prev ? { ...prev, description: prevDesc } : prev);
      }
    });
  }

  if (!editing) {
    return (
      <>
        <Text style={{ color: '#fff', fontSize: 15, lineHeight: 22, textAlign: 'center', marginBottom: 16 }}>{dishData.description.length > 0 ? dishData.description : 'No description available.'}</Text>
        <TouchableOpacity onPress={handleEdit} style={{ backgroundColor: '#1565C0', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, marginBottom: 32 }}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>Edit Description</Text>
        </TouchableOpacity>
      </>
    );
  }

  return (
    <View style={{ width: '100%', marginBottom: 32 }}>
      <TextInput
        style={{ backgroundColor: '#fff', borderRadius: 8, padding: 12, width: '85%', maxWidth: MAX_EDITOR_WIDTH, alignSelf: 'center', height: inputHeight, textAlignVertical: 'top' }}
        multiline
        value={tempDesc}
        onChangeText={setTempDesc}
        onContentSizeChange={e => setInputHeight(Math.max(100, e.nativeEvent.contentSize.height))}
        placeholder='Update description...'
        scrollEnabled={false}
      />
      <View style={{ flexDirection: 'row', marginTop: 12, justifyContent: 'center' }}>
        <TouchableOpacity onPress={handleSave} style={{ backgroundColor: '#2E7D32', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, marginRight: 12 }}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>Save</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleCancel} style={{ backgroundColor: '#B71C1C', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 }}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
