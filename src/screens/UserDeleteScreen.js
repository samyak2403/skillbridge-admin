import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import StatusBadge from '../components/StatusBadge';
import {
  subscribeUserById,
  deleteUserDoc,
  subscribeAssignments,
  subscribeProposals,
  subscribeTransactions
} from '../services/adminService';

export default function UserDeleteScreen({ navigation, route }) {
  const initialUser = route?.params?.user || null;
  const userId = route?.params?.userId || initialUser?.id;

  const [user, setUser] = useState(initialUser);
  const [loading, setLoading] = useState(!initialUser);
  const [contractsCount, setContractsCount] = useState(0);
  const [proposalsCount, setProposalsCount] = useState(0);
  const [transactionsCount, setTransactionsCount] = useState(0);

  const [confirmUnderstood, setConfirmUnderstood] = useState(false);
  const [typedConfirm, setTypedConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const unsubUser = subscribeUserById(userId, (liveData) => {
      if (liveData) setUser(liveData);
      setLoading(false);
    });

    const unsubContracts = subscribeAssignments((data) => {
      const count = data.filter(c => 
        c.freelancerId === userId || 
        c.studentId === userId || 
        c.clientId === userId
      ).length;
      setContractsCount(count);
    });

    const unsubProposals = subscribeProposals((data) => {
      const count = data.filter(p => 
        p.freelancerId === userId || 
        p.studentId === userId
      ).length;
      setProposalsCount(count);
    });

    const unsubTxns = subscribeTransactions((data) => {
      const count = data.filter(t => t.userId === userId).length;
      setTransactionsCount(count);
    });

    return () => {
      if (unsubUser) unsubUser();
      if (unsubContracts) unsubContracts();
      if (unsubProposals) unsubProposals();
      if (unsubTxns) unsubTxns();
    };
  }, [userId]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const isConfirmed = confirmUnderstood || typedConfirm.trim().toUpperCase() === 'DELETE';

  const handlePerformDelete = async () => {
    if (!user || !isConfirmed) return;
    const effectiveId = user.id || user.uid || userId;
    setDeleting(true);
    try {
      await deleteUserDoc(effectiveId);
      showToast('User has been permanently deleted from Firestore.');
      setTimeout(() => {
        if (navigation?.navigate) {
          navigation.navigate('Users');
        } else if (navigation?.goBack) {
          navigation.goBack();
        }
      }, 1200);
    } catch (e) {
      setDeleting(false);
      showToast('Failed to delete user: ' + e.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Retrieving account details...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={54} color={colors.danger} />
        <Text style={styles.errorTitle}>Account Not Found</Text>
        <Text style={styles.errorSub}>The requested user account does not exist or was already deleted.</Text>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation?.navigate ? navigation.navigate('Users') : navigation?.goBack?.()}
        >
          <Ionicons name="arrow-back" size={16} color={colors.textWhite} />
          <Text style={styles.backBtnText}>Return to Users List</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Toast Notification */}
      {toastMessage && (
        <View style={styles.toastBanner}>
          <Ionicons name="information-circle" size={18} color={colors.textWhite} />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* Top Navigation */}
      <View style={styles.topNav}>
        <View style={styles.topNavInner}>
          <TouchableOpacity
            style={styles.navBack}
            onPress={() => navigation?.navigate ? navigation.navigate('UserDetail', { userId, user }) : navigation?.goBack?.()}
          >
            <Ionicons name="arrow-back" size={18} color={colors.textPrimary} />
            <Text style={styles.navBackText}>Back to Profile</Text>
          </TouchableOpacity>

          <View style={styles.navHeaderWrap}>
            <Text style={styles.navTitle}>Delete User Account</Text>
            <Text style={styles.navSubtitle}>Permanent Platform Purge</Text>
          </View>

          <View style={styles.dangerBadge}>
            <Ionicons name="warning" size={14} color={colors.danger} />
            <Text style={styles.dangerBadgeText}>DESTRUCTIVE</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.contentCard}>
          {/* Danger Banner */}
          <View style={styles.warningBox}>
            <View style={styles.warningIconCircle}>
              <Ionicons name="alert-circle" size={24} color={colors.danger} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.warningTitle}>Permanent Deletion Warning</Text>
              <Text style={styles.warningDesc}>
                You are about to permanently delete this user account from SkillBridge Firestore. All profile information will be unrecoverable.
              </Text>
            </View>
          </View>

          {/* User Details Card */}
          <View style={styles.userProfileSection}>
            <View style={styles.avatarWrap}>
              {user.profileImageUrl ? (
                <Image source={{ uri: user.profileImageUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitials}>
                    {(user.fullName || 'U').substring(0, 2).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>

            <View style={{ flex: 1 }}>
              <View style={styles.nameRow}>
                <Text style={styles.userName}>{user.fullName || 'Unnamed User'}</Text>
                <StatusBadge label={user.userRole || 'FREELANCER'} size="medium" />
              </View>

              <Text style={styles.userEmail}>
                <Ionicons name="mail-outline" size={13} color={colors.textSecondary} /> {user.email || 'No email registered'}
              </Text>

              <Text style={styles.userMeta}>
                UID: <Text style={{ fontFamily: 'monospace', color: colors.textPrimary }}>{user.id || user.uid || userId}</Text>
              </Text>

              <View style={styles.metaPillsRow}>
                <View style={[styles.pill, user.isVerified ? styles.pillSuccess : styles.pillWarning]}>
                  <Ionicons name={user.isVerified ? "shield-checkmark" : "shield-outline"} size={12} color={user.isVerified ? colors.success : colors.warning} />
                  <Text style={[styles.pillText, { color: user.isVerified ? colors.success : colors.warning }]}>
                    {user.isVerified ? 'Verified Account' : 'Unverified'}
                  </Text>
                </View>

                <View style={[styles.pill, user.isSuspended ? styles.pillDanger : styles.pillSuccess]}>
                  <Ionicons name={user.isSuspended ? "ban" : "checkmark-circle"} size={12} color={user.isSuspended ? colors.danger : colors.success} />
                  <Text style={[styles.pillText, { color: user.isSuspended ? colors.danger : colors.success }]}>
                    {user.isSuspended ? 'Suspended' : 'Active'}
                  </Text>
                </View>

                {typeof user.walletBalance === 'number' && (
                  <View style={[styles.pill, { backgroundColor: '#EAF1FF' }]}>
                    <Ionicons name="wallet-outline" size={12} color={colors.primary} />
                    <Text style={[styles.pillText, { color: colors.primary }]}>
                      Wallet: ₹{user.walletBalance.toLocaleString('en-IN')}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Associated Platform Audit */}
          <View style={styles.auditSection}>
            <Text style={styles.sectionHeading}>
              <Ionicons name="list-outline" size={16} color={colors.textPrimary} /> Associated Platform Activity
            </Text>

            <View style={styles.auditGrid}>
              <View style={styles.auditCard}>
                <Ionicons name="document-text-outline" size={22} color={colors.primary} />
                <View>
                  <Text style={styles.auditVal}>{contractsCount}</Text>
                  <Text style={styles.auditLabel}>Contracts / Assignments</Text>
                </View>
              </View>

              <View style={styles.auditCard}>
                <Ionicons name="paper-plane-outline" size={22} color={colors.info} />
                <View>
                  <Text style={styles.auditVal}>{proposalsCount}</Text>
                  <Text style={styles.auditLabel}>Submitted Proposals</Text>
                </View>
              </View>

              <View style={styles.auditCard}>
                <Ionicons name="card-outline" size={22} color={colors.success} />
                <View>
                  <Text style={styles.auditVal}>{transactionsCount}</Text>
                  <Text style={styles.auditLabel}>Transactions Recorded</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Safety Confirmations */}
          <View style={styles.confirmSection}>
            <Text style={styles.sectionHeading}>
              <Ionicons name="shield-checkmark-outline" size={16} color={colors.danger} /> Safety Confirmation Required
            </Text>

            {/* Checkbox confirmation */}
            <TouchableOpacity
              style={[styles.checkboxRow, confirmUnderstood && styles.checkboxRowActive]}
              onPress={() => setConfirmUnderstood(!confirmUnderstood)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, confirmUnderstood && styles.checkboxActive]}>
                {confirmUnderstood && <Ionicons name="checkmark" size={14} color={colors.textWhite} />}
              </View>
              <Text style={styles.checkboxLabel}>
                I understand that this action is irreversible and will permanently delete the user document from the database.
              </Text>
            </TouchableOpacity>

            <View style={styles.orDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.orText}>OR TYPE 'DELETE' TO CONFIRM</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Verification text field */}
            <TextInput
              style={[styles.typeInput, typedConfirm.trim().toUpperCase() === 'DELETE' && styles.typeInputActive]}
              placeholder="Type DELETE to enable deletion"
              placeholderTextColor={colors.textMuted}
              value={typedConfirm}
              onChangeText={setTypedConfirm}
              autoCapitalize="characters"
            />
          </View>

          {/* Action Button Bar */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => navigation?.navigate ? navigation.navigate('UserDetail', { userId, user }) : navigation?.goBack?.()}
              disabled={deleting}
            >
              <Ionicons name="close-circle-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.cancelBtnText}>Cancel & Keep Account</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.deleteBtn, !isConfirmed && styles.deleteBtnDisabled]}
              onPress={handlePerformDelete}
              disabled={!isConfirmed || deleting}
            >
              {deleting ? (
                <ActivityIndicator size="small" color={colors.textWhite} />
              ) : (
                <>
                  <Ionicons name="trash" size={16} color={colors.textWhite} />
                  <Text style={styles.deleteBtnText}>Permanently Delete User</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  toastBanner: {
    position: 'absolute',
    top: 20,
    alignSelf: 'center',
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.navy,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
  toastText: {
    color: colors.textWhite,
    fontSize: 13,
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 12,
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
    marginTop: 6,
    marginBottom: 20,
    textAlign: 'center',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backBtnText: {
    color: colors.textWhite,
    fontWeight: '700',
    fontSize: 13,
  },
  topNav: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    width: '100%',
  },
  topNavInner: {
    maxWidth: 1400,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  navBack: {
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
  navHeaderWrap: {
    alignItems: 'center',
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.danger,
  },
  navSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
  },
  dangerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.dangerLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  dangerBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.danger,
  },
  scrollContent: {
    maxWidth: 1400,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
    paddingBottom: 60,
  },
  contentCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 26,
    maxWidth: 820,
    alignSelf: 'center',
    width: '100%',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 18,
    borderRadius: 12,
    marginBottom: 24,
  },
  warningIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.danger,
    marginBottom: 4,
  },
  warningDesc: {
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 19,
  },
  userProfileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    padding: 18,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  avatarWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
    backgroundColor: colors.primary,
  },
  avatar: {
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
    color: colors.textWhite,
    fontSize: 24,
    fontWeight: '800',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  userEmail: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  userMeta: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 8,
  },
  metaPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 14,
  },
  pillSuccess: {
    backgroundColor: colors.successLight,
  },
  pillWarning: {
    backgroundColor: colors.warningLight,
  },
  pillDanger: {
    backgroundColor: colors.dangerLight,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  auditSection: {
    marginBottom: 24,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  auditGrid: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  auditCard: {
    flex: 1,
    minWidth: 180,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  auditVal: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  auditLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  confirmSection: {
    marginBottom: 24,
    padding: 18,
    backgroundColor: '#FFF1F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  checkboxRowActive: {
    borderColor: colors.danger,
    backgroundColor: '#FFF5F5',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  checkboxActive: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 18,
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#FECDD3',
  },
  orText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.danger,
    letterSpacing: 0.5,
  },
  typeInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  typeInputActive: {
    borderColor: colors.danger,
    backgroundColor: '#FFF5F5',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 10,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSubtle,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.danger,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 8,
  },
  deleteBtnDisabled: {
    opacity: 0.45,
  },
  deleteBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textWhite,
  },
});
