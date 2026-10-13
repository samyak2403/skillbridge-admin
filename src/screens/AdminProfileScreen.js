import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Switch,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import {
  getCurrentAdmin,
  subscribeAdminAuth,
  updateAdminProfile,
  changeAdminPassword,
  logoutAdmin,
  registerAdmin,
  subscribeRegisteredAdmins,
} from '../services/authService';

export default function AdminProfileScreen({ navigation, onLogout }) {
  const [admin, setAdmin] = useState(getCurrentAdmin() || {
    name: 'Admin SkillBridge',
    email: 'admin@skillbridge.io',
    secondaryEmail: 'support@skillbridge.io',
    role: 'Super Administrator',
    title: 'Operations & Platform Director',
    department: 'General Management / Operations',
    phone: '+1 (555) 019-2834',
    avatarInitials: 'AS',
    accessLevel: 'Level 5 - Full Control (Root)',
    status: 'ACTIVE',
    twoFactorEnabled: true,
    lastLogin: 'Today, 09:30 AM',
    location: 'San Francisco, CA, USA',
    ipAddress: '192.168.1.1',
    permissions: [
      'User Supervision & Verifications',
      'Escrow Fund Approval & Disbursement',
      'Dispute Arbitration & Resolution',
      'Project & Posting Moderation',
      'Global Policy & Fee Configuration',
      'Full Audit & Database Root Access'
    ],
    stats: {
      auditsCompleted: 142,
      disputesResolved: 29,
      usersModerated: 568,
      activeSessions: 2,
      uptimePercentage: '99.98%'
    }
  });

  const [activeTab, setActiveTab] = useState('info'); // 'info', 'security', 'permissions'
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Form State
  const [name, setName] = useState(admin.name);
  const [email, setEmail] = useState(admin.email);
  const [secondaryEmail, setSecondaryEmail] = useState(admin.secondaryEmail || '');
  const [phone, setPhone] = useState(admin.phone || '');
  const [title, setTitle] = useState(admin.title || '');
  const [department, setDepartment] = useState(admin.department || '');
  const [location, setLocation] = useState(admin.location || '');
  const [twoFactor, setTwoFactor] = useState(admin.twoFactorEnabled !== false);

  // Password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPass, setChangingPass] = useState(false);

  // Logout modal
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Admin Team & Directory State
  const [adminList, setAdminList] = useState([]);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState('Trust & Safety Lead');
  const [newAdminDept, setNewAdminDept] = useState('Trust, Safety & Verification');
  const [newAdminPhone, setNewAdminPhone] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminPasscode, setNewAdminPasscode] = useState('SKILLBRIDGE2026');
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [addAdminError, setAddAdminError] = useState(null);

  useEffect(() => {
    const unsub = subscribeAdminAuth((liveAdmin) => {
      if (liveAdmin) {
        setAdmin(liveAdmin);
        setName(liveAdmin.name);
        setEmail(liveAdmin.email);
        setSecondaryEmail(liveAdmin.secondaryEmail || '');
        setPhone(liveAdmin.phone || '');
        setTitle(liveAdmin.title || '');
        setDepartment(liveAdmin.department || '');
        setLocation(liveAdmin.location || '');
        setTwoFactor(liveAdmin.twoFactorEnabled !== false);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsubTeam = subscribeRegisteredAdmins((list) => {
      setAdminList(list || []);
    });
    return () => {
      if (unsubTeam) unsubTeam();
    };
  }, []);

  const handleProvisionAdmin = async () => {
    setAddAdminError(null);
    if (!newAdminName.trim() || !newAdminEmail.trim() || !newAdminPassword.trim()) {
      setAddAdminError('Please enter Name, Email, and Password.');
      return;
    }
    if (newAdminPassword.length < 6) {
      setAddAdminError('Password must be at least 6 characters long.');
      return;
    }
    setCreatingAdmin(true);
    try {
      await registerAdmin({
        name: newAdminName,
        email: newAdminEmail,
        password: newAdminPassword,
        confirmPassword: newAdminPassword,
        role: newAdminRole,
        title: newAdminRole,
        department: newAdminDept,
        phone: newAdminPhone,
        securityPasscode: newAdminPasscode || 'SKILLBRIDGE2026',
        location: 'SkillBridge Operations HQ'
      });
      setShowAddAdminModal(false);
      setNewAdminName('');
      setNewAdminEmail('');
      setNewAdminPassword('');
      setNewAdminPhone('');
      showToast(`Administrator ${newAdminName} registered successfully!`);
    } catch (e) {
      setAddAdminError(e.message || 'Could not provision administrator.');
    } finally {
      setCreatingAdmin(false);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await updateAdminProfile({
        name,
        email,
        secondaryEmail,
        phone,
        title,
        department,
        location,
        avatarInitials: name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'AD',
        twoFactorEnabled: twoFactor,
      });
      setIsEditing(false);
      showToast('Administrator profile updated successfully.');
    } catch (e) {
      showToast(e.message || 'Error updating profile.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!newPassword || newPassword.length < 6) {
      showToast('New password must contain at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match.');
      return;
    }
    setChangingPass(true);
    try {
      await changeAdminPassword(oldPassword, newPassword);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Administrator password updated successfully.');
    } catch (e) {
      showToast(e.message || 'Error updating password.');
    } finally {
      setChangingPass(false);
    }
  };

  const handleConfirmLogout = async () => {
    setShowLogoutModal(false);
    await logoutAdmin();
    if (onLogout) {
      onLogout();
    } else if (navigation?.navigate) {
      navigation.navigate('Login');
    }
  };

  return (
    <View style={styles.container}>
      {/* Toast Notification */}
      {toastMessage && (
        <View style={styles.toastWrap}>
          <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* Top Navigation Bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation?.goBack ? navigation.goBack() : navigation?.navigate('Dashboard')}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text style={styles.screenTitle}>Admin Profile</Text>
            <Text style={styles.screenSubtitle}>Account Management & Security Credentials</Text>
          </View>
        </View>

        <View style={styles.topBarRight}>
          <TouchableOpacity
            style={styles.logoutHeaderBtn}
            onPress={() => setShowLogoutModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={18} color={colors.danger} />
            <Text style={styles.logoutHeaderText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        
        {/* ======================================================== */}
        {/* HERO PROFILE CARD                                       */}
        {/* ======================================================== */}
        <View style={styles.heroCard}>
          <View style={styles.heroBanner}>
            <View style={styles.heroBannerOverlay} />
            <View style={styles.badgeTier}>
              <Ionicons name="shield-checkmark" size={14} color="#FBBF24" />
              <Text style={styles.badgeTierText}>LEVEL 5 • ROOT ADMIN</Text>
            </View>
          </View>

          <View style={styles.heroBody}>
            <View style={styles.avatarRow}>
              <View style={styles.avatarWrap}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{admin.avatarInitials || 'AS'}</Text>
                </View>
                <View style={styles.onlineBadge}>
                  <View style={styles.onlineDot} />
                </View>
              </View>

              <View style={styles.adminMeta}>
                <View style={styles.nameHeaderRow}>
                  <Text style={styles.adminName}>{admin.name}</Text>
                  <View style={styles.verifiedTag}>
                    <Ionicons name="checkmark-circle" size={15} color={colors.primary} />
                    <Text style={styles.verifiedTagText}>Verified</Text>
                  </View>
                </View>

                <Text style={styles.adminRole}>{admin.title} • {admin.department}</Text>
                
                <View style={styles.contactChipsRow}>
                  <View style={styles.contactChip}>
                    <Ionicons name="mail-outline" size={13} color={colors.textSecondary} />
                    <Text style={styles.contactChipText}>{admin.email}</Text>
                  </View>
                  <View style={styles.contactChip}>
                    <Ionicons name="location-outline" size={13} color={colors.textSecondary} />
                    <Text style={styles.contactChipText}>{admin.location}</Text>
                  </View>
                  <View style={styles.contactChip}>
                    <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
                    <Text style={styles.contactChipText}>Last login: {admin.lastLogin}</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.editProfileBtn, isEditing && styles.editProfileBtnActive]}
                onPress={() => setIsEditing(!isEditing)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isEditing ? "close-outline" : "create-outline"}
                  size={16}
                  color={isEditing ? colors.danger : colors.primary}
                />
                <Text style={[styles.editProfileBtnText, isEditing && { color: colors.danger }]}>
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Quick Metrics Bar */}
            <View style={styles.metricsBar}>
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>{admin.stats?.auditsCompleted || 142}</Text>
                <Text style={styles.metricLabel}>Audits Executed</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Text style={[styles.metricValue, { color: colors.success }]}>
                  {admin.stats?.disputesResolved || 29}
                </Text>
                <Text style={styles.metricLabel}>Disputes Resolved</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Text style={[styles.metricValue, { color: colors.primary }]}>
                  {admin.stats?.usersModerated || 568}
                </Text>
                <Text style={styles.metricLabel}>Supervised Accounts</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Text style={[styles.metricValue, { color: '#8B5CF6' }]}>
                  {admin.stats?.uptimePercentage || '99.98%'}
                </Text>
                <Text style={styles.metricLabel}>SLA Uptime</Text>
              </View>
            </View>

          </View>
        </View>

        {/* ======================================================== */}
        {/* TAB CONTROLS                                             */}
        {/* ======================================================== */}
        <View style={styles.tabNavRow}>
          <TouchableOpacity
            style={[styles.tabNavItem, activeTab === 'info' && styles.tabNavItemActive]}
            onPress={() => setActiveTab('info')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="person-outline"
              size={17}
              color={activeTab === 'info' ? colors.primary : colors.textSecondary}
            />
            <Text style={[styles.tabNavText, activeTab === 'info' && styles.tabNavTextActive]}>
              General Information
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabNavItem, activeTab === 'security' && styles.tabNavItemActive]}
            onPress={() => setActiveTab('security')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="shield-outline"
              size={17}
              color={activeTab === 'security' ? colors.primary : colors.textSecondary}
            />
            <Text style={[styles.tabNavText, activeTab === 'security' && styles.tabNavTextActive]}>
              Security & Credentials
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabNavItem, activeTab === 'permissions' && styles.tabNavItemActive]}
            onPress={() => setActiveTab('permissions')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="key-outline"
              size={17}
              color={activeTab === 'permissions' ? colors.primary : colors.textSecondary}
            />
            <Text style={[styles.tabNavText, activeTab === 'permissions' && styles.tabNavTextActive]}>
              Permissions & Privileges
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabNavItem, activeTab === 'team' && styles.tabNavItemActive]}
            onPress={() => setActiveTab('team')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="people-outline"
              size={17}
              color={activeTab === 'team' ? colors.primary : colors.textSecondary}
            />
            <Text style={[styles.tabNavText, activeTab === 'team' && styles.tabNavTextActive]}>
              Staff Directory ({adminList.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* ======================================================== */}
        {/* TAB 1: GENERAL INFORMATION                               */}
        {/* ======================================================== */}
        {activeTab === 'info' && (
          <View style={styles.cardSection}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Personal Administrator Details</Text>
                <Text style={styles.sectionDesc}>
                  Official information visible in audit logs and support operations
                </Text>
              </View>
              {isEditing && (
                <TouchableOpacity
                  style={[styles.primaryActionBtn, saving && { opacity: 0.7 }]}
                  onPress={handleSaveProfile}
                  disabled={saving}
                  activeOpacity={0.8}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="save-outline" size={16} color="#FFFFFF" />
                      <Text style={styles.primaryActionBtnText}>Save Changes</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.formGrid}>
              <View style={styles.formFieldHalf}>
                <Text style={styles.fieldLabel}>Full Name</Text>
                <TextInput
                  style={[styles.inputBox, !isEditing && styles.inputBoxDisabled]}
                  value={name}
                  onChangeText={setName}
                  editable={isEditing}
                  placeholder="e.g. Manuel Elizondo"
                />
              </View>

              <View style={styles.formFieldHalf}>
                <Text style={styles.fieldLabel}>Official Email Address</Text>
                <TextInput
                  style={[styles.inputBox, !isEditing && styles.inputBoxDisabled]}
                  value={email}
                  onChangeText={setEmail}
                  editable={isEditing}
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.formFieldHalf}>
                <Text style={styles.fieldLabel}>Role / Leadership Title</Text>
                <TextInput
                  style={[styles.inputBox, !isEditing && styles.inputBoxDisabled]}
                  value={title}
                  onChangeText={setTitle}
                  editable={isEditing}
                />
              </View>

              <View style={styles.formFieldHalf}>
                <Text style={styles.fieldLabel}>Department / Unit</Text>
                <TextInput
                  style={[styles.inputBox, !isEditing && styles.inputBoxDisabled]}
                  value={department}
                  onChangeText={setDepartment}
                  editable={isEditing}
                />
              </View>

              <View style={styles.formFieldHalf}>
                <Text style={styles.fieldLabel}>Contact Phone Number</Text>
                <TextInput
                  style={[styles.inputBox, !isEditing && styles.inputBoxDisabled]}
                  value={phone}
                  onChangeText={setPhone}
                  editable={isEditing}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.formFieldHalf}>
                <Text style={styles.fieldLabel}>Location / Headquarters</Text>
                <TextInput
                  style={[styles.inputBox, !isEditing && styles.inputBoxDisabled]}
                  value={location}
                  onChangeText={setLocation}
                  editable={isEditing}
                />
              </View>
            </View>

            {isEditing && (
              <View style={styles.bottomSaveRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setIsEditing(false)}
                >
                  <Text style={styles.cancelBtnText}>Discard</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.primaryActionBtn, saving && { opacity: 0.7 }]}
                  onPress={handleSaveProfile}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="checkmark" size={17} color="#FFFFFF" />
                      <Text style={styles.primaryActionBtnText}>Save & Update</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* ======================================================== */}
        {/* TAB 2: SECURITY & CREDENTIALS                            */}
        {/* ======================================================== */}
        {activeTab === 'security' && (
          <View style={styles.cardSection}>
            <Text style={styles.sectionTitle}>Security & Access Control</Text>
            <Text style={styles.sectionDesc}>
              Credential protection and session governance for the admin console
            </Text>

            {/* 2FA Toggle Card */}
            <View style={styles.securityItemBox}>
              <View style={styles.secIconWrap}>
                <Ionicons name="phone-portrait-outline" size={24} color={colors.primary} />
              </View>
              <View style={styles.secTextWrap}>
                <Text style={styles.secItemTitle}>Two-Factor Authentication (2FA)</Text>
                <Text style={styles.secItemSub}>
                  Requires confirmation token when signing in from unrecognized terminals.
                </Text>
              </View>
              <Switch
                value={twoFactor}
                onValueChange={(val) => {
                  setTwoFactor(val);
                  updateAdminProfile({ twoFactorEnabled: val });
                  showToast(val ? '2FA enabled successfully' : '2FA disabled');
                }}
                trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                thumbColor={twoFactor ? colors.primary : '#9CA3AF'}
              />
            </View>

            {/* Change Password Card */}
            <View style={styles.subCard}>
              <View style={styles.subCardHeader}>
                <Ionicons name="key-outline" size={20} color="#4F46E5" />
                <Text style={styles.subCardTitle}>Update Access Password</Text>
              </View>

              <View style={styles.passGrid}>
                <View style={styles.passField}>
                  <Text style={styles.fieldLabel}>Current Password</Text>
                  <TextInput
                    style={styles.inputBox}
                    value={oldPassword}
                    onChangeText={setOldPassword}
                    placeholder="••••••••••••"
                    secureTextEntry
                  />
                </View>

                <View style={styles.passField}>
                  <Text style={styles.fieldLabel}>New Password</Text>
                  <TextInput
                    style={styles.inputBox}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Minimum 6 characters"
                    secureTextEntry
                  />
                </View>

                <View style={styles.passField}>
                  <Text style={styles.fieldLabel}>Confirm New Password</Text>
                  <TextInput
                    style={styles.inputBox}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Repeat new password"
                    secureTextEntry
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.btnUpdatePass, changingPass && { opacity: 0.7 }]}
                onPress={handlePasswordChange}
                disabled={changingPass}
                activeOpacity={0.8}
              >
                {changingPass ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="lock-closed" size={15} color="#FFFFFF" />
                    <Text style={styles.btnUpdatePassText}>Update Password</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Active Sessions List */}
            <View style={styles.subCard}>
              <View style={styles.subCardHeader}>
                <Ionicons name="desktop-outline" size={20} color={colors.textPrimary} />
                <Text style={styles.subCardTitle}>Authorized Sessions & Terminals</Text>
              </View>

              <View style={styles.sessionItem}>
                <View style={styles.sessionIconBox}>
                  <Ionicons name="laptop-outline" size={22} color={colors.primary} />
                </View>
                <View style={styles.sessionDetails}>
                  <View style={styles.sessionTitleRow}>
                    <Text style={styles.sessionDeviceName}>Google Chrome / Windows 11 (This terminal)</Text>
                    <View style={styles.currentSessionBadge}>
                      <Text style={styles.currentSessionBadgeText}>CURRENT SESSION</Text>
                    </View>
                  </View>
                  <Text style={styles.sessionMetaText}>
                    IP: {admin.ipAddress} • {admin.location} • Active now
                  </Text>
                </View>
              </View>

              <View style={styles.sessionItem}>
                <View style={styles.sessionIconBox}>
                  <Ionicons name="phone-portrait-outline" size={22} color={colors.textSecondary} />
                </View>
                <View style={styles.sessionDetails}>
                  <Text style={styles.sessionDeviceName}>Safari / iOS 17 (Mobile device)</Text>
                  <Text style={styles.sessionMetaText}>
                    IP: 189.204.112.50 • Mexico City, MX • 3 hours ago
                  </Text>
                </View>
              </View>
            </View>

          </View>
        )}

        {/* ======================================================== */}
        {/* TAB 3: PERMISSIONS & PRIVILEGES                          */}
        {/* ======================================================== */}
        {activeTab === 'permissions' && (
          <View style={styles.cardSection}>
            <Text style={styles.sectionTitle}>Permissions & Governance Matrix</Text>
            <Text style={styles.sectionDesc}>
              Capabilities granted with Super Administrator authorization level across the platform
            </Text>

            <View style={styles.permissionsGrid}>
              {admin.permissions?.map((perm, idx) => (
                <View key={idx} style={styles.permCard}>
                  <View style={styles.permCheckIcon}>
                    <Ionicons name="checkmark-sharp" size={16} color="#059669" />
                  </View>
                  <View style={styles.permContent}>
                    <Text style={styles.permTitle}>{perm}</Text>
                    <Text style={styles.permStatus}>AUTHORIZED • DIRECT</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.auditWarningBox}>
              <Ionicons name="information-circle" size={20} color="#3B82F6" />
              <Text style={styles.auditWarningText}>
                All contract revisions, escrow disbursements, and account suspensions are immutably archived with your cryptographic administrator signature ({admin.id}).
              </Text>
            </View>
          </View>
        )}

        {/* ======================================================== */}
        {/* TAB 4: STAFF DIRECTORY & PROVISIONING                     */}
        {/* ======================================================== */}
        {activeTab === 'team' && (
          <View style={styles.cardSection}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Administrator Directory & Staff</Text>
                <Text style={styles.sectionDesc}>
                  Provisioned platform operators and governance executives across SkillBridge
                </Text>
              </View>
              <TouchableOpacity
                style={styles.addAdminBtn}
                onPress={() => {
                  setAddAdminError(null);
                  setShowAddAdminModal(true);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="person-add" size={16} color="#FFFFFF" />
                <Text style={styles.addAdminBtnText}>Provision New Admin</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.adminCardsGrid}>
              {adminList.map((member, index) => {
                const isSuper = (member.role || '').toLowerCase().includes('super') || (member.accessLevel || '').includes('5');
                const isCurrent = member.email?.toLowerCase() === admin.email?.toLowerCase();
                return (
                  <View key={member.id || member.email || index} style={styles.adminMemberCard}>
                    <View style={styles.adminMemberHeader}>
                      <View style={styles.adminMemberAvatarWrap}>
                        <View style={[styles.adminMemberAvatar, isSuper && { backgroundColor: '#4F46E5' }]}>
                          <Text style={styles.adminMemberAvatarText}>
                            {member.avatarInitials || member.name?.substring(0, 2).toUpperCase() || 'AD'}
                          </Text>
                        </View>
                        <View style={styles.onlineStatusDot} />
                      </View>

                      <View style={{ flex: 1 }}>
                        <View style={styles.adminMemberNameRow}>
                          <Text style={styles.adminMemberName}>{member.name}</Text>
                          {isCurrent && (
                            <View style={styles.youBadge}>
                              <Text style={styles.youBadgeText}>YOU</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.adminMemberEmail}>{member.email}</Text>
                      </View>

                      <View style={[styles.roleBadgePill, isSuper ? styles.roleBadgeSuper : styles.roleBadgeStandard]}>
                        <Ionicons 
                          name={isSuper ? "shield-checkmark" : "shield-outline"} 
                          size={12} 
                          color={isSuper ? "#4338CA" : "#0284C7"} 
                        />
                        <Text style={[styles.roleBadgeText, isSuper ? styles.roleBadgeTextSuper : styles.roleBadgeTextStandard]}>
                          {member.role || 'Administrator'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.adminMemberDivider} />

                    <View style={styles.adminMemberMetaRow}>
                      <View style={styles.adminMetaCol}>
                        <Text style={styles.adminMetaLabel}>DEPARTMENT</Text>
                        <Text style={styles.adminMetaVal}>{member.department || 'Operations'}</Text>
                      </View>
                      <View style={styles.adminMetaCol}>
                        <Text style={styles.adminMetaLabel}>ACCESS LEVEL</Text>
                        <Text style={styles.adminMetaVal}>{member.accessLevel || 'Level 4 - Admin'}</Text>
                      </View>
                      <View style={styles.adminMetaCol}>
                        <Text style={styles.adminMetaLabel}>STATUS</Text>
                        <View style={styles.activeStatusTag}>
                          <View style={styles.statusDotGreen} />
                          <Text style={styles.activeStatusTagText}>{member.status || 'ACTIVE'}</Text>
                        </View>
                      </View>
                    </View>

                    {member.permissions && member.permissions.length > 0 && (
                      <View style={styles.adminPermTagsRow}>
                        {member.permissions.slice(0, 3).map((p, pIdx) => (
                          <View key={pIdx} style={styles.adminPermTag}>
                            <Ionicons name="checkmark-circle" size={11} color="#059669" />
                            <Text style={styles.adminPermTagText} numberOfLines={1}>{p}</Text>
                          </View>
                        ))}
                        {member.permissions.length > 3 && (
                          <View style={styles.adminPermTagMore}>
                            <Text style={styles.adminPermTagMoreText}>+{member.permissions.length - 3} more</Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

      </ScrollView>

      {/* ======================================================== */}
      {/* PROVISION NEW ADMINISTRATOR MODAL                         */}
      {/* ======================================================== */}
      <Modal
        visible={showAddAdminModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddAdminModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { maxWidth: 500, maxHeight: '90%' }]}>
            <ScrollView showsVerticalScrollIndicator={false} style={{ width: '100%' }}>
              <View style={styles.modalHeaderRow}>
                <View style={styles.modalTitleWrap}>
                  <View style={[styles.modalIconWrap, { backgroundColor: '#EEF2FF', width: 42, height: 42, borderRadius: 21, marginBottom: 0 }]}>
                    <Ionicons name="person-add" size={20} color="#4F46E5" />
                  </View>
                  <View>
                    <Text style={[styles.modalTitle, { textAlign: 'left', fontSize: 16 }]}>Provision Administrator</Text>
                    <Text style={[styles.modalDesc, { textAlign: 'left', marginTop: 2, fontSize: 12 }]}>Add a new operator with administrative console access</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setShowAddAdminModal(false)}>
                  <Ionicons name="close" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              {addAdminError && (
                <View style={styles.modalErrorBox}>
                  <Ionicons name="alert-circle" size={16} color="#DC2626" />
                  <Text style={styles.modalErrorText}>{addAdminError}</Text>
                </View>
              )}

              {/* Name */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Administrator Full Name *</Text>
                <TextInput
                  style={styles.modalTextInput}
                  value={newAdminName}
                  onChangeText={setNewAdminName}
                  placeholder="e.g. Dr. Arthur Pendelton"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* Email */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Official Email Address *</Text>
                <TextInput
                  style={styles.modalTextInput}
                  value={newAdminEmail}
                  onChangeText={setNewAdminEmail}
                  placeholder="e.g. a.pendelton@skillbridge.io"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              {/* Role selection chips */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Assigned Role & Privilege Scope *</Text>
                <View style={styles.modalRoleChipsWrap}>
                  {[
                    'Super Administrator',
                    'Operations Director',
                    'Trust & Safety Lead',
                    'Dispute & Escrow Arbitrator',
                    'Finance & Compliance Officer',
                    'Customer Support Lead'
                  ].map(r => (
                    <TouchableOpacity
                      key={r}
                      style={[
                        styles.modalRoleChip,
                        newAdminRole === r && styles.modalRoleChipActive
                      ]}
                      onPress={() => {
                        setNewAdminRole(r);
                        if (r.includes('Trust')) setNewAdminDept('Trust, Safety & Verification');
                        else if (r.includes('Dispute')) setNewAdminDept('Legal & Dispute Mediation');
                        else if (r.includes('Finance')) setNewAdminDept('Finance & Wallet Ledger');
                        else if (r.includes('Support')) setNewAdminDept('Customer Success & Appeals');
                        else setNewAdminDept('Platform Operations');
                      }}
                    >
                      <Text style={[
                        styles.modalRoleChipText,
                        newAdminRole === r && styles.modalRoleChipTextActive
                      ]}>
                        {r}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Department */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Department Unit</Text>
                <TextInput
                  style={styles.modalTextInput}
                  value={newAdminDept}
                  onChangeText={setNewAdminDept}
                  placeholder="e.g. Platform Operations & Governance"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* Phone */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Direct Contact Phone</Text>
                <TextInput
                  style={styles.modalTextInput}
                  value={newAdminPhone}
                  onChangeText={setNewAdminPhone}
                  placeholder="e.g. +1 (555) 019-2834"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                />
              </View>

              {/* Password */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Master Access Password (min 6 chars) *</Text>
                <TextInput
                  style={styles.modalTextInput}
                  value={newAdminPassword}
                  onChangeText={setNewAdminPassword}
                  placeholder="Initial password for login"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry
                />
              </View>

              {/* Passcode */}
              <View style={styles.modalInputGroup}>
                <Text style={styles.modalInputLabel}>Master Security Key *</Text>
                <TextInput
                  style={styles.modalTextInput}
                  value={newAdminPasscode}
                  onChangeText={setNewAdminPasscode}
                  placeholder="SKILLBRIDGE2026"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setShowAddAdminModal(false)}
                  disabled={creatingAdmin}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalConfirmBtn, { backgroundColor: '#4F46E5' }]}
                  onPress={handleProvisionAdmin}
                  disabled={creatingAdmin}
                >
                  {creatingAdmin ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalConfirmText}>Provision Administrator</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* LOGOUT CONFIRMATION MODAL                                */}
      {/* ======================================================== */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="log-out-outline" size={32} color={colors.danger} />
            </View>

            <Text style={styles.modalTitle}>Sign Out of Admin Console?</Text>
            <Text style={styles.modalDesc}>
              You will be signed out of the administrative console and returned to the SkillBridge login screen.
            </Text>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowLogoutModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleConfirmLogout}
                activeOpacity={0.8}
              >
                <Text style={styles.modalConfirmText}>Yes, Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 18,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  screenSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoutHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  logoutHeaderText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '700',
  },

  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    maxWidth: 1100,
    width: '100%',
    alignSelf: 'center',
  },

  // Hero Card
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  heroBanner: {
    height: 120,
    backgroundColor: '#0F172A',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    padding: 16,
  },
  heroBannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(37, 99, 235, 0.25)',
  },
  badgeTier: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FBBF24',
  },
  badgeTierText: {
    color: '#FBBF24',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  heroBody: {
    padding: 24,
    paddingTop: 0,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 20,
    flexWrap: 'wrap',
  },
  avatarWrap: {
    position: 'relative',
    marginTop: -48,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 5,
  },
  avatarText: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#10B981',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  adminMeta: {
    flex: 1,
    minWidth: 260,
    marginTop: 12,
  },
  nameHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  adminName: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  verifiedTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  adminRole: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 4,
  },
  contactChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  contactChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  contactChipText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: '#EFF6FF',
    marginTop: 12,
  },
  editProfileBtnActive: {
    borderColor: colors.danger,
    backgroundColor: '#FEF2F2',
  },
  editProfileBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },

  // Metrics Bar
  metricsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginTop: 24,
    flexWrap: 'wrap',
    gap: 12,
  },
  metricItem: {
    alignItems: 'center',
    minWidth: 120,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  metricDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
  },

  // Tabs
  tabNavRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 4,
  },
  tabNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  tabNavItemActive: {
    backgroundColor: '#EFF6FF',
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabNavText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabNavTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },

  // Card Section
  cardSection: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sectionDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 3,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // Form Fields
  formGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  formFieldHalf: {
    flex: 1,
    minWidth: 260,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  inputBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    fontSize: 14,
    color: colors.textPrimary,
  },
  inputBoxDisabled: {
    backgroundColor: colors.surfaceSubtle,
    color: colors.textSecondary,
    borderColor: colors.border,
  },
  bottomSaveRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelBtnText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },

  // Security Tab
  securityItemBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: colors.surfaceSubtle,
    padding: 18,
    borderRadius: 12,
    marginVertical: 16,
  },
  secIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secTextWrap: {
    flex: 1,
  },
  secItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  secItemSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  subCard: {
    marginTop: 18,
    padding: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  subCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  subCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  passGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  passField: {
    flex: 1,
    minWidth: 220,
  },
  btnUpdatePass: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#4F46E5',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 16,
  },
  btnUpdatePassText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sessionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: colors.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionDetails: {
    flex: 1,
  },
  sessionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sessionDeviceName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  currentSessionBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  currentSessionBadgeText: {
    color: '#065F46',
    fontSize: 10,
    fontWeight: '800',
  },
  sessionMetaText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Permissions Tab
  permissionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  permCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surfaceSubtle,
    padding: 14,
    borderRadius: 10,
    width: '48%',
    minWidth: 260,
    borderWidth: 1,
    borderColor: colors.border,
  },
  permCheckIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permContent: {
    flex: 1,
  },
  permTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  permStatus: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
    marginTop: 2,
  },
  auditWarningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#EFF6FF',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginTop: 20,
  },
  auditWarningText: {
    flex: 1,
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 18,
  },

  // Toast
  toastWrap: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 9999,
    backgroundColor: '#1E293B',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
  },
  modalIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  modalDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 19,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  modalCancelText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  modalConfirmBtn: {
    flex: 1,
    backgroundColor: colors.danger,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // ----------------------------------------------------
  // STAFF DIRECTORY & PROVISIONING STYLES
  // ----------------------------------------------------
  addAdminBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#4F46E5',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  addAdminBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  adminCardsGrid: {
    gap: 16,
    marginTop: 16,
  },
  adminMemberCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  adminMemberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  adminMemberAvatarWrap: {
    position: 'relative',
  },
  adminMemberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adminMemberAvatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  onlineStatusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  adminMemberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adminMemberName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  youBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  youBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#4F46E5',
  },
  adminMemberEmail: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  roleBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  roleBadgeSuper: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  roleBadgeStandard: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  roleBadgeTextSuper: {
    color: '#4338CA',
  },
  roleBadgeTextStandard: {
    color: '#0284C7',
  },
  adminMemberDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  adminMemberMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  adminMetaCol: {
    minWidth: 100,
  },
  adminMetaLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  adminMetaVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  activeStatusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusDotGreen: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  activeStatusTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  adminPermTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  adminPermTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  adminPermTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#166534',
    maxWidth: 160,
  },
  adminPermTagMore: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  adminPermTagMoreText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },

  // Modal Header & Inputs
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    width: '100%',
  },
  modalErrorText: {
    color: '#B91C1C',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  modalInputGroup: {
    width: '100%',
    marginBottom: 12,
  },
  modalInputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  modalTextInput: {
    width: '100%',
    height: 40,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
    outlineStyle: 'none',
  },
  modalRoleChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  modalRoleChip: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 6,
  },
  modalRoleChipActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  modalRoleChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  modalRoleChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
