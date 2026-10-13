import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  Modal, 
  TextInput,
  Image,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import StatusBadge from '../components/StatusBadge';
import { 
  subscribeUserById, 
  updateUserVerification, 
  updateUserRole, 
  updateUserDoc,
  adjustUserWalletBalance,
  deleteUserDoc,
  sendNotificationToUser,
  subscribeAssignments,
  subscribeProposals,
  subscribeTransactions
} from '../services/adminService';

export default function UserDetailScreen({ navigation, route }) {
  const initialUser = route?.params?.user || null;
  const userId = route?.params?.userId || initialUser?.id;

  const [user, setUser] = useState(initialUser);
  const [loading, setLoading] = useState(!initialUser);
  const [activeTab, setActiveTab] = useState('OVERVIEW');

  // Related data states
  const [contracts, setContracts] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [transactions, setTransactions] = useState([]);

  // Toast feedback state
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const effectiveUserId = user?.id || user?.uid || userId || initialUser?.id || initialUser?.uid;

  // Direct notification modal
  const [notifyModalVisible, setNotifyModalVisible] = useState(false);
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');
  const [sendingNotif, setSendingNotif] = useState(false);

  // Edit Profile modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('FREELANCER');
  const [editCollege, setEditCollege] = useState('');
  const [editCourse, setEditCourse] = useState('');
  const [editGradYear, setEditGradYear] = useState('');
  const [editHourlyRate, setEditHourlyRate] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvailability, setEditAvailability] = useState('Available');
  const [editVerified, setEditVerified] = useState(false);
  const [editSuspended, setEditSuspended] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  // Balance Adjustment modal state
  const [balanceModalVisible, setBalanceModalVisible] = useState(false);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceType, setBalanceType] = useState('CREDIT'); // 'CREDIT' or 'DEBIT'
  const [balanceReason, setBalanceReason] = useState('');
  const [adjustingBalance, setAdjustingBalance] = useState(false);

  // Switch Role modal state
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [selectedNewRole, setSelectedNewRole] = useState('CLIENT');
  const [switchingRole, setSwitchingRole] = useState(false);

  // Delete User modal state
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletingUser, setDeletingUser] = useState(false);

  // Suspend / Verification confirmation modals
  const [suspendModalVisible, setSuspendModalVisible] = useState(false);
  const [suspendingUser, setSuspendingUser] = useState(false);
  const [verifyModalVisible, setVerifyModalVisible] = useState(false);
  const [verifyingUser, setVerifyingUser] = useState(false);

  const handleOpenEdit = () => {
    if (!user) return;
    setEditName(user.fullName || '');
    setEditEmail(user.email || '');
    setEditRole(user.userRole || 'FREELANCER');
    setEditCollege(user.collegeName || '');
    setEditCourse(user.course || '');
    setEditGradYear(String(user.graduationYear || ''));
    setEditHourlyRate(String(user.hourlyRate || '0'));
    setEditBio(user.bio || '');
    setEditAvailability(user.availability || 'Available');
    setEditVerified(!!user.isVerified);
    setEditSuspended(!!user.isSuspended);
    setEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      showToast('User name is required.', 'error');
      return;
    }
    if (!effectiveUserId) {
      showToast('Cannot identify user ID.', 'error');
      return;
    }
    setSavingEdit(true);
    try {
      const updateData = {
        fullName: editName.trim(),
        email: editEmail.trim(),
        userRole: editRole,
        collegeName: editCollege.trim(),
        course: editCourse.trim(),
        graduationYear: editGradYear.trim(),
        hourlyRate: parseFloat(editHourlyRate) || 0,
        bio: editBio.trim(),
        availability: editAvailability,
        isVerified: editVerified,
        isSuspended: editSuspended,
        status: editSuspended ? 'SUSPENDED' : 'ACTIVE'
      };
      await updateUserDoc(effectiveUserId, updateData);
      setUser(prev => prev ? {
        ...prev,
        ...updateData
      } : null);
      setSavingEdit(false);
      setEditModalVisible(false);
      showToast('User profile saved successfully.', 'success');
    } catch (e) {
      setSavingEdit(false);
      showToast('Error saving profile: ' + e.message, 'error');
    }
  };

  const handleExecuteBalanceAdjustment = async () => {
    const num = parseFloat(balanceAmount);
    if (!num || num <= 0) {
      showToast('Please enter an amount greater than ₹0.', 'error');
      return;
    }
    if (!effectiveUserId) {
      showToast('Cannot identify user ID.', 'error');
      return;
    }
    setAdjustingBalance(true);
    try {
      const delta = balanceType === 'CREDIT' ? num : -num;
      const res = await adjustUserWalletBalance(effectiveUserId, delta, balanceReason || 'Admin wallet adjustment');
      const updatedBalance = res?.newBalance !== undefined 
        ? res.newBalance 
        : Math.max(0, ((user?.walletBalance || 0) + delta));
      setUser(prev => prev ? {
        ...prev,
        walletBalance: updatedBalance
      } : null);
      setAdjustingBalance(false);
      setBalanceModalVisible(false);
      setBalanceAmount('');
      setBalanceReason('');
      showToast(`₹${num} successfully ${balanceType === 'CREDIT' ? 'credited to' : 'debited from'} wallet.`, 'success');
    } catch (e) {
      setAdjustingBalance(false);
      showToast('Error adjusting balance: ' + e.message, 'error');
    }
  };

  const handleOpenRoleModal = () => {
    if (!user) return;
    const defaultTarget = user.userRole === 'CLIENT' ? 'FREELANCER' : 'CLIENT';
    setSelectedNewRole(defaultTarget);
    setRoleModalVisible(true);
  };

  const handleExecuteRoleSwitch = async () => {
    if (!effectiveUserId || !selectedNewRole) return;
    setSwitchingRole(true);
    try {
      await updateUserRole(effectiveUserId, selectedNewRole);
      setUser(prev => prev ? { ...prev, userRole: selectedNewRole } : null);
      setSwitchingRole(false);
      setRoleModalVisible(false);
      showToast(`User role successfully changed to ${selectedNewRole}.`, 'success');
    } catch (e) {
      setSwitchingRole(false);
      showToast('Error switching role: ' + e.message, 'error');
    }
  };

  const handleConfirmToggleSuspend = async () => {
    if (!effectiveUserId || !user) return;
    setSuspendingUser(true);
    const nextSuspended = !user.isSuspended;
    try {
      await updateUserDoc(effectiveUserId, { 
        isSuspended: nextSuspended,
        status: nextSuspended ? 'SUSPENDED' : 'ACTIVE'
      });
      setUser(prev => prev ? { 
        ...prev, 
        isSuspended: nextSuspended, 
        status: nextSuspended ? 'SUSPENDED' : 'ACTIVE' 
      } : null);
      setSuspendingUser(false);
      setSuspendModalVisible(false);
      showToast(`Account is now ${nextSuspended ? 'SUSPENDED' : 'ACTIVE'}.`, 'success');
    } catch (e) {
      setSuspendingUser(false);
      showToast('Error: ' + e.message, 'error');
    }
  };

  const handleConfirmToggleVerification = async () => {
    if (!effectiveUserId || !user) return;
    setVerifyingUser(true);
    const nextVerified = !user.isVerified;
    try {
      await updateUserVerification(effectiveUserId, nextVerified);
      setUser(prev => prev ? { ...prev, isVerified: nextVerified } : null);
      setVerifyingUser(false);
      setVerifyModalVisible(false);
      showToast(`Account is now ${nextVerified ? 'VERIFIED' : 'UNVERIFIED'}.`, 'success');
    } catch (e) {
      setVerifyingUser(false);
      showToast('Error: ' + e.message, 'error');
    }
  };

  const handleOpenDeleteModal = () => {
    setDeleteModalVisible(true);
  };

  const handleExecuteDelete = async () => {
    if (!effectiveUserId) return;
    setDeletingUser(true);
    try {
      await deleteUserDoc(effectiveUserId);
      setDeletingUser(false);
      setDeleteModalVisible(false);
      showToast('User permanently removed from database.', 'success');
      setTimeout(() => {
        if (navigation?.navigate) {
          navigation.navigate('Users');
        } else if (navigation?.goBack) {
          navigation.goBack();
        }
      }, 900);
    } catch (e) {
      setDeletingUser(false);
      showToast('Error deleting user: ' + e.message, 'error');
    }
  };

  // Subscribe to live user doc
  useEffect(() => {
    if (!effectiveUserId) {
      setLoading(false);
      return;
    }

    const unsubUser = subscribeUserById(effectiveUserId, (liveData) => {
      if (liveData) {
        setUser(liveData);
      }
      setLoading(false);
    }, (err) => {
      console.warn('Live user subscription warning:', err);
      setLoading(false);
    });

    // Subscribe to related collections for complete audit
    const unsubContracts = subscribeAssignments((data) => {
      const userContracts = data.filter(c => 
        c.freelancerId === effectiveUserId || 
        c.studentId === effectiveUserId || 
        c.clientId === effectiveUserId
      );
      setContracts(userContracts);
    });

    const unsubProposals = subscribeProposals((data) => {
      const userProposals = data.filter(p => 
        p.freelancerId === effectiveUserId || 
        p.studentId === effectiveUserId
      );
      setProposals(userProposals);
    });

    const unsubTxns = subscribeTransactions((data) => {
      const userTxns = data.filter(t => t.userId === effectiveUserId);
      setTransactions(userTxns);
    });

    return () => {
      if (unsubUser) unsubUser();
      if (unsubContracts) unsubContracts();
      if (unsubProposals) unsubProposals();
      if (unsubTxns) unsubTxns();
    };
  }, [effectiveUserId]);

  const handleSendNotification = async () => {
    if (!notifTitle.trim() || !notifBody.trim()) {
      showToast('Please enter both title and body.', 'error');
      return;
    }
    setSendingNotif(true);
    try {
      await sendNotificationToUser({
        userId: effectiveUserId,
        title: notifTitle.trim(),
        body: notifBody.trim(),
        type: 'ADMIN'
      });
      setSendingNotif(false);
      setNotifyModalVisible(false);
      setNotifTitle('');
      setNotifBody('');
      showToast(`Notification dispatched to ${user?.fullName || 'user'}.`, 'success');
    } catch (e) {
      setSendingNotif(false);
      showToast('Error sending notification: ' + e.message, 'error');
    }
  };

  const formatDate = (val) => {
    if (!val) return 'N/A';
    try {
      const d = typeof val === 'number' ? new Date(val) : new Date(val);
      return d.toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return String(val);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerWrap}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading user profile...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centerWrap}>
        <Ionicons name="alert-circle-outline" size={54} color={colors.danger} />
        <Text style={styles.errorTitle}>User Not Found</Text>
        <Text style={styles.errorSub}>The requested user account does not exist or has been removed.</Text>
        <TouchableOpacity 
          style={styles.backBtnPrimary}
          onPress={() => navigation?.navigate ? navigation.navigate('Users') : navigation?.goBack?.()}
        >
          <Ionicons name="arrow-back" size={16} color={colors.textWhite} />
          <Text style={styles.backBtnText}>Back to Users</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Floating Action Toast */}
      {toast && (
        <View style={[styles.toastBanner, toast.type === 'error' ? styles.toastError : styles.toastSuccess]}>
          <Ionicons 
            name={toast.type === 'error' ? 'alert-circle' : 'checkmark-circle'} 
            size={18} 
            color={colors.textWhite} 
          />
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      )}

      {/* Top Navigation Bar */}
      <View style={styles.navBar}>
        <View style={styles.navBarInner}>
          <TouchableOpacity 
            style={styles.navBackBtn}
            onPress={() => navigation?.navigate ? navigation.navigate('Users') : navigation?.goBack?.()}
          >
            <Ionicons name="arrow-back" size={18} color={colors.textPrimary} />
            <Text style={styles.navBackText}>Back to Users</Text>
          </TouchableOpacity>

          <View style={styles.navCenter}>
            <Text style={styles.navTitle}>User Profile Overview</Text>
            <Text style={styles.navSubtitle}>UID: {effectiveUserId}</Text>
          </View>

          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>SYNCED</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.avatarWrap}>
              {user.profileImageUrl ? (
                <Image source={{ uri: user.profileImageUrl }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitials}>
                    {(user.fullName || 'U').substring(0, 2).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.heroDetails}>
              <View style={styles.nameRow}>
                <Text style={styles.heroName}>{user.fullName || 'Unnamed User'}</Text>
                <StatusBadge label={user.userRole || 'FREELANCER'} size="medium" />
              </View>

              <Text style={styles.heroEmail}>
                <Ionicons name="mail-outline" size={14} color={colors.textSecondary} /> {user.email || 'No email registered'}
              </Text>

              <Text style={styles.heroCollege}>
                <Ionicons name="school-outline" size={14} color={colors.textSecondary} /> {user.collegeName || 'College not specified'}
                {user.course ? ` • ${user.course}` : ''}
                {user.graduationYear ? ` (Class of ${user.graduationYear})` : ''}
              </Text>

              <View style={styles.badgesRow}>
                <View style={[
                  styles.verifiedPill, 
                  user.isVerified ? styles.pillSuccess : styles.pillWarning
                ]}>
                  <Ionicons 
                    name={user.isVerified ? "shield-checkmark" : "alert-circle-outline"} 
                    size={13} 
                    color={user.isVerified ? colors.success : colors.warning} 
                  />
                  <Text style={[
                    styles.pillText,
                    { color: user.isVerified ? colors.success : colors.warning }
                  ]}>
                    {user.isVerified ? 'Verified Student Account' : 'Unverified Account'}
                  </Text>
                </View>

                <View style={styles.availPill}>
                  <Ionicons name="time-outline" size={13} color={colors.primary} />
                  <Text style={[styles.pillText, { color: colors.primary }]}>
                    {user.availability || 'Available'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Quick Admin Actions Row */}
          <View style={styles.actionToolbar}>
            <TouchableOpacity 
              style={[styles.toolBtn, styles.toolBtnPrimary]}
              onPress={handleOpenEdit}
            >
              <Ionicons name="create-outline" size={16} color={colors.primary} />
              <Text style={[styles.toolBtnText, { color: colors.primary }]}>Edit Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.toolBtn, styles.toolBtnSuccess]}
              onPress={() => setBalanceModalVisible(true)}
            >
              <Ionicons name="wallet-outline" size={16} color={colors.success} />
              <Text style={[styles.toolBtnText, { color: colors.success }]}>Adjust Balance</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.toolBtn, user.isSuspended ? styles.toolBtnSuccess : styles.toolBtnWarning]}
              onPress={() => setSuspendModalVisible(true)}
            >
              <Ionicons 
                name={user.isSuspended ? "checkmark-circle-outline" : "ban-outline"} 
                size={16} 
                color={user.isSuspended ? colors.success : colors.warning} 
              />
              <Text style={[styles.toolBtnText, { color: user.isSuspended ? colors.success : colors.warning }]}>
                {user.isSuspended ? 'Reactivate Account' : 'Suspend Account'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.toolBtn, user.isVerified ? styles.toolBtnWarning : styles.toolBtnSuccess]}
              onPress={() => setVerifyModalVisible(true)}
            >
              <Ionicons 
                name={user.isVerified ? "shield-outline" : "shield-checkmark"} 
                size={16} 
                color={user.isVerified ? colors.warning : colors.success} 
              />
              <Text style={[styles.toolBtnText, { color: user.isVerified ? colors.warning : colors.success }]}>
                {user.isVerified ? 'Revoke Verification' : 'Verify Account'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.toolBtn, styles.toolBtnPrimary]}
              onPress={handleOpenRoleModal}
            >
              <Ionicons name="swap-horizontal" size={16} color={colors.primary} />
              <Text style={[styles.toolBtnText, { color: colors.primary }]}>
                Switch to {user.userRole === 'CLIENT' ? 'Freelancer' : 'Client'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.toolBtn, styles.toolBtnInfo]}
              onPress={() => setNotifyModalVisible(true)}
            >
              <Ionicons name="notifications-outline" size={16} color={colors.info} />
              <Text style={[styles.toolBtnText, { color: colors.info }]}>Send Notification</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.toolBtn, { borderColor: '#0284C7' }]}
              onPress={() => navigation.navigate('Support', { search: user.email || user.id })}
            >
              <Ionicons name="headset-outline" size={16} color="#0284C7" />
              <Text style={[styles.toolBtnText, { color: '#0284C7' }]}>Support Tickets</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.toolBtn, styles.toolBtnDanger]}
              onPress={handleOpenDeleteModal}
            >
              <Ionicons name="trash-outline" size={16} color={colors.danger} />
              <Text style={[styles.toolBtnText, { color: colors.danger }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Metrics Grid */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <View style={[styles.metricIconWrap, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="star" size={20} color={colors.warning} />
            </View>
            <View>
              <Text style={styles.metricVal}>⭐ {user.rating || '0.0'}</Text>
              <Text style={styles.metricLabel}>{user.reviewCount || 0} Total Reviews</Text>
            </View>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIconWrap, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="checkmark-done-circle" size={20} color={colors.success} />
            </View>
            <View>
              <Text style={styles.metricVal}>{user.completedProjects || 0}</Text>
              <Text style={styles.metricLabel}>Completed Projects</Text>
            </View>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIconWrap, { backgroundColor: '#EAF1FF' }]}>
              <Ionicons name="wallet-outline" size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.metricVal}>₹{(user.walletBalance || 0).toLocaleString('en-IN')}</Text>
              <Text style={styles.metricLabel}>Wallet Balance</Text>
            </View>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIconWrap, { backgroundColor: '#F1F5F9' }]}>
              <Ionicons name="cash-outline" size={20} color={colors.navy} />
            </View>
            <View>
              <Text style={styles.metricVal}>₹{user.hourlyRate || 0}</Text>
              <Text style={styles.metricLabel}>Hourly Rate (INR/hr)</Text>
            </View>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIconWrap, { backgroundColor: '#CFFAFE' }]}>
              <Ionicons name="pie-chart-outline" size={20} color={colors.info} />
            </View>
            <View>
              <Text style={styles.metricVal}>{user.profileCompletion || 100}%</Text>
              <Text style={styles.metricLabel}>Profile Completion</Text>
            </View>
          </View>
        </View>

        {/* Navigation Tabs for Details */}
        <View style={styles.tabsRow}>
          {[
            { key: 'OVERVIEW', label: 'Academic & Bio', icon: 'person-outline' },
            { key: 'CONTRACTS', label: `Contracts (${contracts.length})`, icon: 'document-text-outline' },
            { key: 'PROPOSALS', label: `Proposals (${proposals.length})`, icon: 'paper-plane-outline' },
            { key: 'FINANCE', label: `Transactions (${transactions.length})`, icon: 'wallet-outline' },
            { key: 'RAW_JSON', label: 'Raw Firestore Data', icon: 'code-slash-outline' },
          ].map(tab => (
            <TouchableOpacity 
              key={tab.key}
              style={[styles.tabBtn, activeTab === tab.key && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Ionicons 
                name={tab.icon} 
                size={16} 
                color={activeTab === tab.key ? colors.primary : colors.textSecondary} 
              />
              <Text style={[styles.tabBtnText, activeTab === tab.key && styles.tabBtnTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content Display */}
        {activeTab === 'OVERVIEW' && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="information-circle-outline" size={18} color={colors.primary} /> Academic & Personal Information
            </Text>

            <View style={styles.infoGrid}>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Full Legal Name</Text>
                <Text style={styles.infoValue}>{user.fullName || 'N/A'}</Text>
              </View>

              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Primary Email</Text>
                <Text style={styles.infoValue}>{user.email || 'N/A'}</Text>
              </View>

              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>College / University</Text>
                <Text style={styles.infoValue}>{user.collegeName || 'Not specified'}</Text>
              </View>

              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Degree / Course</Text>
                <Text style={styles.infoValue}>{user.course || 'Not specified'}</Text>
              </View>

              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Expected Graduation Year</Text>
                <Text style={styles.infoValue}>{user.graduationYear || 'N/A'}</Text>
              </View>

              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Account Role</Text>
                <Text style={styles.infoValue}>{user.userRole || 'FREELANCER'}</Text>
              </View>

              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Member Since</Text>
                <Text style={styles.infoValue}>{formatDate(user.createdAt)}</Text>
              </View>

              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Last Updated</Text>
                <Text style={styles.infoValue}>{formatDate(user.updatedAt)}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <Text style={styles.subSectionTitle}>Bio & Professional Summary</Text>
            <View style={styles.bioBox}>
              <Text style={styles.bioText}>
                {user.bio ? user.bio : 'No profile summary or biography provided yet by this user.'}
              </Text>
            </View>

            <View style={styles.divider} />

            <Text style={styles.subSectionTitle}>Skills & Competencies</Text>
            {Array.isArray(user.skills) && user.skills.length > 0 ? (
              <View style={styles.skillsWrapper}>
                {user.skills.map((skill, idx) => (
                  <View key={idx} style={styles.skillChip}>
                    <Ionicons name="checkmark-circle" size={13} color={colors.primary} />
                    <Text style={styles.skillChipText}>{skill}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyNotice}>No skills cataloged on this profile.</Text>
            )}
          </View>
        )}

        {activeTab === 'CONTRACTS' && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="document-text-outline" size={18} color={colors.primary} /> Contracts & Assignments
            </Text>

            {contracts.length === 0 ? (
              <View style={styles.emptyBlock}>
                <Ionicons name="folder-open-outline" size={40} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>No Contracts Found</Text>
                <Text style={styles.emptySub}>This user does not currently have any active or completed contract assignments.</Text>
              </View>
            ) : (
              contracts.map((c) => (
                <View key={c.id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemTitle}>{c.projectTitle || 'Assignment #' + c.id}</Text>
                    <StatusBadge label={c.status || 'ACTIVE'} size="small" />
                  </View>
                  <View style={styles.itemMetaRow}>
                    <Text style={styles.itemMeta}>Budget: ₹{c.agreedBudget || 0}</Text>
                    <Text style={styles.itemMeta}>Client: {c.clientName || 'N/A'}</Text>
                    <Text style={styles.itemMeta}>Freelancer: {c.freelancerName || 'N/A'}</Text>
                    <Text style={styles.itemMeta}>Created: {formatDate(c.createdAt)}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'PROPOSALS' && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="paper-plane-outline" size={18} color={colors.primary} /> Proposals Submitted
            </Text>

            {proposals.length === 0 ? (
              <View style={styles.emptyBlock}>
                <Ionicons name="mail-open-outline" size={40} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>No Proposals Found</Text>
                <Text style={styles.emptySub}>This student has not submitted proposals on marketplace projects yet.</Text>
              </View>
            ) : (
              proposals.map((p) => (
                <View key={p.id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemTitle}>{p.projectTitle || 'Proposal for Project'}</Text>
                    <StatusBadge label={p.status || 'PENDING'} size="small" />
                  </View>
                  <View style={styles.itemMetaRow}>
                    <Text style={styles.itemMeta}>Bid Amount: ₹{p.bidAmount || 0}</Text>
                    <Text style={styles.itemMeta}>Delivery Time: {p.deliveryDays || 'N/A'} days</Text>
                    <Text style={styles.itemMeta}>Submitted: {formatDate(p.createdAt)}</Text>
                  </View>
                  {p.coverLetter ? (
                    <Text style={styles.coverLetterSnippet} numberOfLines={2}>
                      "{p.coverLetter}"
                    </Text>
                  ) : null}
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'FINANCE' && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="wallet-outline" size={18} color={colors.primary} /> Wallet & Transaction Ledger
            </Text>

            {transactions.length === 0 ? (
              <View style={styles.emptyBlock}>
                <Ionicons name="card-outline" size={40} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>No Financial Transactions</Text>
                <Text style={styles.emptySub}>No wallet earnings, deposits, or withdrawals recorded for this user.</Text>
              </View>
            ) : (
              transactions.map((tx) => (
                <View key={tx.id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <View style={styles.txRow}>
                      <Ionicons 
                        name={tx.transactionType === 'EARNING' ? 'arrow-down-circle' : 'arrow-up-circle'} 
                        size={18} 
                        color={tx.transactionType === 'EARNING' ? colors.success : colors.warning} 
                      />
                      <Text style={styles.itemTitle}>
                        {tx.transactionType || 'TRANSACTION'} — ₹{Math.abs(tx.amount || 0)}
                      </Text>
                    </View>
                    <StatusBadge label={tx.paymentStatus || 'COMPLETED'} size="small" />
                  </View>
                  <View style={styles.itemMetaRow}>
                    <Text style={styles.itemMeta}>Description: {tx.description || tx.projectTitle || 'N/A'}</Text>
                    <Text style={styles.itemMeta}>Date: {formatDate(tx.createdAt)}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'RAW_JSON' && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="code-slash-outline" size={18} color={colors.primary} /> Firestore Document Raw Data
            </Text>
            <View style={styles.codeBox}>
              <Text style={styles.codeText}>{JSON.stringify(user, null, 2)}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Direct Notification Modal */}
      <Modal visible={notifyModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.notifDialog}>
            <View style={styles.modalHeader}>
              <View style={styles.brandRow}>
                <Ionicons name="notifications" size={18} color={colors.primary} />
                <Text style={styles.modalHeaderTitle}>Send Direct Notification</Text>
              </View>
              <TouchableOpacity onPress={() => setNotifyModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.dialogSubtitle}>
              Dispatch an in-app alert directly to <Text style={{ fontWeight: '700' }}>{user.fullName || 'this user'}</Text>.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notification Title</Text>
              <TextInput 
                style={styles.textInput}
                placeholder="e.g. Profile Verification Notice"
                placeholderTextColor={colors.textMuted}
                value={notifTitle}
                onChangeText={setNotifTitle}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Message Body</Text>
              <TextInput 
                style={[styles.textInput, styles.textArea]}
                placeholder="Write message content for the user..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
                value={notifBody}
                onChangeText={setNotifBody}
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelBtn} 
                onPress={() => setNotifyModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.sendBtn} 
                onPress={handleSendNotification}
                disabled={sendingNotif}
              >
                {sendingNotif ? (
                  <ActivityIndicator size="small" color={colors.textWhite} />
                ) : (
                  <>
                    <Ionicons name="send" size={14} color={colors.textWhite} />
                    <Text style={styles.sendBtnText}>Dispatch</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal visible={editModalVisible} animationType="fade" transparent onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxWidth: 580 }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Edit User Profile</Text>
                <Text style={styles.modalSubtitle}>UID: {effectiveUserId}</Text>
              </View>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 500 }} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Legal Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="e.g. Rahul Sharma"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <TextInput
                  style={styles.textInput}
                  value={editEmail}
                  onChangeText={setEditEmail}
                  placeholder="e.g. rahul@example.com"
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Account Role</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                  {['FREELANCER', 'CLIENT', 'ADMIN'].map(r => (
                    <TouchableOpacity
                      key={r}
                      style={[
                        styles.roleChip,
                        editRole === r && styles.roleChipActive
                      ]}
                      onPress={() => setEditRole(r)}
                    >
                      <Text style={[styles.roleChipText, editRole === r && styles.roleChipTextActive]}>
                        {r}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>College / University</Text>
                <TextInput
                  style={styles.textInput}
                  value={editCollege}
                  onChangeText={setEditCollege}
                  placeholder="College or Institute name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Course / Department</Text>
                <TextInput
                  style={styles.textInput}
                  value={editCourse}
                  onChangeText={setEditCourse}
                  placeholder="e.g. B.Tech Computer Science"
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Graduation Year</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editGradYear}
                    onChangeText={setEditGradYear}
                    placeholder="2026"
                    keyboardType="numeric"
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Hourly Rate (₹ INR)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editHourlyRate}
                    onChangeText={setEditHourlyRate}
                    placeholder="300"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Availability Status</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                  {['Available', 'Busy', 'Not Available'].map(a => (
                    <TouchableOpacity
                      key={a}
                      style={[
                        styles.roleChip,
                        editAvailability === a && styles.roleChipActive
                      ]}
                      onPress={() => setEditAvailability(a)}
                    >
                      <Text style={[styles.roleChipText, editAvailability === a && styles.roleChipTextActive]}>
                        {a}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Bio & Professional Summary</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={editBio}
                  onChangeText={setEditBio}
                  placeholder="Profile summary or bio..."
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 8, marginVertical: 12 }}>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    editVerified && { backgroundColor: colors.success, borderColor: colors.success }
                  ]}
                  onPress={() => setEditVerified(!editVerified)}
                >
                  <Ionicons name={editVerified ? "shield-checkmark" : "shield-outline"} size={16} color={editVerified ? colors.textWhite : colors.success} />
                  <Text style={[styles.toggleBtnText, editVerified && { color: colors.textWhite }]}>
                    {editVerified ? 'Verified Account' : 'Mark as Unverified'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    editSuspended && { backgroundColor: colors.danger, borderColor: colors.danger }
                  ]}
                  onPress={() => setEditSuspended(!editSuspended)}
                >
                  <Ionicons name={editSuspended ? "ban" : "checkmark-circle-outline"} size={16} color={editSuspended ? colors.textWhite : colors.danger} />
                  <Text style={[styles.toggleBtnText, editSuspended && { color: colors.textWhite }]}>
                    {editSuspended ? 'Account Suspended' : 'Account Active'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditModalVisible(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.sendBtn, { backgroundColor: colors.primary }]} onPress={handleSaveProfile} disabled={savingEdit}>
                  {savingEdit ? (
                    <ActivityIndicator size="small" color={colors.textWhite} />
                  ) : (
                    <>
                      <Ionicons name="checkmark" size={14} color={colors.textWhite} />
                      <Text style={styles.sendBtnText}>Save Profile</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Adjust Balance Modal */}
      <Modal visible={balanceModalVisible} animationType="fade" transparent onRequestClose={() => setBalanceModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxWidth: 460 }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Adjust Wallet Balance</Text>
                <Text style={styles.modalSubtitle}>User: {user?.fullName || 'User'}</Text>
              </View>
              <TouchableOpacity onPress={() => setBalanceModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 14 }}>
              {/* Current Balance Display */}
              <View style={styles.currentBalanceBox}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="wallet-outline" size={20} color={colors.primary} />
                  <Text style={styles.currentBalanceLabel}>Current Wallet Balance</Text>
                </View>
                <Text style={styles.currentBalanceValue}>₹{(user?.walletBalance || 0).toLocaleString('en-IN')}</Text>
              </View>

              {/* Credit / Debit Action Selector */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  style={[
                    styles.balanceTypeBtn,
                    balanceType === 'CREDIT' && { backgroundColor: colors.success, borderColor: colors.success }
                  ]}
                  onPress={() => setBalanceType('CREDIT')}
                >
                  <Ionicons name="add-circle" size={16} color={balanceType === 'CREDIT' ? colors.textWhite : colors.success} />
                  <Text style={[styles.balanceTypeBtnText, balanceType === 'CREDIT' && { color: colors.textWhite }]}>
                    Credit (+)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.balanceTypeBtn,
                    balanceType === 'DEBIT' && { backgroundColor: colors.danger, borderColor: colors.danger }
                  ]}
                  onPress={() => setBalanceType('DEBIT')}
                >
                  <Ionicons name="remove-circle" size={16} color={balanceType === 'DEBIT' ? colors.textWhite : colors.danger} />
                  <Text style={[styles.balanceTypeBtnText, balanceType === 'DEBIT' && { color: colors.textWhite }]}>
                    Debit (-)
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Adjustment Amount (₹ INR) *</Text>
                <TextInput
                  style={styles.textInput}
                  value={balanceAmount}
                  onChangeText={setBalanceAmount}
                  placeholder="e.g. 500"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Reason / Audit Note</Text>
                <TextInput
                  style={styles.textInput}
                  value={balanceReason}
                  onChangeText={setBalanceReason}
                  placeholder="e.g. Milestone settlement, platform bonus, or escrow correction"
                />
              </View>

              {/* Balance Calculation Preview */}
              {parseFloat(balanceAmount) > 0 && (
                <View style={styles.previewBox}>
                  <Text style={styles.previewLabel}>New Balance After Adjustment:</Text>
                  <Text style={[styles.previewValue, { color: balanceType === 'CREDIT' ? colors.success : colors.danger }]}>
                    ₹{Math.max(0, (user?.walletBalance || 0) + (balanceType === 'CREDIT' ? parseFloat(balanceAmount) : -parseFloat(balanceAmount))).toLocaleString('en-IN')}
                  </Text>
                </View>
              )}

              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setBalanceModalVisible(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.sendBtn, { backgroundColor: balanceType === 'CREDIT' ? colors.success : colors.danger }]}
                  onPress={handleExecuteBalanceAdjustment}
                  disabled={adjustingBalance}
                >
                  {adjustingBalance ? (
                    <ActivityIndicator size="small" color={colors.textWhite} />
                  ) : (
                    <>
                      <Ionicons name="checkmark-done" size={15} color={colors.textWhite} />
                      <Text style={styles.sendBtnText}>Execute Adjustment</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Switch Role Modal */}
      <Modal visible={roleModalVisible} animationType="fade" transparent onRequestClose={() => setRoleModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxWidth: 480 }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Switch User Role</Text>
                <Text style={styles.modalSubtitle}>Current Role: {user?.userRole || 'FREELANCER'}</Text>
              </View>
              <TouchableOpacity onPress={() => setRoleModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 14 }}>
              <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                Select the target role for <Text style={{ fontWeight: '800', color: colors.textPrimary }}>{user?.fullName || 'this user'}</Text>:
              </Text>

              {[
                { 
                  role: 'CLIENT', 
                  title: 'Client Account', 
                  desc: 'Can post projects, hire freelancers, create contracts, and manage escrows.',
                  icon: 'briefcase-outline' 
                },
                { 
                  role: 'FREELANCER', 
                  title: 'Freelancer / Student Account', 
                  desc: 'Can browse projects, submit proposals, complete milestones, and receive earnings.',
                  icon: 'school-outline' 
                },
                { 
                  role: 'ADMIN', 
                  title: 'Platform Administrator', 
                  desc: 'Full administrative access to SkillBridge control consoles.',
                  icon: 'shield-outline' 
                }
              ].map(opt => (
                <TouchableOpacity
                  key={opt.role}
                  style={[
                    styles.roleCardOption,
                    selectedNewRole === opt.role && styles.roleCardOptionActive
                  ]}
                  onPress={() => setSelectedNewRole(opt.role)}
                >
                  <View style={[
                    styles.roleIconCircle,
                    selectedNewRole === opt.role && { backgroundColor: colors.primary }
                  ]}>
                    <Ionicons 
                      name={opt.icon} 
                      size={18} 
                      color={selectedNewRole === opt.role ? colors.textWhite : colors.primary} 
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.roleOptionTitle, selectedNewRole === opt.role && { color: colors.primary }]}>
                      {opt.title}
                    </Text>
                    <Text style={styles.roleOptionDesc}>{opt.desc}</Text>
                  </View>
                  {selectedNewRole === opt.role && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}

              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setRoleModalVisible(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.sendBtn, { backgroundColor: colors.primary }]}
                  onPress={handleExecuteRoleSwitch}
                  disabled={switchingRole}
                >
                  {switchingRole ? (
                    <ActivityIndicator size="small" color={colors.textWhite} />
                  ) : (
                    <>
                      <Ionicons name="swap-horizontal" size={15} color={colors.textWhite} />
                      <Text style={styles.sendBtnText}>Confirm Switch to {selectedNewRole}</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete User Modal */}
      <Modal visible={deleteModalVisible} animationType="fade" transparent onRequestClose={() => setDeleteModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxWidth: 500 }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.danger }]}>Delete User Account</Text>
                <Text style={styles.modalSubtitle}>Permanent Removal from Firestore</Text>
              </View>
              <TouchableOpacity onPress={() => setDeleteModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 14 }}>
              {/* Danger Warning Box */}
              <View style={styles.dangerNoticeBox}>
                <Ionicons name="warning" size={22} color={colors.danger} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.dangerNoticeTitle}>Irreversible Action</Text>
                  <Text style={styles.dangerNoticeText}>
                    Deleting this user will permanently remove their profile document ({effectiveUserId}) from Firestore.
                  </Text>
                </View>
              </View>

              {/* User Snapshot */}
              <View style={styles.deleteUserSnapshot}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: colors.textPrimary }}>{user?.fullName || 'User'}</Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>{user?.email || 'No email'}</Text>
                <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 4 }}>Role: {user?.userRole || 'FREELANCER'} • UID: {effectiveUserId}</Text>
              </View>

              <View style={{ gap: 10, marginTop: 6 }}>
                {/* Option 1: Open Dedicated Deletion Page */}
                <TouchableOpacity
                  style={styles.openDeletePageBtn}
                  onPress={() => {
                    setDeleteModalVisible(false);
                    navigation?.navigate?.('UserDelete', { userId: effectiveUserId, user });
                  }}
                >
                  <Ionicons name="open-outline" size={16} color={colors.primary} />
                  <Text style={styles.openDeletePageText}>Open Full Deletion Audit Page</Text>
                </TouchableOpacity>

                {/* Option 2: Delete Immediately */}
                <TouchableOpacity
                  style={styles.deleteNowBtn}
                  onPress={handleExecuteDelete}
                  disabled={deletingUser}
                >
                  {deletingUser ? (
                    <ActivityIndicator size="small" color={colors.textWhite} />
                  ) : (
                    <>
                      <Ionicons name="trash" size={16} color={colors.textWhite} />
                      <Text style={styles.deleteNowBtnText}>Permanently Delete Now</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              <View style={{ alignItems: 'center', marginTop: 4 }}>
                <TouchableOpacity onPress={() => setDeleteModalVisible(false)}>
                  <Text style={{ fontSize: 13, color: colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Suspend Confirmation Modal */}
      <Modal visible={suspendModalVisible} animationType="fade" transparent onRequestClose={() => setSuspendModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxWidth: 440 }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{user?.isSuspended ? 'Reactivate Account' : 'Suspend Account'}</Text>
                <Text style={styles.modalSubtitle}>User: {user?.fullName}</Text>
              </View>
              <TouchableOpacity onPress={() => setSuspendModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 14 }}>
              <Text style={{ fontSize: 13, color: colors.textPrimary, lineHeight: 20 }}>
                {user?.isSuspended 
                  ? `Are you sure you want to reinstate ${user?.fullName}? They will regain full access to SkillBridge marketplace features.`
                  : `Are you sure you want to suspend ${user?.fullName}? While suspended, they will be blocked from signing in or submitting proposals.`
                }
              </Text>

              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setSuspendModalVisible(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.sendBtn, { backgroundColor: user?.isSuspended ? colors.success : colors.danger }]}
                  onPress={handleConfirmToggleSuspend}
                  disabled={suspendingUser}
                >
                  {suspendingUser ? (
                    <ActivityIndicator size="small" color={colors.textWhite} />
                  ) : (
                    <>
                      <Ionicons name={user?.isSuspended ? "checkmark-circle" : "ban"} size={15} color={colors.textWhite} />
                      <Text style={styles.sendBtnText}>{user?.isSuspended ? 'Reactivate Now' : 'Suspend Account'}</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Verify Confirmation Modal */}
      <Modal visible={verifyModalVisible} animationType="fade" transparent onRequestClose={() => setVerifyModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxWidth: 440 }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{user?.isVerified ? 'Revoke Verification' : 'Verify Account'}</Text>
                <Text style={styles.modalSubtitle}>User: {user?.fullName}</Text>
              </View>
              <TouchableOpacity onPress={() => setVerifyModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 14 }}>
              <Text style={{ fontSize: 13, color: colors.textPrimary, lineHeight: 20 }}>
                {user?.isVerified 
                  ? `Revoke verified badge for ${user?.fullName}? Their verified student checkmark will be removed.`
                  : `Grant verified badge to ${user?.fullName}? They will receive a verified badge on their public profile.`
                }
              </Text>

              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setVerifyModalVisible(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.sendBtn, { backgroundColor: user?.isVerified ? colors.warning : colors.success }]}
                  onPress={handleConfirmToggleVerification}
                  disabled={verifyingUser}
                >
                  {verifyingUser ? (
                    <ActivityIndicator size="small" color={colors.textWhite} />
                  ) : (
                    <>
                      <Ionicons name={user?.isVerified ? "shield-outline" : "shield-checkmark"} size={15} color={colors.textWhite} />
                      <Text style={styles.sendBtnText}>{user?.isVerified ? 'Revoke Badge' : 'Verify Account'}</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
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
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 12,
  },
  errorSub: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
    maxWidth: 360,
  },
  backBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  backBtnText: {
    color: colors.textWhite,
    fontWeight: '700',
    fontSize: 14,
  },
  navBar: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    width: '100%',
  },
  navBarInner: {
    maxWidth: 1400,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  navBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: colors.surfaceSubtle,
  },
  navBackText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  navCenter: {
    alignItems: 'center',
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  navSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.successLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.success,
  },
  scrollContent: {
    maxWidth: 1400,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 60,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    marginBottom: 20,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 20,
    flexWrap: 'wrap',
  },
  avatarWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    overflow: 'hidden',
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textWhite,
  },
  heroDetails: {
    flex: 1,
    minWidth: 260,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 6,
  },
  heroName: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  heroEmail: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  heroCollege: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  pillSuccess: {
    backgroundColor: colors.successLight,
  },
  pillWarning: {
    backgroundColor: colors.warningLight,
  },
  availPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EAF1FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexWrap: 'wrap',
  },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  toolBtnSuccess: {
    backgroundColor: colors.successLight,
    borderColor: colors.success,
  },
  toolBtnWarning: {
    backgroundColor: colors.warningLight,
    borderColor: colors.warning,
  },
  toolBtnPrimary: {
    backgroundColor: '#EAF1FF',
    borderColor: colors.primary,
  },
  toolBtnInfo: {
    backgroundColor: colors.infoLight,
    borderColor: colors.info,
  },
  toolBtnDanger: {
    backgroundColor: colors.dangerLight,
    borderColor: colors.danger,
  },
  toolBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    minWidth: 160,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metricIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  metricLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabBtnActive: {
    backgroundColor: '#EAF1FF',
    borderColor: colors.primary,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabBtnTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 22,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 18,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  infoCol: {
    width: '48%',
    minWidth: 200,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 18,
  },
  subSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  bioBox: {
    backgroundColor: colors.surfaceSubtle,
    padding: 14,
    borderRadius: 8,
  },
  bioText: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  skillsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EAF1FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#C7D9FE',
  },
  skillChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  emptyNotice: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  emptyBlock: {
    alignItems: 'center',
    paddingVertical: 36,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 320,
  },
  itemCard: {
    backgroundColor: colors.surfaceSubtle,
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  itemMetaRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  itemMeta: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  coverLetterSnippet: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 6,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  codeBox: {
    backgroundColor: colors.navy,
    padding: 16,
    borderRadius: 8,
  },
  codeText: {
    fontFamily: 'monospace',
    color: '#38BDF8',
    fontSize: 11,
  },
  // Floating Toast
  toastBanner: {
    position: 'absolute',
    top: 20,
    alignSelf: 'center',
    zIndex: 99999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    boxShadow: '0 8px 24px rgba(0,0,0,0.22)',
  },
  toastSuccess: {
    backgroundColor: '#0F766E', // rich teal
  },
  toastError: {
    backgroundColor: '#DC2626', // strong red
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // Modals Styling
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 540,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    boxShadow: '0 20px 35px rgba(0,0,0,0.25)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  dialogSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 18,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notifDialog: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },

  // Role Chips & Form Toggles
  roleChip: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSubtle,
  },
  roleChipActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  roleChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  roleChipTextActive: {
    color: colors.textWhite,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSubtle,
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  // Wallet Balance Modal Specific Styles
  currentBalanceBox: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentBalanceLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  currentBalanceValue: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.primary,
  },
  balanceTypeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSubtle,
  },
  balanceTypeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  previewBox: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  previewValue: {
    fontSize: 15,
    fontWeight: '800',
  },

  // Role Option Cards
  roleCardOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSubtle,
  },
  roleCardOptionActive: {
    backgroundColor: '#EFF6FF',
    borderColor: colors.primary,
  },
  roleIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EAF1FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleOptionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  roleOptionDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
  },

  // Delete User Modal Specific Styles
  dangerNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 14,
    borderRadius: 10,
  },
  dangerNoticeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.danger,
    marginBottom: 3,
  },
  dangerNoticeText: {
    fontSize: 12,
    color: colors.textPrimary,
    lineHeight: 17,
  },
  deleteUserSnapshot: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  openDeletePageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: '#EFF6FF',
  },
  openDeletePageText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  deleteNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.danger,
  },
  deleteNowBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textWhite,
  },

  // Form Inputs & Footer
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.textPrimary,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 14,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  sendBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textWhite,
  },
});
