import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert, 
  Modal, 
  ScrollView,
  Image,
  TextInput,
  ActivityIndicator,
  useWindowDimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import AdminHeader from '../components/AdminHeader';
import SearchBar from '../components/SearchBar';
import StatusBadge from '../components/StatusBadge';
import { 
  subscribeUsers, 
  updateUserVerification, 
  updateUserRole, 
  updateUserDoc,
  deleteUserDoc 
} from '../services/adminService';

export default function UsersScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const numColumns = width >= 800 ? 4 : width >= 500 ? 2 : 1;
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');
  const [selectedUser, setSelectedUser] = useState(null);

  // Edit user state
  const [editingUser, setEditingUser] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('FREELANCER');
  const [editCollege, setEditCollege] = useState('');
  const [editCourse, setEditCourse] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editVerified, setEditVerified] = useState(false);
  const [editSuspended, setEditSuspended] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    const unsub = subscribeUsers(data => setUsers(data));
    return () => { if (unsub) unsub(); };
  }, []);

  const handleOpenEditUser = (user) => {
    setEditingUser(user);
    setEditName(user.fullName || '');
    setEditEmail(user.email || '');
    setEditRole(user.userRole || 'FREELANCER');
    setEditCollege(user.collegeName || '');
    setEditCourse(user.course || '');
    setEditBio(user.bio || '');
    setEditVerified(!!user.isVerified);
    setEditSuspended(!!user.isSuspended);
  };

  const handleSaveUser = async () => {
    if (!editName.trim()) {
      Alert.alert('Required', 'Please enter a name for the user.');
      return;
    }
    setSavingEdit(true);
    try {
      await updateUserDoc(editingUser.id, {
        fullName: editName.trim(),
        email: editEmail.trim(),
        userRole: editRole,
        collegeName: editCollege.trim(),
        course: editCourse.trim(),
        bio: editBio.trim(),
        isVerified: editVerified,
        isSuspended: editSuspended,
        status: editSuspended ? 'SUSPENDED' : 'ACTIVE'
      });
      setSavingEdit(false);
      setEditingUser(null);
      Alert.alert('Success', 'User profile updated successfully.');
    } catch (err) {
      setSavingEdit(false);
      Alert.alert('Error', err.message);
    }
  };

  const tabs = ['ALL', 'FREELANCERS', 'CLIENTS', 'UNVERIFIED', 'VERIFIED'];

  const filteredUsers = users.filter(u => {
    const nameMatch = (u.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
                      (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
                      (u.collegeName || '').toLowerCase().includes(search.toLowerCase());
    
    if (!nameMatch) return false;

    if (activeTab === 'FREELANCERS') return u.userRole === 'FREELANCER';
    if (activeTab === 'CLIENTS') return u.userRole === 'CLIENT';
    if (activeTab === 'UNVERIFIED') return !u.isVerified;
    if (activeTab === 'VERIFIED') return !!u.isVerified;
    return true;
  });

  const handleToggleVerification = async (user) => {
    try {
      const nextState = !user.isVerified;
      await updateUserVerification(user.id, nextState);
      Alert.alert('Success', `${user.fullName} is now ${nextState ? 'VERIFIED' : 'UNVERIFIED'}.`);
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const handleSwitchRole = async (user) => {
    const newRole = user.userRole === 'CLIENT' ? 'FREELANCER' : 'CLIENT';
    try {
      await updateUserRole(user.id, newRole);
    } catch (e) {
      console.error('Error switching role:', e);
    }
  };

  const handleDeleteUser = (user) => {
    if (navigation?.navigate) {
      navigation.navigate('UserDelete', { userId: user.id, user });
    }
  };

  const handleOpenUserDetail = (user) => {
    if (navigation?.navigate) {
      navigation.navigate('UserDetail', { userId: user.id, user });
    } else {
      setSelectedUser(user);
    }
  };

  const renderUserItem = ({ item }) => (
    <View style={[styles.cardWrapper, { width: `${100 / numColumns}%` }, numColumns === 1 && { marginBottom: 16 }]}>
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <TouchableOpacity 
            style={styles.cardHeader} 
            onPress={() => handleOpenUserDetail(item)}
            activeOpacity={0.8}
          >
            <View style={styles.avatarWrap}>
              {item.profileImageUrl ? (
                <Image source={{ uri: item.profileImageUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitials}>
                    {(item.fullName || 'U').substring(0, 2).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.userInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.userName} numberOfLines={1}>{item.fullName || 'Unnamed User'}</Text>
                <StatusBadge label={item.userRole || 'FREELANCER'} size="small" />
              </View>
              <Text style={styles.userEmail} numberOfLines={1}>{item.email || 'No email'}</Text>
              <Text style={styles.userCollege} numberOfLines={1}>{item.collegeName || item.course || 'Student'}</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.statsRow}>
            <Text style={styles.metaText} numberOfLines={1}>⭐ {item.rating || '0.0'} ({item.reviewCount || 0})</Text>
            <Text style={styles.metaText} numberOfLines={1}>• {item.completedProjects || 0} proj</Text>
            <Text style={[styles.metaText, { color: item.isVerified ? colors.success : colors.warning, fontWeight: '700' }]} numberOfLines={1}>
              {item.isVerified ? '✓ Verified' : '⚠ Unverified'}
            </Text>
          </View>
        </View>

        {/* Admin Action Buttons */}
        <View style={styles.cardBottom}>
          <View style={styles.actionsRow}>
            <TouchableOpacity 
              style={[styles.btn, styles.btnInfo, { flex: 1 }]} 
              onPress={() => handleOpenUserDetail(item)}
            >
              <Ionicons name="eye-outline" size={13} color={colors.info} />
              <Text style={[styles.btnText, { color: colors.info }]} numberOfLines={1}>View</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.btn, styles.btnSecondary, { flex: 1 }]} 
              onPress={() => handleOpenEditUser(item)}
            >
              <Ionicons name="create-outline" size={13} color={colors.primary} />
              <Text style={[styles.btnText, { color: colors.primary }]} numberOfLines={1}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.actionsRow, { marginTop: 4 }]}>
            <TouchableOpacity 
              style={[styles.btn, item.isVerified ? styles.btnWarning : styles.btnSuccess, { flex: 1 }]} 
              onPress={() => handleToggleVerification(item)}
            >
              <Ionicons 
                name={item.isVerified ? 'shield-outline' : 'shield-checkmark'} 
                size={13} 
                color={item.isVerified ? colors.warning : colors.success} 
              />
              <Text style={[styles.btnText, { color: item.isVerified ? colors.warning : colors.success }]} numberOfLines={1}>
                {item.isVerified ? 'Unverify' : 'Verify'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.btn, styles.btnSecondary, { flex: 1 }]} 
              onPress={() => handleSwitchRole(item)}
            >
              <Ionicons name="swap-horizontal" size={13} color={colors.primary} />
              <Text style={[styles.btnText, { color: colors.primary }]} numberOfLines={1}>Role</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.btn, styles.btnDanger]} 
              onPress={() => handleDeleteUser(item)}
            >
              <Ionicons name="trash-outline" size={13} color={colors.danger} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <AdminHeader title="User Management" subtitle={`${filteredUsers.length} Users Listed`} />

      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder="Search by name, email, college..."
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <FlatList
        key={numColumns}
        data={filteredUsers}
        keyExtractor={item => item.id}
        numColumns={numColumns}
        renderItem={renderUserItem}
        columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="people-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No users found</Text>
            <Text style={styles.emptySub}>Try adjusting your search query or tab filters</Text>
          </View>
        }
      />

      {/* User Detail Inspection Modal */}
      <Modal visible={!!selectedUser} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>User Profile Overview</Text>
              <TouchableOpacity onPress={() => setSelectedUser(null)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedUser ? (
              <ScrollView style={styles.modalBody}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>User ID:</Text>
                  <Text style={styles.detailVal}>{selectedUser.id}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Full Name:</Text>
                  <Text style={styles.detailVal}>{selectedUser.fullName}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email:</Text>
                  <Text style={styles.detailVal}>{selectedUser.email}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>College / Course:</Text>
                  <Text style={styles.detailVal}>{selectedUser.collegeName || 'N/A'} - {selectedUser.course || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>User Role:</Text>
                  <StatusBadge label={selectedUser.userRole} />
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Hourly Rate:</Text>
                  <Text style={styles.detailVal}>₹{selectedUser.hourlyRate || 0} / hr</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Bio / Summary:</Text>
                  <Text style={styles.detailVal}>{selectedUser.bio || 'No bio written'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Skills:</Text>
                  <Text style={styles.detailVal}>
                    {Array.isArray(selectedUser.skills) && selectedUser.skills.length > 0
                      ? selectedUser.skills.join(', ')
                      : 'None registered'}
                  </Text>
                </View>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* Full Control: Edit User Modal */}
      <Modal visible={!!editingUser} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 540 }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Edit User Profile</Text>
                <Text style={styles.modalSub}>ID: {editingUser?.id}</Text>
              </View>
              <TouchableOpacity onPress={() => setEditingUser(null)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {editingUser ? (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <Text style={styles.formLabel}>Full Name *</Text>
                <TextInput
                  style={styles.formInput}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Enter user name"
                />

                <Text style={styles.formLabel}>Email Address</Text>
                <TextInput
                  style={styles.formInput}
                  value={editEmail}
                  onChangeText={setEditEmail}
                  placeholder="name@college.edu"
                  keyboardType="email-address"
                />

                <Text style={styles.formLabel}>Platform Role</Text>
                <View style={styles.rolePickerRow}>
                  {['FREELANCER', 'CLIENT', 'ADMIN'].map(r => (
                    <TouchableOpacity
                      key={r}
                      style={[styles.roleOption, editRole === r && styles.roleOptionActive]}
                      onPress={() => setEditRole(r)}
                    >
                      <Text style={[styles.roleOptionText, editRole === r && styles.roleOptionTextActive]}>
                        {r}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.formLabel}>College / University</Text>
                <TextInput
                  style={styles.formInput}
                  value={editCollege}
                  onChangeText={setEditCollege}
                  placeholder="e.g. Ashokrao Mane Polytechnic"
                />

                <Text style={styles.formLabel}>Course / Department</Text>
                <TextInput
                  style={styles.formInput}
                  value={editCourse}
                  onChangeText={setEditCourse}
                  placeholder="e.g. Computer Engineering"
                />

                <Text style={styles.formLabel}>Bio & Description</Text>
                <TextInput
                  style={[styles.formInput, { height: 70, textAlignVertical: 'top' }]}
                  value={editBio}
                  onChangeText={setEditBio}
                  placeholder="Brief user introduction..."
                  multiline
                />

                {/* Status Toggles */}
                <View style={styles.togglesBox}>
                  <TouchableOpacity
                    style={[styles.toggleBtn, editVerified && styles.toggleBtnActiveSuccess]}
                    onPress={() => setEditVerified(!editVerified)}
                  >
                    <Ionicons 
                      name={editVerified ? "shield-checkmark" : "shield-outline"} 
                      size={18} 
                      color={editVerified ? colors.textWhite : colors.success} 
                    />
                    <Text style={[styles.toggleBtnText, editVerified && styles.toggleBtnTextWhite]}>
                      {editVerified ? 'Official Badge: VERIFIED' : 'Set as VERIFIED'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.toggleBtn, editSuspended && styles.toggleBtnActiveDanger]}
                    onPress={() => setEditSuspended(!editSuspended)}
                  >
                    <Ionicons 
                      name={editSuspended ? "ban" : "checkmark-circle-outline"} 
                      size={18} 
                      color={editSuspended ? colors.textWhite : colors.danger} 
                    />
                    <Text style={[styles.toggleBtnText, editSuspended && styles.toggleBtnTextWhite]}>
                      {editSuspended ? 'Account SUSPENDED' : 'Account ACTIVE'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.saveSubmitBtn}
                  onPress={handleSaveUser}
                  disabled={savingEdit}
                >
                  {savingEdit ? (
                    <ActivityIndicator size="small" color={colors.textWhite} />
                  ) : (
                    <>
                      <Ionicons name="checkmark-done" size={18} color={colors.textWhite} />
                      <Text style={styles.saveSubmitBtnText}>Save User Modifications</Text>
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            ) : null}
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
  listContent: {
    maxWidth: 1600,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 48,
  },
  columnWrapper: {
    flexDirection: 'row',
    marginHorizontal: -8,
    marginBottom: 16,
  },
  cardWrapper: {
    paddingHorizontal: 8,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#0F172A',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  cardTop: {
    display: 'flex',
    flexDirection: 'column',
  },
  cardBottom: {
    display: 'flex',
    flexDirection: 'column',
    marginTop: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarWrap: {
    marginRight: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.navy,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: colors.textWhite,
    fontSize: 14,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 4,
  },
  userName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  userEmail: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  userCollege: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 6,
  },
  metaText: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 3,
    borderWidth: 1,
  },
  btnSuccess: {
    backgroundColor: colors.successLight,
    borderColor: colors.success + '40',
  },
  btnWarning: {
    backgroundColor: colors.warningLight,
    borderColor: colors.warning + '40',
  },
  btnSecondary: {
    backgroundColor: colors.surfaceSubtle,
    borderColor: colors.border,
  },
  btnInfo: {
    backgroundColor: colors.infoLight,
    borderColor: colors.info + '40',
  },
  btnDanger: {
    backgroundColor: colors.dangerLight,
    borderColor: colors.danger + '40',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  btnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyWrap: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modalBody: {
    marginBottom: 20,
  },
  detailRow: {
    marginBottom: 14,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  detailVal: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  modalSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: 10,
  },
  formInput: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.textPrimary,
  },
  rolePickerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  roleOption: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
  },
  roleOptionActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  roleOptionText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  roleOptionTextActive: {
    color: colors.textWhite,
  },
  togglesBox: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
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
  toggleBtnActiveSuccess: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  toggleBtnActiveDanger: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
  toggleBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  toggleBtnTextWhite: {
    color: colors.textWhite,
  },
  saveSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 16,
    marginBottom: 10,
  },
  saveSubmitBtnText: {
    color: colors.textWhite,
    fontSize: 13,
    fontWeight: '700',
  },
});
