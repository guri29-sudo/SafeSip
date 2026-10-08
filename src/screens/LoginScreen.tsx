import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { colors, radius, typography } from '../theme';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { useAppStore } from '../store/useAppStore';

interface LoginScreenProps {
  onSuccess: () => void;
  onNavigateToSignUp: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onSuccess,
  onNavigateToSignUp,
}) => {
  const { login } = useAppStore();

  const [emailOrPhone, setEmailOrPhone] = useState('vedant@safesip.org');
  const [password, setPassword] = useState('SecurePass2026!');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!emailOrPhone.trim()) {
      newErrors.emailOrPhone = 'Please enter your email or registered phone number';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await login(emailOrPhone, password);
      onSuccess();
    } catch {
      setErrors({ form: 'Invalid credentials. Please verify and try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Password Reset',
      `A password reset link will be dispatched to ${emailOrPhone || 'your registered contact'}.`,
      [{ text: 'OK' }]
    );
  };

  const handleOAuth = (provider: 'Google' | 'Apple') => {
    setLoading(true);
    setTimeout(async () => {
      await login(`vedant@${provider.toLowerCase()}.com`, 'oauth-token');
      setLoading(false);
      onSuccess();
    }, 500);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <Icon name="droplet" size={20} color={colors.primary} />
            </View>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>
              Sign in to sync your SafeSip bottle, view test records, and access community alerts.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="Email or Phone"
              placeholder="name@example.com or phone"
              value={emailOrPhone}
              onChangeText={text => {
                setEmailOrPhone(text);
                if (errors.emailOrPhone) setErrors(prev => ({ ...prev, emailOrPhone: '' }));
              }}
              error={errors.emailOrPhone}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={text => {
                setPassword(text);
                if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
              }}
              error={errors.password}
              secureTextEntry
            />

            <TouchableOpacity
              onPress={handleForgotPassword}
              style={styles.forgotContainer}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            {errors.form && <Text style={styles.formError}>{errors.form}</Text>}

            <Button
              title="Log In"
              onPress={handleLogin}
              loading={loading}
              size="lg"
              style={{ marginTop: 8 }}
            />
          </View>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Auth */}
          <View style={styles.socialButtons}>
            <Button
              title="Continue with Google"
              variant="secondary"
              onPress={() => handleOAuth('Google')}
              style={{ marginBottom: 10 }}
            />
            <Button
              title="Continue with Apple"
              variant="secondary"
              onPress={() => handleOAuth('Apple')}
            />
          </View>

          {/* Bottom Link */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={onNavigateToSignUp}>
              <Text style={styles.signUpLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 28,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  form: {
    marginBottom: 24,
  },
  forgotContainer: {
    alignSelf: 'flex-end',
    marginBottom: 16,
    marginTop: -4,
  },
  forgotText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  formError: {
    fontSize: 13,
    color: colors.unsafe,
    marginBottom: 10,
    textAlign: 'center',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    paddingHorizontal: 12,
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  socialButtons: {
    marginBottom: 28,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  signUpLink: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
});
