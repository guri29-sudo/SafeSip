import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, typography } from '../theme';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { useAppStore } from '../store/useAppStore';

interface SignUpScreenProps {
  onSuccess: () => void;
  onNavigateToLogin: () => void;
}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({
  onSuccess,
  onNavigateToLogin,
}) => {
  const { signUp } = useAppStore();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required for SMS device alerts';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await signUp(fullName, email, phone, password);
      onSuccess();
    } catch {
      setErrors({ form: 'Failed to create account. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = (provider: 'Google' | 'Apple') => {
    setLoading(true);
    setTimeout(async () => {
      await signUp(
        provider === 'Apple' ? 'Apple Member' : 'Google Explorer',
        `user@${provider.toLowerCase()}.com`,
        '+1 555-0192'
      );
      setLoading(false);
      onSuccess();
    }, 600);
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
            <Text style={styles.title}>Create SafeSip Account</Text>
            <Text style={styles.subtitle}>
              Monitor drinking water, link your smart bottle, and contribute to community maps.
            </Text>
          </View>

          {/* Form Fields */}
          <View style={styles.form}>
            <Input
              label="Full Name"
              placeholder="e.g. Vedant Sharma"
              value={fullName}
              onChangeText={text => {
                setFullName(text);
                if (errors.fullName) setErrors(prev => ({ ...prev, fullName: '' }));
              }}
              error={errors.fullName}
              autoCapitalize="words"
            />

            <Input
              label="Email Address"
              placeholder="name@example.com"
              value={email}
              onChangeText={text => {
                setEmail(text);
                if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
              }}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Input
              label="Phone Number"
              placeholder="+1 (555) 000-0000"
              value={phone}
              onChangeText={text => {
                setPhone(text);
                if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
              }}
              error={errors.phone}
              keyboardType="phone-pad"
            />

            <Input
              label="Password"
              placeholder="Min. 8 characters"
              value={password}
              onChangeText={text => {
                setPassword(text);
                if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
              }}
              error={errors.password}
              secureTextEntry
            />

            {errors.form && <Text style={styles.formError}>{errors.form}</Text>}

            <Button
              title="Sign Up"
              onPress={handleSignUp}
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
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={onNavigateToLogin}>
              <Text style={styles.loginLink}>Log In</Text>
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
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
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
    marginBottom: 24,
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
  loginLink: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
});
