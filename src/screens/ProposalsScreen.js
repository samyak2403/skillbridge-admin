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
import StatCard from '../components/StatCard';
import { 
  subscribeProposals, 
  updateProposalStatus, 
  updateProposalDoc,
  deleteProposalDoc 
} from '../services/adminService';

export default function ProposalsScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const numColumns = width >= 800 ? 4 : width >= 500 ? 2 : 1;

  const [proposals, setProposals] = useState([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');
  const [selectedProposal, setSelectedProposal] = useState(null);

  // Proposal edit state
  const [editingProposal, setEditingProposal] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  const [editDays, setEditDays] = useState('');
  const [editCover, setEditCover] = useState('');
  const [editStatus, setEditStatus] = useState('PENDING');
  const [editSkills, setEditSkills] = useState('');
  const [savingProposal, setSavingProposal] = useState(false);

  useEffect(() => {
    const unsub = subscribeProposals(data => setProposals(data));
    return () => { if (unsub) unsub(); };
  }, []);

  const tabs = ['ALL', 'PENDING', 'SHORTLISTED', 'ACCEPTED', 'REJECTED'];

  const filteredProposals = proposals.filter(p => {
    const textMatch = 
      (p.projectTitle || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.freelancerName || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.coverLetter || '').toLowerCase().includes(search.toLowerCase()) ||
      (Array.isArray(p.relevantSkills) && p.relevantSkills.some(s => s.toLowerCase().includes(search.toLowerCase())));
    
    if (!textMatch) return false;
    if (activeTab === 'ALL') return true;
    return (p.status || 'PENDING') === activeTab;
  });

  // Proposal Stats
  const totalCount = proposals.length;
  const pendingCount = proposals.filter(p => (p.status || 'PENDING') === 'PENDING').length;
  const acceptedCount = proposals.filter(p => p.status === 'ACCEPTED').length;
  const totalBidValue = proposals.reduce((acc, p) => acc + (parseFloat(p.proposedPrice) || 0), 0);

  const handleUpdateStatus = (proposal, nextStatus) => {
    Alert.alert(
      'Update Proposal Status',
      `Change proposal status for ${proposal.freelancerName || 'Student'} to ${nextStatus}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await updateProposalStatus(proposal.id, nextStatus);
              if (selectedProposal?.id === proposal.id) {
                setSelectedProposal(prev => prev ? { ...prev, status: nextStatus } : null);
              }
              Alert.alert('Status Updated', `Proposal is now marked as ${nextStatus}.`);
            } catch (err) {
              Alert.alert('Error', err.message);
            }
          }
        }
      ]
    );
  };

  const handleDeleteProposal = (proposal) => {
    Alert.alert(
      'Remove Proposal',
      `Permanently remove this proposal from project "${proposal.projectTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProposalDoc(proposal.id);
              if (selectedProposal?.id === proposal.id) setSelectedProposal(null);
              Alert.alert('Deleted', 'Proposal has been deleted.');
            } catch (err) {
              Alert.alert('Error', err.message);
            }
          }
        }
      ]
    );
  };

  const handleOpenEdit = (proposal) => {
    setEditingProposal(proposal);
    setEditPrice(String(proposal.proposedPrice ?? '0'));
    setEditDays(String(proposal.deliveryDays ?? '7'));
    setEditCover(proposal.coverLetter ?? '');
    setEditStatus(proposal.status ?? 'PENDING');
    setEditSkills(Array.isArray(proposal.relevantSkills) ? proposal.relevantSkills.join(', ') : '');
  };

  const handleSaveEdit = async () => {
    if (!editPrice || isNaN(parseFloat(editPrice))) {
      Alert.alert('Required', 'Please enter a valid bid amount.');
      return;
    }
    setSavingProposal(true);
    try {
      const skillsArray = editSkills.split(',').map(s => s.trim()).filter(Boolean);
      await updateProposalDoc(editingProposal.id, {
        proposedPrice: parseFloat(editPrice) || 0,
        deliveryDays: parseInt(editDays, 10) || 7,
        coverLetter: editCover.trim(),
        status: editStatus,
        relevantSkills: skillsArray
      });
      if (selectedProposal?.id === editingProposal.id) {
        setSelectedProposal(prev => prev ? {
          ...prev,
          proposedPrice: parseFloat(editPrice) || 0,
          deliveryDays: parseInt(editDays, 10) || 7,
          coverLetter: editCover.trim(),
          status: editStatus,
          relevantSkills: skillsArray
        } : null);
      }
      setSavingProposal(false);
      setEditingProposal(null);
      Alert.alert('Success', 'Proposal terms updated successfully.');
    } catch (err) {
      setSavingProposal(false);
      Alert.alert('Error', err.message);
    }
  };

  const renderProposalItem = ({ item }) => (
    <View style={[styles.cardWrapper, { width: `${100 / numColumns}%` }, numColumns === 1 && { marginBottom: 16 }]}>
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.cardHeader}>
            <View style={styles.titleWrap}>
              <Text style={styles.projectTitle} numberOfLines={1}>
                {item.projectTitle || 'Untitled Project'}
              </Text>
              <View style={styles.freelancerRow}>
                <View style={styles.avatarMini}>
                  <Text style={styles.avatarMiniText}>
                    {(item.freelancerName || 'S').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.freelancerName} numberOfLines={1}>
                  {item.freelancerName || 'Student Applicant'}
                </Text>
              </View>
            </View>
            <StatusBadge label={item.status || 'PENDING'} size="small" />
          </View>

          <Text style={styles.coverLetter} numberOfLines={2}>
            {item.coverLetter || 'No cover letter provided.'}
          </Text>

          {/* Relevant Skills */}
          {Array.isArray(item.relevantSkills) && item.relevantSkills.length > 0 ? (
            <View style={styles.skillsRow}>
              {item.relevantSkills.slice(0, 2).map((skill, idx) => (
                <View key={idx} style={styles.skillPill}>
                  <Text style={styles.skillText} numberOfLines={1}>{skill}</Text>
                </View>
              ))}
              {item.relevantSkills.length > 2 ? (
                <Text style={styles.moreSkillsText}>+{item.relevantSkills.length - 2}</Text>
              ) : null}
            </View>
          ) : null}
        </View>

        <View style={styles.cardBottom}>
          <View style={styles.metaRow}>
            <View style={styles.metaBadge}>
              <Ionicons name="cash-outline" size={13} color={colors.success} />
              <Text style={styles.metaPrice}>₹{item.proposedPrice || 0}</Text>
            </View>
            <View style={styles.metaBadge}>
              <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
              <Text style={styles.metaText}>{item.deliveryDays || 7}d</Text>
            </View>
            <Text style={styles.dateMeta} numberOfLines={1}>
              {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent'}
            </Text>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity 
              style={[styles.btn, styles.btnInfo, { flex: 1 }]}
              onPress={() => setSelectedProposal(item)}
            >
              <Ionicons name="eye-outline" size={12} color={colors.info} />
              <Text style={[styles.btnText, { color: colors.info }]} numberOfLines={1}>View</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.btn, styles.btnSecondary, { flex: 1 }]}
              onPress={() => handleOpenEdit(item)}
            >
              <Ionicons name="create-outline" size={12} color={colors.primary} />
              <Text style={[styles.btnText, { color: colors.primary }]} numberOfLines={1}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.actionsRow, { marginTop: 4 }]}>
            {item.status !== 'ACCEPTED' ? (
              <TouchableOpacity 
                style={[styles.btn, styles.btnSuccess, { flex: 1 }]}
                onPress={() => handleUpdateStatus(item, 'ACCEPTED')}
              >
                <Ionicons name="checkmark-circle-outline" size={12} color={colors.success} />
                <Text style={[styles.btnText, { color: colors.success }]} numberOfLines={1}>Accept</Text>
              </TouchableOpacity>
            ) : null}

            {item.status !== 'SHORTLISTED' && item.status !== 'ACCEPTED' ? (
              <TouchableOpacity 
                style={[styles.btn, styles.btnPurple, { flex: 1 }]}
                onPress={() => handleUpdateStatus(item, 'SHORTLISTED')}
              >
                <Ionicons name="star-outline" size={12} color={colors.purple} />
                <Text style={[styles.btnText, { color: colors.purple }]} numberOfLines={1}>Star</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity 
              style={[styles.btn, styles.btnDanger]}
              onPress={() => handleDeleteProposal(item)}
            >
              <Ionicons name="trash-outline" size={12} color={colors.danger} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <AdminHeader 
        title="Proposals & Bids" 
        subtitle={`${filteredProposals.length} Applications Monitored`} 
      />

      <View style={styles.scrollHeader}>
        <View style={styles.kpiRow}>
          <StatCard
            title="Total Proposals"
            value={totalCount.toString()}
            subtext="All Time Submissions"
            icon="paper-plane"
            color={colors.primary}
          />
          <StatCard
            title="Pending Review"
            value={pendingCount.toString()}
            subtext="Awaiting Action"
            icon="hourglass-outline"
            color={colors.warning}
          />
          <StatCard
            title="Accepted Contracts"
            value={acceptedCount.toString()}
            subtext="Converted to Work"
            icon="checkmark-done"
            color={colors.success}
          />
          <StatCard
            title="Total Bid Value"
            value={`₹${totalBidValue.toLocaleString()}`}
            subtext="Campus Volume"
            icon="wallet"
            color={colors.purple}
          />
        </View>
      </View>

      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder="Search proposals by student, project, skill..."
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <FlatList
        key={numColumns}
        data={filteredProposals}
        keyExtractor={item => item.id || item.proposalId}
        numColumns={numColumns}
        renderItem={renderProposalItem}
        columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="document-text-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No proposals found</Text>
            <Text style={styles.emptySub}>No submitted bids match the selected filters.</Text>
          </View>
        }
      />

      {/* Deep Inspection Modal */}
      <Modal visible={!!selectedProposal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Proposal Details</Text>
                <Text style={styles.modalSub}>
                  ID: {selectedProposal?.id || selectedProposal?.proposalId}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedProposal(null)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedProposal ? (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.modalPillRow}>
                  <StatusBadge label={selectedProposal.status || 'PENDING'} />
                  <Text style={styles.modalPrice}>
                    ₹{selectedProposal.proposedPrice || 0} INR
                  </Text>
                </View>

                <View style={styles.infoCard}>
                  <Text style={styles.infoTitle}>Target Project</Text>
                  <Text style={styles.infoProjectTitle}>{selectedProposal.projectTitle}</Text>
                  {selectedProposal.projectId ? (
                    <TouchableOpacity 
                      style={styles.linkRow}
                      onPress={() => {
                        const pId = selectedProposal.projectId;
                        setSelectedProposal(null);
                        navigation?.navigate('ProjectDetail', { projectId: pId });
                      }}
                    >
                      <Ionicons name="open-outline" size={14} color={colors.primary} />
                      <Text style={styles.linkText}>View Full Project Page</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                <View style={styles.infoCard}>
                  <Text style={styles.infoTitle}>Student Freelancer</Text>
                  <Text style={styles.infoVal}>{selectedProposal.freelancerName || 'Student'}</Text>
                  <Text style={styles.infoSubText}>Freelancer ID: {selectedProposal.freelancerId}</Text>
                  {selectedProposal.freelancerId ? (
                    <TouchableOpacity 
                      style={styles.linkRow}
                      onPress={() => {
                        const fId = selectedProposal.freelancerId;
                        setSelectedProposal(null);
                        navigation?.navigate('UserDetail', { userId: fId });
                      }}
                    >
                      <Ionicons name="person-outline" size={14} color={colors.primary} />
                      <Text style={styles.linkText}>Inspect Student Profile</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                <View style={styles.infoCard}>
                  <Text style={styles.infoTitle}>Bid Terms & Schedule</Text>
                  <View style={styles.termRow}>
                    <Text style={styles.termLabel}>Proposed Compensation:</Text>
                    <Text style={styles.termVal}>₹{selectedProposal.proposedPrice || 0}</Text>
                  </View>
                  <View style={styles.termRow}>
                    <Text style={styles.termLabel}>Delivery Timeline:</Text>
                    <Text style={styles.termVal}>{selectedProposal.deliveryDays || 7} Days</Text>
                  </View>
                </View>

                <View style={styles.infoCard}>
                  <Text style={styles.infoTitle}>Cover Letter / Pitch</Text>
                  <Text style={styles.coverLetterFull}>
                    {selectedProposal.coverLetter || 'No cover letter provided.'}
                  </Text>
                </View>

                {Array.isArray(selectedProposal.relevantSkills) && selectedProposal.relevantSkills.length > 0 ? (
                  <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>Highlighted Skills</Text>
                    <View style={styles.skillsRowWrap}>
                      {selectedProposal.relevantSkills.map((sk, idx) => (
                        <View key={idx} style={styles.skillPill}>
                          <Text style={styles.skillText}>{sk}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}

                {/* Modal Admin Status Actions */}
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalActionBtn, { backgroundColor: colors.primary }]}
                    onPress={() => {
                      const prop = selectedProposal;
                      setSelectedProposal(null);
                      handleOpenEdit(prop);
                    }}
                  >
                    <Ionicons name="create-outline" size={18} color={colors.textWhite} />
                    <Text style={styles.modalActionText}>Edit Terms</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalActionBtn, { backgroundColor: colors.success }]}
                    onPress={() => handleUpdateStatus(selectedProposal, 'ACCEPTED')}
                  >
                    <Ionicons name="checkmark-circle" size={18} color={colors.textWhite} />
                    <Text style={styles.modalActionText}>Accept Bid</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalActionBtn, { backgroundColor: colors.purple }]}
                    onPress={() => handleUpdateStatus(selectedProposal, 'SHORTLISTED')}
                  >
                    <Ionicons name="star" size={18} color={colors.textWhite} />
                    <Text style={styles.modalActionText}>Shortlist</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalActionBtn, { backgroundColor: colors.danger }]}
                    onPress={() => handleUpdateStatus(selectedProposal, 'REJECTED')}
                  >
                    <Ionicons name="close-circle" size={18} color={colors.textWhite} />
                    <Text style={styles.modalActionText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* Full Control: Edit Proposal Modal */}
      <Modal visible={!!editingProposal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 540, maxHeight: '88%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Edit Proposal Terms</Text>
                <Text style={styles.modalSub}>
                  ID: {editingProposal?.id} • {editingProposal?.freelancerName}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setEditingProposal(null)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {editingProposal ? (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.formRow}>
                  <View style={styles.formCol}>
                    <Text style={styles.formLabel}>Proposed Price (₹) *</Text>
                    <TextInput
                      style={styles.formInput}
                      value={editPrice}
                      onChangeText={setEditPrice}
                      keyboardType="numeric"
                      placeholder="e.g. 3500"
                    />
                  </View>
                  <View style={styles.formCol}>
                    <Text style={styles.formLabel}>Delivery Days *</Text>
                    <TextInput
                      style={styles.formInput}
                      value={editDays}
                      onChangeText={setEditDays}
                      keyboardType="numeric"
                      placeholder="e.g. 7"
                    />
                  </View>
                </View>

                <Text style={styles.formLabel}>Proposal Status</Text>
                <View style={styles.statusChipsRow}>
                  {['PENDING', 'SHORTLISTED', 'ACCEPTED', 'REJECTED'].map(st => (
                    <TouchableOpacity
                      key={st}
                      style={[styles.statusChip, editStatus === st && styles.statusChipActive]}
                      onPress={() => setEditStatus(st)}
                    >
                      <Text style={[styles.statusChipText, editStatus === st && styles.statusChipTextActive]}>
                        {st}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.formLabel}>Highlighted Skills (comma-separated)</Text>
                <TextInput
                  style={styles.formInput}
                  value={editSkills}
                  onChangeText={setEditSkills}
                  placeholder="e.g. Kotlin, Jetpack Compose, Coroutines"
                />

                <Text style={styles.formLabel}>Cover Letter & Value Proposition</Text>
                <TextInput
                  style={[styles.formInput, { height: 100, textAlignVertical: 'top' }]}
                  value={editCover}
                  onChangeText={setEditCover}
                  placeholder="Student's application pitch and deliverables plan..."
                  multiline
                />

                <View style={styles.editModalActions}>
                  <TouchableOpacity 
                    style={styles.cancelBtn} 
                    onPress={() => setEditingProposal(null)}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.saveBtn, savingProposal && { opacity: 0.7 }]} 
                    onPress={handleSaveEdit}
                    disabled={savingProposal}
                  >
                    {savingProposal ? (
                      <ActivityIndicator size="small" color={colors.textWhite} />
                    ) : (
                      <>
                        <Ionicons name="save-outline" size={16} color={colors.textWhite} />
                        <Text style={styles.saveBtnText}>Save Proposal</Text>
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
  scrollHeader: {
    maxWidth: 1400,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    marginBottom: 8,
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
    shadowOffset: { width: 0, height: 2 },
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
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleWrap: {
    flex: 1,
    marginRight: 10,
  },
  projectTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  freelancerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  avatarMini: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarMiniText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  freelancerName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  coverLetter: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
    marginBottom: 8,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
    alignItems: 'center',
  },
  skillsRowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  skillPill: {
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  skillText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  moreSkillsText: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceSubtle,
    marginBottom: 8,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.success,
  },
  metaText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  dateMeta: {
    marginLeft: 'auto',
    fontSize: 10,
    color: colors.textMuted,
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
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  btnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  btnInfo: {
    borderColor: colors.info + '50',
    backgroundColor: colors.info + '10',
  },
  btnSuccess: {
    borderColor: colors.success + '50',
    backgroundColor: colors.success + '10',
  },
  btnPurple: {
    borderColor: colors.purple + '50',
    backgroundColor: colors.purple + '10',
  },
  btnDanger: {
    borderColor: colors.danger + '40',
    backgroundColor: colors.danger + '10',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 620,
    backgroundColor: colors.surface,
    borderRadius: 16,
    maxHeight: '90%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modalSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  modalBody: {
    padding: 20,
  },
  modalPillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.success,
  },
  infoCard: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoProjectTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  infoVal: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  infoSubText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  linkText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  termRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  termLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  termVal: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  coverLetterFull: {
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    marginBottom: 20,
  },
  modalActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  modalActionText: {
    color: colors.textWhite,
    fontSize: 13,
    fontWeight: '700',
  },
  btnSecondary: {
    backgroundColor: colors.surfaceSubtle,
    borderColor: colors.border,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formCol: {
    flex: 1,
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

