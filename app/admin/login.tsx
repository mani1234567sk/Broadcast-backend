import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Lock, Mail, Eye, EyeOff, Shield, ArrowLeft } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ErrorBoundary from '@/components/ErrorBoundary';

const ADMIN_CREDENTIALS = {
  email: 'bb@gmail.com',
  password: 'bb'
};

export default function AdminLoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false); // Added state for isLocked
  const [loginAttempts, setLoginAttempts] = useState(0); // Added state for loginAttempts
  const [errors, setErrors] = useState({ email: '', password: '' });

  const validateForm = () => {
    const newErrors = { email: '', password: '' };
    let isValid = true;

    if (!email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!email.includes('@')) {
      newErrors.email = 'Please enter a valid email';
      isValid = false;
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleLogin = async () => {
    if (isLocked) {
      Alert.alert(
        'Account Temporarily Locked',
        'Too many failed login attempts. Please wait a moment before trying again.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    if (!validateForm()) return;

    setIsLoading(true);
    console.log('🔐 Attempting admin login...');

    try {
      // Simulate loading delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
        setLoginAttempts(0);
        console.log('✅ Admin login successful');
        
        // Store authentication state
        await AsyncStorage.setItem('admin_authenticated', 'true');
        console.log('💾 Authentication state stored');
        
        setIsLoading(false);
        
        // Navigate to admin panel
        console.log('🚀 Navigating to admin dashboard...');
        router.replace('/(tabs)/admin?authenticated=true');
      } else {
        console.log('❌ Invalid credentials');
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);
        
        setIsLoading(false);
        
        if (newAttempts >= 3) {
          setIsLocked(true);
          setTimeout(() => setIsLocked(false), 30000); // Lock for 30 seconds
          Alert.alert(
            'Too Many Failed Attempts',
            'Account temporarily locked for 30 seconds due to multiple failed login attempts.',
            [{ text: 'OK', style: 'default' }]
          );
        } else {
          // Clear password field after failed attempt
          setPassword('');
          Alert.alert(
            'Login Failed',
            `Invalid email or password. ${3 - newAttempts} attempts remaining.`,
            [{ text: 'Try Again', style: 'default' }]
          );
        }
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      setIsLoading(false);
      Alert.alert(
        'Login Error',
        'An error occurred during login. Please try again.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  const handleInputChange = (field: 'email' | 'password', value: string) => {
    if (field === 'email') {
      setEmail(value);
      if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
    } else {
      setPassword(value);
      if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
    }
  };

  return (
    <ErrorBoundary>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Debug Info for Release Build */}
          {__DEV__ === false && (
            <View style={styles.debugInfo}>
              <Text style={styles.debugTitle}>Release Build - Login Screen</Text>
              <Text style={styles.debugText}>Build Mode: {__DEV__ ? 'Debug' : 'Release'}</Text>
              <Text style={styles.debugText}>Platform: {Platform.OS}</Text>
            </View>
          )}

          {/* Back Button */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => {
              try {
                router.replace('../(tabs)/');
              } catch (error) {
                console.error('Navigation error:', error);
                Alert.alert('Navigation Error', 'Unable to go back. Please restart the app.');
              }
            }}
          >
            <ArrowLeft size={24} color="#FFFFFF" />
            <Text style={styles.backButtonText}>Back to Home</Text>
          </TouchableOpacity>

          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Shield size={48} color="#FFFFFF" strokeWidth={2} />
            </View>
            <Text style={styles.title}>LIVE TV Admin</Text>
            <Text style={styles.subtitle}>
              Sign in to access the admin panel and manage your content
            </Text>
          </View>

          {/* Login Form */}
          <View style={styles.formContainer}>
            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={[styles.inputContainer, errors.email ? styles.inputError : null]}>
                <Mail size={20} color="#522e8e" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={(value) => handleInputChange('email', value)}
                  placeholder="Enter your email"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>
              {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={[styles.inputContainer, errors.password ? styles.inputError : null]}>
                <Lock size={20} color="#522e8e" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={(value) => handleInputChange('password', value)}
                  placeholder="Enter your password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#6B7280" />
                  ) : (
                    <Eye size={20} color="#6B7280" />
                  )}
                </TouchableOpacity>
              </View>
              {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[
                styles.loginButton, 
                (isLoading || isLocked) && styles.loginButtonDisabled
              ]}
              onPress={handleLogin}
              disabled={isLoading || isLocked}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? 'Signing In...' : isLocked ? 'Account Locked' : 'Sign In'}
              </Text>
            </TouchableOpacity>

            {/* Login Attempts Warning */}
            {loginAttempts > 0 && !isLocked && (
              <View style={styles.warningContainer}>
                <Text style={styles.warningText}>
                  ⚠️ {loginAttempts}/3 failed attempts
                </Text>
              </View>
            )}

            {/* Demo Credentials Hint */}
            <View style={styles.demoHint}>
              <Text style={styles.demoHintTitle}>Demo Credentials:</Text>
              <Text style={styles.demoHintText}>Email: bb@gmail.com</Text>
              <Text style={styles.demoHintText}>Password: bb</Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Secure admin access for LIVE TV management
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#522e8e',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 24,
    gap: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Cocogoose',
    fontWeight: 'bold',
    fontStyle: 'italic',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#E0E7FF',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Cocogoose',
    fontWeight: 'bold',
    fontStyle: 'italic',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    minHeight: 56,
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingVertical: 12,
  },
  eyeButton: {
    padding: 8,
    marginLeft: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    marginTop: 6,
    marginLeft: 4,
  },
  loginButton: {
    backgroundColor: '#522e8e',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#522e8e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0.1,
  },
  loginButtonText: {
    fontSize: 18,
    fontFamily: 'Cocogoose',
    fontWeight: 'bold',
    fontStyle: 'italic',
    color: '#FFFFFF',
  },
  warningContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  warningText: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '600',
    textAlign: 'center',
  },
  demoHint: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#522e8e',
  },
  demoHintTitle: {
    fontSize: 14,
    fontFamily: 'Cocogoose',
    fontWeight: 'bold',
    fontStyle: 'italic',
    color: '#522e8e',
    marginBottom: 8,
  },
  demoHintText: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 2,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#E0E7FF',
    textAlign: 'center',
    opacity: 0.8,
  },
  debugInfo: {
    backgroundColor: '#EF4444',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  debugTitle: {
    fontSize: 14,
    fontFamily: 'Cocogoose',
    fontWeight: 'bold',
    fontStyle: 'italic',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#FFFFFF',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});