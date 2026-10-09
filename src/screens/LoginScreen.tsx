import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, typography } from '../theme';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { useAppStore } from '../store/useAppStore';

interface LoginScreenProps {
  onSuccess: () => void;
  onNavigateToSignUp: () => void;
  onGuestMode?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onSuccess,
  onNavigateToSignUp,
  onGuestMode,
}) => {
  const { login } = useAppStore();

  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!emailOrPhone.trim()) {
      newErrors.emailOrPhone = 'Please enter your registered email or phone number';
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
      await login(emailOrPhone.trim(), password);
      onSuccess();
    } catch (err: any) {
      setErrors({
        form: err?.message || 'Invalid credentials. Please check your email/phone and password.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Password Reset',
      `A password reset link will be sent to your registered email: ${emailOrPhone.trim() || 'your email address'}.`,
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
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
              Sign in with your registered email or phone number to access SafeSip.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="Email or Phone Number"
              placeholder="name@example.com or +91 9876543210"
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

          {/* Guest Mode */}
          {onGuestMode && (
            <View style={styles.guestContainer}>
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>
              <TouchableOpacity style={styles.guestBtn} onPress={onGuestMode} activeOpacity={0.7}>
                <Icon name="eye" size={16} color={colors.textSecondary} />
                <Text style={styles.guestBtnText}>Browse as Guest (View Only)</Text>
              </TouchableOpacity>
            </View>
          )}

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
    marginBottom: 20,
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
    backgroundColor: 'rgba(239,68,68,0.08)',
    padding: 8,
    borderRadius: radius.sm,
  },
  guestContainer: {
    marginBottom: 20,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
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
  guestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    backgroundColor: colors.surfaceSecondary,
  },
  guestBtnText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
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
