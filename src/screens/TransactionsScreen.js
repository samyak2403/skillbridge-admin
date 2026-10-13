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
  subscribeTransactions, 
  approveWithdrawal, 
  rejectWithdrawal,
  createTransactionDoc,
  updateTransactionDoc,
  deleteTransactionDoc
} from '../services/adminService';

export default function TransactionsScreen() {
  const { width } = useWindowDimensions();
  const numColumns = width >= 800 ? 4 : width >= 500 ? 2 : 1;

  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');

  // Create Transaction State
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createUserId, setCreateUserId] = useState('');
  const [createAmount, setCreateAmount] = useState('');
  const [createType, setCreateType] = useState('EARNING');
  const [createStatus, setCreateStatus] = useState('COMPLETED');
  const [createDesc, setCreateDesc] = useState('');
  const [createRef, setCreateRef] = useState('');
  const [creatingTx, setCreatingTx] = useState(false);

  // Edit Transaction State
  const [editingTx, setEditingTx] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [editType, setEditType] = useState('EARNING');
  const [editStatus, setEditStatus] = useState('COMPLETED');
  const [editDesc, setEditDesc] = useState('');
  const [editRef, setEditRef] = useState('');
  const [savingTx, setSavingTx] = useState(false);

  useEffect(() => {
    const unsub = subscribeTransactions(data => setTransactions(data));
    return () => { if (unsub) unsub(); };
  }, []);

  const tabs = ['ALL', 'PENDING', 'WITHDRAWAL', 'EARNING', 'COMPLETED', 'REJECTED'];

  const filteredTransactions = transactions.filter(t => {
    const textMatch = (t.description || '').toLowerCase().includes(search.toLowerCase()) ||
                      (t.projectTitle || '').toLowerCase().includes(search.toLowerCase()) ||
                      (t.providerReference || '').toLowerCase().includes(search.toLowerCase());
    
    if (!textMatch) return false;
    if (activeTab === 'ALL') return true;
    if (activeTab === 'PENDING') return t.paymentStatus === 'PENDING';
    if (activeTab === 'WITHDRAWAL') return t.transactionType === 'WITHDRAWAL';
    if (activeTab === 'EARNING') return t.transactionType === 'EARNING';
    if (activeTab === 'COMPLETED') return t.paymentStatus === 'COMPLETED';
    if (activeTab === 'REJECTED') return t.paymentStatus === 'REJECTED';
    return true;
  });

  const handleApprove = (tx) => {
    Alert.alert(
      'Approve Payout',
      `Confirm bank transfer payout of ₹${Math.abs(tx.amount)} INR?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Approve Payout', 
          onPress: async () => {
            try {
              await approveWithdrawal(tx.id, tx.userId, tx.amount);
              Alert.alert('Approved', 'Payout marked as completed.');
            } catch (e) {
              Alert.alert('Error', e.message);
            }
          }
        }
      ]
    );
  };

  const handleReject = (tx) => {
    Alert.prompt
      ? Alert.prompt(
          'Reject Withdrawal',
          'Provide reason for rejection (e.g. Invalid UPI ID / Account Number):',
          async (reason) => {
            try {
              await rejectWithdrawal(tx.id, tx.userId, tx.amount, reason);
              Alert.alert('Rejected', 'Withdrawal marked as rejected.');
            } catch (e) {
              Alert.alert('Error', e.message);
            }
          }
        )
      : Alert.alert(
          'Reject Withdrawal',
          `Reject payout of ₹${Math.abs(tx.amount)} INR?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Reject', 
              style: 'destructive',
              onPress: async () => {
                try {
                  await rejectWithdrawal(tx.id, tx.userId, tx.amount, 'Bank account verification failed');
                  Alert.alert('Rejected', 'Withdrawal request rejected.');
                } catch (e) {
                  Alert.alert('Error', e.message);
                }
              }
            }
          ]
        );
  };

  const handleCreateTx = async () => {
    if (!createAmount || isNaN(parseFloat(createAmount))) {
      Alert.alert('Required', 'Please enter a valid amount.');
      return;
    }
    setCreatingTx(true);
    try {
      await createTransactionDoc({
        userId: createUserId.trim() || 'ADMIN_OVERRIDE',
        amount: parseFloat(createAmount),
        transactionType: createType,
        paymentStatus: createStatus,
        description: createDesc.trim() || `${createType} Entry`,
        providerReference: createRef.trim() || `MANUAL-${Date.now()}`
      });
      setCreatingTx(false);
      setCreateModalVisible(false);
      setCreateAmount('');
      setCreateDesc('');
      setCreateRef('');
      setCreateUserId('');
      Alert.alert('Created', 'Transaction recorded to platform ledger.');
    } catch (e) {
      setCreatingTx(false);
      Alert.alert('Error', e.message);
    }
  };

  const handleOpenEditTx = (tx) => {
    setEditingTx(tx);
    setEditAmount(String(tx.amount ?? 0));
    setEditType(tx.transactionType || 'EARNING');
    setEditStatus(tx.paymentStatus || 'COMPLETED');
    setEditDesc(tx.description || '');
    setEditRef(tx.providerReference || '');
  };

  const handleSaveEditTx = async () => {
    if (!editAmount || isNaN(parseFloat(editAmount))) {
      Alert.alert('Required', 'Please enter a valid amount.');
      return;
    }
    setSavingTx(true);
    try {
      await updateTransactionDoc(editingTx.id, {
        amount: parseFloat(editAmount),
        transactionType: editType,
        paymentStatus: editStatus,
        description: editDesc.trim(),
        providerReference: editRef.trim()
      });
      setSavingTx(false);
      setEditingTx(null);
      Alert.alert('Updated', 'Ledger transaction updated successfully.');
    } catch (e) {
      setSavingTx(false);
      Alert.alert('Error', e.message);
    }
  };

  const handleDeleteTx = (tx) => {
    Alert.alert(
      'Delete Ledger Entry',
      `Permanently delete this transaction (${tx.description || tx.id})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Entry',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTransactionDoc(tx.id);
              Alert.alert('Deleted', 'Transaction deleted from ledger.');
            } catch (e) {
              Alert.alert('Error', e.message);
            }
          }
        }
      ]
    );
  };

  const renderTransactionItem = ({ item }) => {
    const isNegative = item.amount < 0 || item.transactionType === 'WITHDRAWAL';
    const amountColor = isNegative ? colors.danger : colors.success;
    const isPendingWithdrawal = item.transactionType === 'WITHDRAWAL' && item.paymentStatus === 'PENDING';

    return (
      <View style={[styles.cardWrapper, { width: `${100 / numColumns}%` }, numColumns === 1 && { marginBottom: 16 }]}>
        <View style={styles.card}>
          <View style={styles.cardTop}>
            <View style={styles.cardHeader}>
              <View style={styles.badgeRow}>
                <StatusBadge label={item.transactionType || 'TRANSACTION'} size="small" />
                <StatusBadge label={item.paymentStatus || 'COMPLETED'} size="small" />
              </View>
              <Text style={[styles.amount, { color: amountColor }]}>
                {isNegative ? '-' : '+'}₹{Math.abs(item.amount || 0).toLocaleString()}
              </Text>
            </View>

            <View style={styles.infoWrap}>
              <Text style={styles.desc} numberOfLines={1}>{item.description || 'Ledger Transaction'}</Text>
              <Text style={styles.ref} numberOfLines={1}>Ref: {item.providerReference || item.id}</Text>
            </View>
          </View>

          <View style={styles.cardBottom}>
            <View style={styles.cardActions}>
              <TouchableOpacity 
                style={[styles.smallBtn, styles.btnSecondary, { flex: 1 }]}
                onPress={() => handleOpenEditTx(item)}
              >
                <Ionicons name="create-outline" size={13} color={colors.primary} />
                <Text style={styles.smallBtnText}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.smallBtn, styles.btnDangerLight]}
                onPress={() => handleDeleteTx(item)}
              >
                <Ionicons name="trash-outline" size={13} color={colors.danger} />
              </TouchableOpacity>
            </View>

            {isPendingWithdrawal ? (
              <View style={[styles.actionRow, { marginTop: 4 }]}>
                <TouchableOpacity 
                  style={[styles.btn, styles.btnSuccess, { flex: 1 }]} 
                  onPress={() => handleApprove(item)}
                >
                  <Ionicons name="checkmark-circle" size={13} color={colors.success} />
                  <Text style={[styles.btnText, { color: colors.success }]} numberOfLines={1}>Approve</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.btn, styles.btnDanger, { flex: 1 }]} 
                  onPress={() => handleReject(item)}
                >
                  <Ionicons name="close-circle" size={13} color={colors.danger} />
                  <Text style={[styles.btnText, { color: colors.danger }]} numberOfLines={1}>Reject</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <AdminHeader title="Financial Ledger & Payouts" subtitle={`${filteredTransactions.length} Transactions Recorded`} />

      <View style={styles.topActionsRow}>
        <TouchableOpacity 
          style={styles.addTxBtn}
          onPress={() => setCreateModalVisible(true)}
        >
          <Ionicons name="add-circle" size={16} color={colors.textWhite} />
          <Text style={styles.addTxBtnText}>+ Record Ledger Entry</Text>
        </TouchableOpacity>
      </View>

      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder="Search by description, reference, title..."
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <FlatList
        key={numColumns}
        data={filteredTransactions}
        keyExtractor={item => item.id}
        numColumns={numColumns}
        renderItem={renderTransactionItem}
        columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="receipt-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No transactions recorded</Text>
            <Text style={styles.emptySub}>No financial entries match current filter.</Text>
          </View>
        }
      />

      {/* Record New Transaction Modal */}
      <Modal visible={createModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 540, maxHeight: '88%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Record Ledger Entry</Text>
                <Text style={styles.modalSub}>Manual admin transaction adjustment</Text>
              </View>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.formLabel}>User ID (Student / Client)</Text>
              <TextInput
                style={styles.formInput}
                value={createUserId}
                onChangeText={setCreateUserId}
                placeholder="Target user ID or leave empty for platform"
              />

              <Text style={styles.formLabel}>Amount in INR (₹) *</Text>
              <TextInput
                style={styles.formInput}
                value={createAmount}
                onChangeText={setCreateAmount}
                keyboardType="numeric"
                placeholder="e.g. 2500 (or -500 for debit)"
              />

              <Text style={styles.formLabel}>Transaction Type</Text>
              <View style={styles.statusChipsRow}>
                {['EARNING', 'WITHDRAWAL', 'ESCROW_FUNDING', 'PLATFORM_FEE', 'REFUND'].map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.statusChip, createType === t && styles.statusChipActive]}
                    onPress={() => setCreateType(t)}
                  >
                    <Text style={[styles.statusChipText, createType === t && styles.statusChipTextActive]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.formLabel}>Payment Status</Text>
              <View style={styles.statusChipsRow}>
                {['COMPLETED', 'PENDING', 'REJECTED'].map(s => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.statusChip, createStatus === s && styles.statusChipActive]}
                    onPress={() => setCreateStatus(s)}
                  >
                    <Text style={[styles.statusChipText, createStatus === s && styles.statusChipTextActive]}>
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.formLabel}>Reference / Bank UTR Code</Text>
              <TextInput
                style={styles.formInput}
                value={createRef}
                onChangeText={setCreateRef}
                placeholder="e.g. UPI-123456789 / ADMIN-CREDIT"
              />

              <Text style={styles.formLabel}>Description / Audit Note</Text>
              <TextInput
                style={[styles.formInput, { height: 70, textAlignVertical: 'top' }]}
                value={createDesc}
                onChangeText={setCreateDesc}
                placeholder="Reason or invoice reference..."
                multiline
              />

              <View style={styles.editModalActions}>
                <TouchableOpacity 
                  style={styles.cancelBtn} 
                  onPress={() => setCreateModalVisible(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.saveBtn, creatingTx && { opacity: 0.7 }]} 
                  onPress={handleCreateTx}
                  disabled={creatingTx}
                >
                  {creatingTx ? (
                    <ActivityIndicator size="small" color={colors.textWhite} />
                  ) : (
                    <>
                      <Ionicons name="checkmark-done" size={16} color={colors.textWhite} />
                      <Text style={styles.saveBtnText}>Record Entry</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Transaction Modal */}
      <Modal visible={!!editingTx} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 540, maxHeight: '88%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Edit Transaction Record</Text>
                <Text style={styles.modalSub}>ID: {editingTx?.id}</Text>
              </View>
              <TouchableOpacity onPress={() => setEditingTx(null)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {editingTx ? (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <Text style={styles.formLabel}>Amount (₹) *</Text>
                <TextInput
                  style={styles.formInput}
                  value={editAmount}
                  onChangeText={setEditAmount}
                  keyboardType="numeric"
                />

                <Text style={styles.formLabel}>Transaction Type</Text>
                <View style={styles.statusChipsRow}>
                  {['EARNING', 'WITHDRAWAL', 'ESCROW_FUNDING', 'PLATFORM_FEE', 'REFUND'].map(t => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.statusChip, editType === t && styles.statusChipActive]}
                      onPress={() => setEditType(t)}
                    >
                      <Text style={[styles.statusChipText, editType === t && styles.statusChipTextActive]}>
                        {t}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.formLabel}>Payment Status</Text>
                <View style={styles.statusChipsRow}>
                  {['COMPLETED', 'PENDING', 'REJECTED'].map(s => (
                    <TouchableOpacity
                      key={s}
                      style={[styles.statusChip, editStatus === s && styles.statusChipActive]}
                      onPress={() => setEditStatus(s)}
                    >
                      <Text style={[styles.statusChipText, editStatus === s && styles.statusChipTextActive]}>
                        {s}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.formLabel}>Provider Reference</Text>
                <TextInput
                  style={styles.formInput}
                  value={editRef}
                  onChangeText={setEditRef}
                />

                <Text style={styles.formLabel}>Description</Text>
                <TextInput
                  style={[styles.formInput, { height: 70, textAlignVertical: 'top' }]}
                  value={editDesc}
                  onChangeText={setEditDesc}
                  multiline
                />

                <View style={styles.editModalActions}>
                  <TouchableOpacity 
                    style={styles.cancelBtn} 
                    onPress={() => setEditingTx(null)}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.saveBtn, savingTx && { opacity: 0.7 }]} 
                    onPress={handleSaveEditTx}
                    disabled={savingTx}
                  >
                    {savingTx ? (
                      <ActivityIndicator size="small" color={colors.textWhite} />
                    ) : (
                      <>
                        <Ionicons name="save-outline" size={16} color={colors.textWhite} />
                        <Text style={styles.saveBtnText}>Save Changes</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
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
    paddingVertical: 14,
    paddingBottom: 48,
  },
  topActionsRow: {
    maxWidth: 1600,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
  },
  infoWrap: {
    marginTop: 4,
  },
  desc: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  ref: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  amount: {
    fontSize: 15,
    fontWeight: '800',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  smallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 3,
    borderWidth: 1,
  },
  smallBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  btnSecondary: {
    backgroundColor: colors.surfaceSubtle,
    borderColor: colors.border,
  },
  btnDangerLight: {
    backgroundColor: colors.dangerLight,
    borderColor: colors.danger + '40',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 8,
    gap: 3,
    borderWidth: 1,
  },
  btnSuccess: {
    backgroundColor: colors.successLight,
    borderColor: colors.success + '40',
  },
  btnDanger: {
    backgroundColor: colors.dangerLight,
    borderColor: colors.danger + '40',
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
  topActionsRow: {
    maxWidth: 1400,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 4,
  },
  addTxBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  addTxBtnText: {
    color: colors.textWhite,
    fontSize: 13,
    fontWeight: '700',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 6,
    marginLeft: 'auto',
  },
  smallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
  },
  smallBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  btnSecondary: {
    backgroundColor: colors.surfaceSubtle,
    borderColor: colors.border,
  },
  btnDangerLight: {
    backgroundColor: colors.dangerLight,
    borderColor: colors.danger + '30',
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
    maxHeight: '85%',
    padding: 20,
    width: '100%',
    alignSelf: 'center',
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
  modalSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  modalBody: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
    marginTop: 10,
  },
  formInput: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.textPrimary,
  },
  statusChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  statusChip: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  statusChipText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  statusChipTextActive: {
    color: colors.primary,
  },
  editModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
    marginBottom: 10,
  },
  cancelBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSubtle,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.primary,
    gap: 6,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textWhite,
  },
});

