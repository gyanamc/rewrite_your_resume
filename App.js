import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Provider as PaperProvider, Text, TextInput, Button, Card, Paragraph } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Helper function to generate UUID-like session ID
const generateSessionId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const WEBHOOK_URL = 'https://primary-production-da3f.up.railway.app/webhook-test/7eab2e1f-99b9-42ee-ab90-480548527e58';

export default function App() {
  const [resume, setResume] = useState(null);
  const [keywords, setKeywords] = useState('');
  const [instructions, setInstructions] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadOrCreateSessionId();
  }, []);

  const loadOrCreateSessionId = async () => {
    try {
      let storedSessionId = await AsyncStorage.getItem('sessionId');
      if (!storedSessionId) {
        storedSessionId = generateSessionId();
        await AsyncStorage.setItem('sessionId', storedSessionId);
      }
      setSessionId(storedSessionId);
    } catch (error) {
      console.error('Error handling session ID:', error);
      const newSessionId = generateSessionId();
      setSessionId(newSessionId);
    }
  };

  const pickResume = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setResume(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    }
  };

  const readFileAsBase64 = async (uri) => {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64;
    } catch (error) {
      console.error('Error reading file:', error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (!resume) {
      Alert.alert('Validation Error', 'Please upload your resume.');
      return;
    }

    if (!keywords.trim()) {
      Alert.alert('Validation Error', 'Please add desired keywords.');
      return;
    }

    setIsSubmitting(true);

    try {
      const base64Resume = await readFileAsBase64(resume.uri);
      
      const payload = {
        sessionId: sessionId,
        resume: {
          name: resume.name,
          size: resume.size,
          mimeType: resume.mimeType,
          data: base64Resume,
        },
        keywords: keywords.trim(),
        instructions: instructions.trim(),
      };

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        Alert.alert(
          'Success',
          'Your resume and information have been submitted successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                // Optionally reset form
                setResume(null);
                setKeywords('');
                setInstructions('');
              },
            },
          ]
        );
      } else {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Submission error:', error);
      Alert.alert(
        'Submission Error',
        `Failed to submit: ${error.message}. Please try again.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PaperProvider>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>Rewrite Your Resume</Text>
            <Text style={styles.subtitle}>Upload your resume and customize it</Text>
            {sessionId && (
              <Text style={styles.sessionInfo}>Session ID: {sessionId}</Text>
            )}
          </View>

          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.cardTitle}>1. Upload Resume</Text>
              <Paragraph style={styles.cardDescription}>
                Upload your resume file (PDF, DOC, or DOCX)
              </Paragraph>
              {resume ? (
                <View style={styles.fileInfo}>
                  <Text style={styles.fileName}>✓ {resume.name}</Text>
                  <Text style={styles.fileSize}>
                    {(resume.size / 1024).toFixed(2)} KB
                  </Text>
                  <Button
                    mode="outlined"
                    onPress={pickResume}
                    style={styles.changeButton}
                  >
                    Change File
                  </Button>
                </View>
              ) : (
                <Button
                  mode="contained"
                  onPress={pickResume}
                  icon="upload"
                  style={styles.uploadButton}
                >
                  Choose Resume File
                </Button>
              )}
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.cardTitle}>2. Desired Keywords *</Text>
              <Paragraph style={styles.cardDescription}>
                Enter keywords you want to include in your resume (comma-separated)
              </Paragraph>
              <TextInput
                label="Keywords"
                value={keywords}
                onChangeText={setKeywords}
                placeholder="e.g., React, JavaScript, Project Management"
                mode="outlined"
                multiline
                numberOfLines={3}
                style={styles.input}
              />
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.cardTitle}>3. Instructions</Text>
              <Paragraph style={styles.cardDescription}>
                Add any specific instructions or requirements (optional)
              </Paragraph>
              <TextInput
                label="Instructions"
                value={instructions}
                onChangeText={setInstructions}
                placeholder="e.g., Keep it to one page, emphasize leadership experience..."
                mode="outlined"
                multiline
                numberOfLines={5}
                style={styles.input}
              />
            </Card.Content>
          </Card>

          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={isSubmitting}
            style={styles.submitButton}
            contentStyle={styles.submitButtonContent}
            icon="send"
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  sessionInfo: {
    fontSize: 12,
    color: '#999',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  uploadButton: {
    marginTop: 8,
  },
  fileInfo: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2e7d32',
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  changeButton: {
    alignSelf: 'flex-start',
  },
  input: {
    marginTop: 8,
  },
  submitButton: {
    marginTop: 24,
    paddingVertical: 4,
  },
  submitButtonContent: {
    paddingVertical: 8,
  },
});

