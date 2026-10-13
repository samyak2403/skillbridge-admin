import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  Image,
  ActivityIndicator,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  loginAdmin, 
  registerAdmin, 
  VALID_ADMIN_PASSCODES 
} from '../services/authService';

const ADMIN_ROLES = [
  { id: 'Super Administrator', label: 'Super Admin', dept: 'Executive Governance & Operations' },
  { id: 'Operations Director', label: 'Operations', dept: 'Platform Infrastructure & Workflows' },
  { id: 'Trust & Safety Lead', label: 'Trust & Safety', dept: 'Student Verification & Content' },
  { id: 'Dispute Arbitrator', label: 'Arbitrator', dept: 'Escrow Mediation & Contracts' },
  { id: 'Finance Officer', label: 'Finance', dept: 'Escrow Ledger & Payouts' },
];

export default function AdminLoginScreen({ onLoginSuccess }) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 820;

  // Mode: 'login' | 'register'
  const [authMode, setAuthMode] = useState('login');

  // Sign In State
  const [adminEmail, setAdminEmail] = useState('admin@skillbridge.io');
  const [password, setPassword] = useState('SuperAdmin#2026');
  const [showPassword, setShowPassword] = useState(false);
  const [infoTooltip, setInfoTooltip] = useState(false);

  // Register State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState(ADMIN_ROLES[0].id);
  const [regDept, setRegDept] = useState(ADMIN_ROLES[0].dept);
  const [regPasscode, setRegPasscode] = useState('SKILLBRIDGE2026');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // ==========================================
  // HANDLERS
  // ==========================================
  const handleLogin = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);
    try {
      const admin = await loginAdmin(adminEmail, password);
      if (onLoginSuccess) {
        onLoginSuccess(admin);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!regName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!regEmail.trim()) {
      setErrorMessage('Please enter your administrator email address.');
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }
    if (!regPasscode.trim()) {
      setErrorMessage('Please enter the security master passcode.');
      return;
    }

    setLoading(true);
    try {
      const newAdmin = await registerAdmin({
        name: regName,
        email: regEmail,
        password: regPassword,
        confirmPassword: regConfirmPassword,
        role: regRole,
        title: regRole,
        department: regDept,
        securityPasscode: regPasscode,
        location: 'SkillBridge Global Headquarters'
      });

      setSuccessMessage('Administrator provisioned successfully! Entering console...');
      setTimeout(() => {
        if (onLoginSuccess) {
          onLoginSuccess(newAdmin);
        }
      }, 600);
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed. Please check details.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoFill = (type) => {
    setAuthMode('login');
    if (type === 'superadmin') {
      setAdminEmail('admin@skillbridge.io');
      setPassword('SuperAdmin#2026');
    } else {
      setAdminEmail('manuel@harinaselizondo.com');
      setPassword('Admin@2026');
    }
    setErrorMessage(null);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.rootContainer}
    >
      <View style={[styles.mainWrapper, isDesktop ? styles.desktopRow : styles.mobileCol]}>
        
        {/* ======================================================== */}
        {/* LEFT PANEL: HERO WITH freelance_login_hero.jpg & TITLE    */}
        {/* ======================================================== */}
        <View style={[styles.heroPanel, isDesktop ? { width: '50%', height: '100%' } : { width: '100%', height: 260 }]}>
          <ImageBackground
            source={require('../../assets/freelance_login_hero.jpg')}
            style={styles.heroBackground}
            resizeMode="cover"
          >
            <View style={styles.heroOverlay}>
              <View style={styles.heroHeader}>
                <Text style={styles.heroTitle}>SkillBridge</Text>
                <Text style={styles.heroSubtitle}>
                  FREELANCE WORKFORCE & TALENT PLATFORM
                </Text>
              </View>

              {isDesktop && (
                <View style={styles.heroFooter}>
                  <View style={styles.featureBadge}>
                    <Ionicons name="shield-checkmark" size={14} color="#93C5FD" />
                    <Text style={styles.featureText}>Enterprise 256-bit Secure Portal</Text>
                  </View>
                  <Text style={styles.heroCopyright}>
                    © 2026 SkillBridge Freelance Network. All rights reserved.
                  </Text>
                </View>
              )}
            </View>
          </ImageBackground>
        </View>

        {/* ======================================================== */}
        {/* RIGHT PANEL: CLEAN FLAT (NO CARD) WHITE CANVAS           */}
        {/* ======================================================== */}
        <ScrollView
          style={[
            styles.formScrollView,
            isDesktop ? { width: '50%', height: '100%' } : { width: '100%', flex: 1 }
          ]}
          contentContainerStyle={styles.formScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.flatContentWrapper}>
            
            {/* SkillBridge Emblem Logo (skillbridge_emblem.jpg) */}
            <View style={styles.crestWrap}>
              <Image
                source={require('../../assets/skillbridge_emblem.jpg')}
                style={styles.crestImage}
                resizeMode="contain"
              />
              <Text style={styles.crestTitle}>SKILLBRIDGE</Text>
              <Text style={styles.crestSubtitle}>ADMIN PORTAL</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Flat Minimalist Tabs (No bulky card) */}
            <View style={styles.flatTabRow}>
              <TouchableOpacity
                style={[styles.flatTabBtn, authMode === 'login' && styles.flatTabBtnActive]}
                onPress={() => {
                  setAuthMode('login');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.flatTabText, authMode === 'login' && styles.flatTabTextActive]}>
                  Sign In
                </Text>
              </TouchableOpacity>

              <Text style={styles.flatTabSeparator}>|</Text>

              <TouchableOpacity
                style={[styles.flatTabBtn, authMode === 'register' && styles.flatTabBtnActive]}
                onPress={() => {
                  setAuthMode('register');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.flatTabText, authMode === 'register' && styles.flatTabTextActive]}>
                  Register Admin
                </Text>
              </TouchableOpacity>
            </View>

            {/* Alerts */}
            {errorMessage && (
              <View style={styles.errorAlert}>
                <Ionicons name="alert-circle" size={16} color="#DC2626" />
                <Text style={styles.errorAlertText}>{errorMessage}</Text>
              </View>
            )}

            {successMessage && (
              <View style={styles.successAlert}>
                <Ionicons name="checkmark-circle" size={16} color="#059669" />
                <Text style={styles.successAlertText}>{successMessage}</Text>
              </View>
            )}

            {/* ======================================================== */}
            {/* VIEW 1: SIGN IN (CLEAN FLAT LAYOUT, ALL ENGLISH)         */}
            {/* ======================================================== */}
            {authMode === 'login' && (
              <View style={styles.formFieldsArea}>
                
                {/* Field 1: Admin Email with Blue Outline Box */}
                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Ionicons name="person-circle-outline" size={18} color="#5B67EA" />
                    <Text style={styles.fieldLabel}>Admin Email</Text>
                  </View>
                  <View style={styles.blueOutlineBox}>
                    <TextInput
                      style={styles.textInput}
                      value={adminEmail}
                      onChangeText={setAdminEmail}
                      placeholder="e.g. admin@skillbridge.io"
                      placeholderTextColor="#9CA3AF"
                      autoCapitalize="none"
                      keyboardType="email-address"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                {/* Field 2: Password with Grey Box and Help/Eye Toggle */}
                <View style={styles.inputGroup}>
                  <View style={styles.passwordRowWrap}>
                    <View style={styles.greyInputBox}>
                      <Ionicons name="lock-closed" size={15} color="#9CA3AF" style={styles.lockIcon} />
                      <TextInput
                        style={styles.passwordInput}
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Password"
                        placeholderTextColor="#9CA3AF"
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                      />
                    </View>

                    {/* Help / Eye toggle circle icon */}
                    <TouchableOpacity
                      style={styles.helpIconBtn}
                      onPress={() => {
                        setShowPassword(!showPassword);
                        setInfoTooltip(true);
                        setTimeout(() => setInfoTooltip(false), 2500);
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={showPassword ? "eye-outline" : "help-circle"}
                        size={21}
                        color="#111827"
                      />
                    </TouchableOpacity>
                  </View>

                  {infoTooltip && (
                    <View style={styles.tooltipBox}>
                      <Text style={styles.tooltipText}>
                        {showPassword ? 'Password visible' : 'Click to toggle visibility'}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Submit Pill Button (Grey, matches reference UI) */}
                <TouchableOpacity
                  style={[styles.greyPillButton, loading && styles.buttonDisabled]}
                  onPress={handleLogin}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.greyPillButtonText}>Sign In</Text>
                  )}
                </TouchableOpacity>

                {/* Quick Demo Shortcuts */}
                <View style={styles.quickShortcutsRow}>
                  <TouchableOpacity
                    style={[styles.quickChip, adminEmail.includes('skillbridge') && styles.quickChipActive]}
                    onPress={() => handleQuickDemoFill('superadmin')}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.quickChipText, adminEmail.includes('skillbridge') && styles.quickChipTextActive]}>
                      Super Admin
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.quickChip, adminEmail.includes('elizondo') && styles.quickChipActive]}
                    onPress={() => handleQuickDemoFill('manuel')}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.quickChipText, adminEmail.includes('elizondo') && styles.quickChipTextActive]}>
                      Manuel Elizondo
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Link to Register */}
                <TouchableOpacity
                  style={styles.switchModeLinkBtn}
                  onPress={() => {
                    setAuthMode('register');
                    setErrorMessage(null);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.switchModeLinkText}>
                    Need an administrator account? <Text style={styles.switchModeLinkBold}>Register Admin</Text>
                  </Text>
                </TouchableOpacity>

              </View>
            )}

            {/* ======================================================== */}
            {/* VIEW 2: REGISTER ADMIN (CLEAN FLAT LAYOUT, ALL ENGLISH)   */}
            {/* ======================================================== */}
            {authMode === 'register' && (
              <View style={styles.formFieldsArea}>
                
                {/* Field: Full Name */}
                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Ionicons name="person-circle-outline" size={17} color="#5B67EA" />
                    <Text style={styles.fieldLabel}>Full Name</Text>
                  </View>
                  <View style={styles.blueOutlineBox}>
                    <TextInput
                      style={styles.textInput}
                      value={regName}
                      onChangeText={setRegName}
                      placeholder="e.g. Dr. Sarah Jenkins"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>

                {/* Field: Official Admin Email */}
                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Ionicons name="mail-outline" size={17} color="#5B67EA" />
                    <Text style={styles.fieldLabel}>Official Admin Email</Text>
                  </View>
                  <View style={styles.blueOutlineBox}>
                    <TextInput
                      style={styles.textInput}
                      value={regEmail}
                      onChangeText={setRegEmail}
                      placeholder="e.g. s.jenkins@skillbridge.io"
                      placeholderTextColor="#9CA3AF"
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </View>
                </View>

                {/* Field: Role */}
                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Ionicons name="shield-outline" size={17} color="#5B67EA" />
                    <Text style={styles.fieldLabel}>Administrative Role</Text>
                  </View>
                  <View style={styles.roleChipsRow}>
                    {ADMIN_ROLES.map((r) => (
                      <TouchableOpacity
                        key={r.id}
                        style={[styles.roleChip, regRole === r.id && styles.roleChipActive]}
                        onPress={() => {
                          setRegRole(r.id);
                          setRegDept(r.dept);
                        }}
                      >
                        <Text style={[styles.roleChipText, regRole === r.id && styles.roleChipTextActive]}>
                          {r.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Field: Security Master Passcode */}
                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Ionicons name="key-outline" size={17} color="#5B67EA" />
                    <Text style={styles.fieldLabel}>Security Master Passcode</Text>
                  </View>
                  <View style={styles.blueOutlineBox}>
                    <TextInput
                      style={styles.textInput}
                      value={regPasscode}
                      onChangeText={setRegPasscode}
                      placeholder="SKILLBRIDGE2026"
                      placeholderTextColor="#9CA3AF"
                      autoCapitalize="characters"
                    />
                  </View>
                </View>

                {/* Field: Password */}
                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Ionicons name="lock-closed-outline" size={17} color="#5B67EA" />
                    <Text style={styles.fieldLabel}>Password (min 6 characters)</Text>
                  </View>
                  <View style={styles.greyInputBox}>
                    <Ionicons name="lock-closed" size={15} color="#9CA3AF" style={styles.lockIcon} />
                    <TextInput
                      style={styles.passwordInput}
                      value={regPassword}
                      onChangeText={setRegPassword}
                      placeholder="Create password"
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry={!showRegPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      onPress={() => setShowRegPassword(!showRegPassword)}
                      style={{ padding: 4 }}
                    >
                      <Ionicons
                        name={showRegPassword ? "eye-outline" : "eye-off-outline"}
                        size={18}
                        color="#6B7280"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Field: Confirm Password */}
                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Ionicons name="shield-checkmark-outline" size={17} color="#5B67EA" />
                    <Text style={styles.fieldLabel}>Confirm Password</Text>
                  </View>
                  <View style={styles.greyInputBox}>
                    <Ionicons name="lock-closed" size={15} color="#9CA3AF" style={styles.lockIcon} />
                    <TextInput
                      style={styles.passwordInput}
                      value={regConfirmPassword}
                      onChangeText={setRegConfirmPassword}
                      placeholder="Re-enter password"
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry={!showRegPassword}
                      autoCapitalize="none"
                    />
                  </View>
                  {regConfirmPassword.length > 0 && (
                    <Text style={{
                      fontSize: 11,
                      marginTop: 4,
                      color: regPassword === regConfirmPassword ? '#10B981' : '#EF4444'
                    }}>
                      {regPassword === regConfirmPassword ? '✓ Passwords match' : '✗ Passwords do not match yet'}
                    </Text>
                  )}
                </View>

                {/* Submit Register Button */}
                <TouchableOpacity
                  style={[styles.greyPillButton, { backgroundColor: '#5B67EA' }, loading && styles.buttonDisabled]}
                  onPress={handleRegister}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.greyPillButtonText}>Register & Enter Console</Text>
                  )}
                </TouchableOpacity>

                {/* Link to Sign In */}
                <TouchableOpacity
                  style={styles.switchModeLinkBtn}
                  onPress={() => {
                    setAuthMode('login');
                    setErrorMessage(null);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.switchModeLinkText}>
                    Already registered? <Text style={styles.switchModeLinkBold}>Sign In</Text>
                  </Text>
                </TouchableOpacity>

              </View>
            )}

          </View>
        </ScrollView>

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    width: '100%',
    height: '100%',
  },
  mainWrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  desktopRow: {
    flexDirection: 'row',
  },
  mobileCol: {
    flexDirection: 'column',
  },

  // ----------------------------------------------------
  // LEFT PANEL: HERO WITH freelance_login_hero.jpg
  // ----------------------------------------------------
  heroPanel: {
    position: 'relative',
    backgroundColor: '#0F172A',
    overflow: 'hidden',
  },
  heroBackground: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 23, 44, 0.45)',
    paddingVertical: 50,
    paddingHorizontal: 36,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroHeader: {
    alignItems: 'center',
    marginTop: 20,
  },
  heroTitle: {
    fontSize: 42,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined,
  },
  heroSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#93C5FD',
    letterSpacing: 2,
    marginTop: 8,
    textAlign: 'center',
  },
  heroFooter: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(147, 197, 253, 0.3)',
  },
  featureText: {
    color: '#E0F2FE',
    fontSize: 12,
    fontWeight: '600',
  },
  heroCopyright: {
    color: '#94A3B8',
    fontSize: 11,
    textAlign: 'center',
  },

  // ----------------------------------------------------
  // RIGHT PANEL: PURE FLAT WHITE (NO CARD!)
  // ----------------------------------------------------
  formScrollView: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  formScrollContent: {
    flexGrow: 1,
    width: '100%',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 24,
  },
  flatContentWrapper: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    backgroundColor: 'transparent', // Pure flat, NO CARD!
  },

  // SkillBridge Crest Emblem Logo (skillbridge_emblem.jpg)
  crestWrap: {
    alignItems: 'center',
    marginBottom: 20,
  },
  crestImage: {
    width: 110,
    height: 110,
    marginBottom: 6,
  },
  crestTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E3A8A',
    letterSpacing: 4,
    fontFamily: Platform.OS === 'web' ? 'Georgia, serif' : undefined,
  },
  crestSubtitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E3A8A',
    letterSpacing: 2.5,
    fontFamily: Platform.OS === 'web' ? 'Georgia, serif' : undefined,
  },
  dividerLine: {
    width: 32,
    height: 2,
    backgroundColor: '#3B82F6',
    marginTop: 6,
    borderRadius: 2,
  },

  // Flat Minimalist Mode Switcher
  flatTabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  flatTabBtn: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  flatTabBtnActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#5B67EA',
  },
  flatTabText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  flatTabTextActive: {
    color: '#5B67EA',
    fontWeight: '700',
  },
  flatTabSeparator: {
    color: '#D1D5DB',
    fontSize: 12,
  },

  // Alerts
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    width: '100%',
    marginBottom: 16,
  },
  errorAlertText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  successAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    width: '100%',
    marginBottom: 16,
  },
  successAlertText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },

  // Form Fields Area
  formFieldsArea: {
    width: '100%',
  },
  inputGroup: {
    width: '100%',
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5B67EA',
  },

  // Blue Outline Input Box
  blueOutlineBox: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 44,
    borderWidth: 1.5,
    borderColor: '#5B67EA',
    borderRadius: 8,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 13,
    color: '#1F2937',
    padding: 0,
    outlineStyle: 'none',
  },

  // Grey Background Input Box
  passwordRowWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  greyInputBox: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 14,
    gap: 8,
  },
  lockIcon: {
    marginRight: 2,
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    fontSize: 13,
    color: '#1F2937',
    padding: 0,
    outlineStyle: 'none',
  },
  helpIconBtn: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tooltipBox: {
    backgroundColor: '#1F2937',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  tooltipText: {
    color: '#FFFFFF',
    fontSize: 11,
  },

  // Pill Button (Grey, matches reference UI)
  greyPillButton: {
    backgroundColor: '#8E9298',
    borderRadius: 22,
    paddingVertical: 11,
    paddingHorizontal: 38,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    minWidth: 170,
    marginTop: 22,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 1,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  greyPillButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },

  // Role Chips in Register Mode
  roleChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  roleChip: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  roleChipActive: {
    backgroundColor: '#5B67EA',
    borderColor: '#5B67EA',
  },
  roleChipText: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '500',
  },
  roleChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Quick Shortcuts
  quickShortcutsRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 20,
  },
  quickChip: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickChipActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  quickChipText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  quickChipTextActive: {
    color: '#5B67EA',
    fontWeight: '600',
  },

  // Switch Mode Link
  switchModeLinkBtn: {
    marginTop: 18,
    alignSelf: 'center',
    paddingVertical: 6,
  },
  switchModeLinkText: {
    fontSize: 12,
    color: '#6B7280',
  },
  switchModeLinkBold: {
    color: '#5B67EA',
    fontWeight: '700',
  },
});
