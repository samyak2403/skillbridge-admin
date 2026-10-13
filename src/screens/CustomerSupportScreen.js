import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert, 
  Modal, 
  TextInput,
  ScrollView,
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
  subscribeSupportTickets, 
  updateSupportTicketStatus, 
  replyToSupportTicket,
  createSupportTicketDoc,
  deleteSupportTicketDoc,
  handleTicketUserReactivate,
  subscribeUsers
} from '../services/adminService';

export default function CustomerSupportScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const numColumns = width >= 800 ? 4 : width >= 500 ? 2 : 1;

  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');

  // Reply / Detail Modal State
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState('IN_PROGRESS');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  const [reactivateModalVisible, setReactivateModalVisible] = useState(false);
  const [reactivateTargetTicket, setReactivateTargetTicket] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // New Ticket Modal State
  const [newTicketModal, setNewTicketModal] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState('Account & Login');
  const [newPriority, setNewPriority] = useState('NORMAL');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserId, setNewUserId] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newIsAppeal, setNewIsAppeal] = useState(false);
  const [creatingTicket, setCreatingTicket] = useState(false);

  useEffect(() => {
    const unsubTickets = subscribeSupportTickets(data => {
      setTickets(data);
      setLoading(false);
    });

    const unsubUsers = subscribeUsers(data => {
      setUsers(data);
    });

    return () => {
      if (unsubTickets) unsubTickets();
      if (unsubUsers) unsubUsers();
    };
  }, []);

  const tabs = ['ALL', 'OPEN', 'IN_PROGRESS', 'APPEALS', 'RESOLVED', 'CLOSED'];

  const quickTemplates = [
    { label: 'Reactivate Account', text: 'Your appeal has been reviewed and approved. Your SkillBridge account is now fully reactivated and restored to good standing.' },
    { label: 'Documents Needed', text: 'To proceed with verification or appeal review, please reply with a clear photo of your official college ID card.' },
    { label: 'Payment Solved', text: 'Your payout inquiry has been investigated. The funds have been released and should reflect within 24 hours.' },
    { label: 'Policy Reminder', text: 'Please ensure all marketplace communication and milestones follow the SkillBridge Student Safety Guidelines.' },
    { label: 'Ticket Resolved', text: 'We have resolved your issue. Please feel free to open a new inquiry if you need further assistance.' }
  ];

  // Helper to check if a ticket is related to account suspension
  const isSuspensionTicket = (t) => {
    if (t.isSuspensionAppeal) return true;
    const sub = (t.subject || '').toLowerCase();
    const msg = (t.message || '').toLowerCase();
    return sub.includes('suspend') || sub.includes('appeal') || sub.includes('banned') || sub.includes('blocked') || msg.includes('suspended');
  };

  // Find user data for ticket
  const getUserForTicket = (ticket) => {
    if (!ticket) return null;
    return users.find(u => (ticket.userId && u.id === ticket.userId) || (ticket.userEmail && u.email?.toLowerCase() === ticket.userEmail?.toLowerCase()));
  };

  // Filtered tickets
  const filteredTickets = tickets.filter(t => {
    const term = search.toLowerCase();
    const textMatch = 
      (t.subject || '').toLowerCase().includes(term) ||
      (t.userEmail || '').toLowerCase().includes(term) ||
      (t.userId || '').toLowerCase().includes(term) ||
      (t.userName || '').toLowerCase().includes(term) ||
      (t.message || '').toLowerCase().includes(term) ||
      (t.category || '').toLowerCase().includes(term);

    if (!textMatch) return false;

    if (activeTab === 'ALL') return true;
    if (activeTab === 'OPEN') return t.status === 'OPEN';
    if (activeTab === 'IN_PROGRESS') return t.status === 'IN_PROGRESS';
    if (activeTab === 'RESOLVED') return t.status === 'RESOLVED';
    if (activeTab === 'CLOSED') return t.status === 'CLOSED';
    if (activeTab === 'APPEALS') return isSuspensionTicket(t);

    return true;
  });

  // Calculate Metrics
  const totalCount = tickets.length;
  const openCount = tickets.filter(t => t.status === 'OPEN').length;
  const inProgressCount = tickets.filter(t => t.status === 'IN_PROGRESS').length;
  const appealCount = tickets.filter(t => isSuspensionTicket(t) && t.status !== 'RESOLVED' && t.status !== 'CLOSED').length;
  const resolvedCount = tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length;

  const handleOpenTicketDetails = (ticket) => {
    setSelectedTicket(ticket);
    setReplyText('');
    setReplyStatus(ticket.status === 'RESOLVED' ? 'RESOLVED' : 'IN_PROGRESS');
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) {
      showToast('Please enter a reply message for the user.', 'error');
      return;
    }
    setSubmittingReply(true);
    try {
      await replyToSupportTicket(selectedTicket.id, {
        replyMessage: replyText.trim(),
        newStatus: replyStatus,
        ticketData: selectedTicket
      });
      setSubmittingReply(false);
      setReplyText('');
      showToast('Response sent and user notified in mobile app.', 'success');
    } catch (err) {
      setSubmittingReply(false);
      showToast(err.message || 'Failed to send reply.', 'error');
    }
  };

  const handleQuickStatusChange = async (ticketId, nextStatus) => {
    try {
      await updateSupportTicketStatus(ticketId, nextStatus);
      showToast(`Ticket marked as ${nextStatus}.`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update ticket status.', 'error');
    }
  };

  const handleReactivateFromTicket = (ticket) => {
    if (!ticket) return;
    const user = getUserForTicket(ticket);
    const targetUserId = ticket.userId || user?.id || user?.uid;
    setReactivateTargetTicket({ ...ticket, resolvedUserId: targetUserId, resolvedUser: user });
    setReactivateModalVisible(true);
  };

  const handleConfirmReactivate = async () => {
    if (!reactivateTargetTicket) return;
    const ticket = reactivateTargetTicket;
    const user = getUserForTicket(ticket);
    const targetUserId = ticket.userId || user?.id || user?.uid || ticket.resolvedUserId;

    setReactivating(true);
    try {
      await handleTicketUserReactivate(
        ticket.id, 
        targetUserId, 
        'Account reinstated via customer support appeal review',
        ticket.userEmail
      );
      setReactivating(false);
      setReactivateModalVisible(false);

      if (selectedTicket && selectedTicket.id === ticket.id) {
        setSelectedTicket(prev => prev ? ({ ...prev, status: 'RESOLVED' }) : null);
      }
      setReactivateTargetTicket(null);
      showToast('User account successfully reactivated! Mobile access has been restored.', 'success');
    } catch (err) {
      console.error('Error reactivating user:', err);
      setReactivating(false);
      showToast(err.message || 'Failed to reactivate account.', 'error');
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    const ok = typeof window !== 'undefined' && window.confirm
      ? window.confirm('Are you sure you want to permanently delete this support ticket?')
      : true;
    if (!ok) return;

    try {
      await deleteSupportTicketDoc(ticketId);
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(null);
      }
      showToast('Support ticket removed.', 'info');
    } catch (err) {
      showToast(err.message || 'Failed to delete ticket.', 'error');
    }
  };

  const handleCreateTicketSubmit = async () => {
    if (!newSubject.trim() || !newMessage.trim()) {
      Alert.alert('Required', 'Please fill in both Subject and Message.');
      return;
    }
    setCreatingTicket(true);
    try {
      await createSupportTicketDoc({
        subject: newSubject.trim(),
        category: newCategory,
        priority: newPriority,
        userEmail: newUserEmail.trim(),
        userId: newUserId.trim(),
        message: newMessage.trim(),
        isSuspensionAppeal: newIsAppeal
      });
      setCreatingTicket(false);
      setNewTicketModal(false);
      setNewSubject('');
      setNewUserEmail('');
      setNewUserId('');
      setNewMessage('');
      setNewIsAppeal(false);
      Alert.alert('Success', 'New support ticket logged successfully.');
    } catch (err) {
      setCreatingTicket(false);
      Alert.alert('Error', err.message || 'Failed to create support ticket.');
    }
  };

  const renderTicketItem = ({ item }) => {
    const isAppeal = isSuspensionTicket(item);
    const user = getUserForTicket(item);
    const isUserSuspended = user?.isSuspended || user?.status === 'SUSPENDED';
    const replyCount = Array.isArray(item.replies) ? item.replies.length : 0;
    const formattedDate = item.createdAt 
      ? new Date(item.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      : 'Recent';

    return (
      <View style={[styles.cardWrapper, { width: `${100 / numColumns}%` }, numColumns === 1 && { marginBottom: 16 }]}>
        <View style={[styles.ticketCard, isAppeal && styles.ticketCardAppeal]}>
          <View style={styles.cardTop}>
            {/* Header row */}
            <View style={styles.cardHeader}>
              <View style={styles.headerLeft}>
                <View style={styles.ticketIdBadge}>
                  <Text style={styles.ticketIdText}>#{String(item.id || '').slice(-6).toUpperCase()}</Text>
                </View>
                <StatusBadge label={item.status || 'OPEN'} size="small" />
              </View>
              <Text style={styles.dateText}>{formattedDate}</Text>
            </View>

            {/* Badges row for appeals / urgent */}
            {(isAppeal || item.priority === 'URGENT') && (
              <View style={styles.badgesRow}>
                {isAppeal && (
                  <View style={styles.appealBadge}>
                    <Ionicons name="shield-outline" size={11} color={colors.danger} />
                    <Text style={styles.appealBadgeText}>APPEAL</Text>
                  </View>
                )}
                {item.priority === 'URGENT' && (
                  <View style={styles.urgentBadge}>
                    <Ionicons name="flame" size={11} color="#DC2626" />
                    <Text style={styles.urgentBadgeText}>URGENT</Text>
                  </View>
                )}
              </View>
            )}

            {/* Subject */}
            <Text style={styles.ticketSubject} numberOfLines={1}>{item.subject || 'Support Request'}</Text>

            {/* User metadata */}
            <View style={styles.userRow}>
              <Ionicons name="person-circle-outline" size={14} color={colors.primary} />
              <Text style={styles.userNameText} numberOfLines={1}>{item.userName || user?.fullName || 'User'}</Text>
              {isUserSuspended && (
                <View style={styles.suspendedTag}>
                  <Text style={styles.suspendedTagText}>SUSPENDED</Text>
                </View>
              )}
            </View>

            {/* Message preview */}
            <Text style={styles.messagePreview} numberOfLines={2}>
              {item.message || 'No description provided.'}
            </Text>

            {/* Latest reply snippet if available */}
            {replyCount > 0 && (
              <View style={styles.latestReplySnippet}>
                <Ionicons name="arrow-undo-outline" size={12} color={colors.primary} />
                <Text style={styles.latestReplyText} numberOfLines={1}>
                  Last: {item.replies[replyCount - 1]?.message}
                </Text>
              </View>
            )}
          </View>

          {/* Action Buttons Footer */}
          <View style={styles.cardBottom}>
            <View style={styles.footerInfo}>
              <Ionicons name="chatbubble-ellipses-outline" size={12} color={colors.textSecondary} />
              <Text style={styles.replyCountText}>{replyCount} {replyCount === 1 ? 'Reply' : 'Replies'}</Text>
              {item.category && (
                <>
                  <Text style={styles.bulletSeparator}>•</Text>
                  <Text style={styles.categoryTag} numberOfLines={1}>{item.category}</Text>
                </>
              )}
            </View>

            {isUserSuspended && (
              <TouchableOpacity 
                style={styles.reactivateQuickBtn} 
                onPress={() => handleReactivateFromTicket(item)}
              >
                <Ionicons name="checkmark-circle" size={13} color={colors.textWhite} />
                <Text style={styles.reactivateQuickBtnText}>Reactivate Account</Text>
              </TouchableOpacity>
            )}

            <View style={styles.footerActions}>
              <TouchableOpacity 
                style={styles.replyBtn} 
                onPress={() => handleOpenTicketDetails(item)}
              >
                <Ionicons name="chatbubbles" size={13} color={colors.textWhite} />
                <Text style={styles.replyBtnText} numberOfLines={1}>Reply & Manage</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.deleteIconBtn} 
                onPress={() => handleDeleteTicket(item.id)}
              >
                <Ionicons name="trash-outline" size={15} color={colors.danger} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Toast Feedback Alert */}
      {toast && (
        <View style={[styles.toastContainer, toast.type === 'error' ? styles.toastError : styles.toastSuccess]}>
          <Ionicons 
            name={toast.type === 'error' ? "alert-circle" : "checkmark-circle"} 
            size={18} 
            color={colors.textWhite} 
          />
          <Text style={styles.toastText}>{toast.message}</Text>
          <TouchableOpacity onPress={() => setToast(null)}>
            <Ionicons name="close" size={16} color={colors.textWhite} />
          </TouchableOpacity>
        </View>
      )}

      {/* 1. Header */}
      <AdminHeader 
        title="Customer Support Desk" 
        subtitle="Live Support Inquiries, Grievance Mediation & Suspension Appeals"
        rightAction={
          <TouchableOpacity 
            style={styles.newTicketBtn} 
            onPress={() => setNewTicketModal(true)}
          >
            <Ionicons name="add" size={18} color={colors.textWhite} />
            <Text style={styles.newTicketBtnText}>Log New Ticket</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {/* 2. Key Performance Indicators */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCol}>
            <StatCard 
              title="Total Tickets" 
              value={totalCount.toString()} 
              subtext="All customer cases" 
              icon="headset" 
              color={colors.primary} 
            />
          </View>
          <View style={styles.kpiCol}>
            <StatCard 
              title="Open Cases" 
              value={openCount.toString()} 
              subtext="Awaiting first review" 
              icon="alert-circle" 
              color={colors.warning} 
            />
          </View>
          <View style={styles.kpiCol}>
            <StatCard 
              title="Suspension Appeals" 
              value={appealCount.toString()} 
              subtext="Blocked user inquiries" 
              icon="shield-outline" 
              color={colors.danger} 
            />
          </View>
          <View style={styles.kpiCol}>
            <StatCard 
              title="Resolved" 
              value={resolvedCount.toString()} 
              subtext="Cases closed" 
              icon="checkmark-done" 
              color={colors.success} 
            />
          </View>
        </View>

        {/* 3. Search and Filter Bar */}
        <View style={styles.searchFilterCard}>
          <View style={styles.searchHeaderRow}>
            <View style={{ flex: 1 }}>
              <SearchBar 
                value={search} 
                onChangeText={setSearch} 
                placeholder="Search tickets by subject, user email, UID, message..." 
                onClear={() => setSearch('')}
              />
            </View>
            <TouchableOpacity 
              style={styles.newTicketBtn} 
              onPress={() => setNewTicketModal(true)}
            >
              <Ionicons name="add-circle-outline" size={18} color={colors.textWhite} />
              <Text style={styles.newTicketBtnText}>Log New Ticket</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tabsRow}>
            {tabs.map(tab => (
              <TouchableOpacity
                key={tab}
                style={[styles.tabChip, activeTab === tab && styles.tabChipActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabChipText, activeTab === tab && styles.tabChipTextActive]}>
                  {tab === 'APPEALS' ? '🛡️ APPEALS' : tab}
                </Text>
                {tab === 'OPEN' && openCount > 0 && (
                  <View style={styles.tabBadge}>
                    <Text style={styles.tabBadgeText}>{openCount}</Text>
                  </View>
                )}
                {tab === 'APPEALS' && appealCount > 0 && (
                  <View style={[styles.tabBadge, { backgroundColor: colors.danger }]}>
                    <Text style={styles.tabBadgeText}>{appealCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 4. Tickets List */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Syncing Support Desk Tickets...</Text>
          </View>
        ) : filteredTickets.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="chatbubbles-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No Support Tickets Found</Text>
            <Text style={styles.emptySubtitle}>
              {search ? 'Try adjusting your search query.' : 'There are no customer support tickets matching this tab filter.'}
            </Text>
          </View>
        ) : (
          <FlatList 
            key={numColumns}
            data={filteredTickets}
            keyExtractor={item => item.id}
            numColumns={numColumns}
            renderItem={renderTicketItem}
            columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
            scrollEnabled={false}
          />
        )}
      </ScrollView>

      {/* ======================================================== */}
      {/* 5. TICKET DETAIL & REPLY MODAL */}
      {/* ======================================================== */}
      <Modal
        visible={!!selectedTicket}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedTicket(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Manage Support Ticket</Text>
                <Text style={styles.modalSubtitle}>Ticket #{selectedTicket?.id}</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedTicket(null)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {/* Ticket Subject & Badges */}
              <View style={styles.modalSection}>
                <View style={styles.modalBadgeRow}>
                  <StatusBadge label={selectedTicket?.status || 'OPEN'} />
                  {isSuspensionTicket(selectedTicket || {}) && (
                    <View style={styles.appealBadge}>
                      <Ionicons name="shield-outline" size={12} color={colors.danger} />
                      <Text style={styles.appealBadgeText}>SUSPENSION APPEAL</Text>
                    </View>
                  )}
                  {selectedTicket?.category && (
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>{selectedTicket?.category}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.modalSubjectText}>{selectedTicket?.subject}</Text>
              </View>

              {/* User Information Card */}
              {(() => {
                const modalUser = getUserForTicket(selectedTicket);
                const isModalUserSuspended = modalUser?.isSuspended || modalUser?.status === 'SUSPENDED' || isSuspensionTicket(selectedTicket || {}) || selectedTicket?.isSuspensionAppeal;
                const isModalUserRestored = modalUser && !modalUser.isSuspended && modalUser.status === 'ACTIVE' && selectedTicket?.status === 'RESOLVED';

                return (
                  <View style={styles.userInfoCard}>
                    <View style={styles.userInfoTop}>
                      <Ionicons name="person-circle" size={32} color={colors.primary} />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.modalUserName}>{modalUser?.fullName || selectedTicket?.userName || 'Customer'}</Text>
                        <Text style={styles.modalUserEmail}>{selectedTicket?.userEmail || modalUser?.email || 'N/A'}</Text>
                        <Text style={styles.modalUserUid}>UID: {selectedTicket?.userId || modalUser?.id || 'N/A'}</Text>
                      </View>
                      {modalUser && (
                        <TouchableOpacity 
                          style={styles.viewProfileBtn}
                          onPress={() => {
                            const uId = modalUser.id;
                            setSelectedTicket(null);
                            navigation.navigate('UserDetail', { userId: uId });
                          }}
                        >
                          <Text style={styles.viewProfileBtnText}>View User</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Restored Banner */}
                    {isModalUserRestored && (
                      <View style={[styles.suspendedWarningBanner, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                          <View style={{ marginLeft: 8, flex: 1 }}>
                            <Text style={[styles.suspendedBannerTitle, { color: colors.success }]}>Account is Active & Restored</Text>
                            <Text style={[styles.suspendedBannerDesc, { color: '#047857' }]}>
                              User currently has full access to the SkillBridge mobile platform.
                            </Text>
                          </View>
                        </View>
                      </View>
                    )}

                    {/* Prominent Account Suspension Action Banner */}
                    {!isModalUserRestored && isModalUserSuspended && (
                      <View style={styles.suspendedWarningBanner}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                          <Ionicons name="warning" size={20} color={colors.danger} />
                          <View style={{ marginLeft: 8, flex: 1 }}>
                            <Text style={styles.suspendedBannerTitle}>Account is Currently Suspended</Text>
                            <Text style={styles.suspendedBannerDesc}>
                              This user is blocked on the mobile app until reactivated.
                            </Text>
                          </View>
                        </View>
                        <TouchableOpacity 
                          style={styles.reactivateModalBtn} 
                          onPress={() => handleReactivateFromTicket(selectedTicket)}
                          disabled={reactivating}
                        >
                          {reactivating ? (
                            <ActivityIndicator size="small" color={colors.textWhite} />
                          ) : (
                            <>
                              <Ionicons name="checkmark-circle-outline" size={16} color={colors.textWhite} />
                              <Text style={styles.reactivateModalBtnText}>Reactivate Account</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })()}

              {/* User Original Message */}
              <View style={styles.messageBox}>
                <View style={styles.messageBoxHeader}>
                  <Text style={styles.messageBoxTitle}>Original Inquiry Message</Text>
                  <Text style={styles.messageBoxDate}>
                    {selectedTicket?.createdAt ? new Date(selectedTicket.createdAt).toLocaleString('en-IN') : ''}
                  </Text>
                </View>
                <Text style={styles.messageBoxContent}>{selectedTicket?.message || 'No description provided.'}</Text>
              </View>

              {/* Thread / Replies History */}
              {Array.isArray(selectedTicket?.replies) && selectedTicket.replies.length > 0 && (
                <View style={styles.repliesHistorySection}>
                  <Text style={styles.repliesHistoryTitle}>Communication History</Text>
                  {selectedTicket.replies.map((rep, idx) => (
                    <View key={rep.id || idx} style={styles.replyItem}>
                      <View style={styles.replyItemHeader}>
                        <View style={styles.adminBadge}>
                          <Ionicons name="shield-checkmark" size={12} color={colors.primary} />
                          <Text style={styles.adminBadgeText}>{rep.authorName || 'Support Agent'}</Text>
                        </View>
                        <Text style={styles.replyDateText}>
                          {rep.createdAt ? new Date(rep.createdAt).toLocaleString('en-IN') : ''}
                        </Text>
                      </View>
                      <Text style={styles.replyItemBody}>{rep.message}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Quick Reply Templates */}
              <View style={styles.templatesSection}>
                <Text style={styles.templatesTitle}>Quick Reply Snippets:</Text>
                <View style={styles.templateChipsRow}>
                  {quickTemplates.map((item, idx) => (
                    <TouchableOpacity 
                      key={idx} 
                      style={styles.templateChip} 
                      onPress={() => setReplyText(item.text)}
                    >
                      <Text style={styles.templateChipText}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Reply Composer Input */}
              <View style={styles.replyComposerSection}>
                <Text style={styles.composerLabel}>Draft Support Response:</Text>
                <TextInput
                  style={styles.replyInput}
                  multiline
                  numberOfLines={4}
                  placeholder="Type an official customer service reply... (will be sent as push notification to user)"
                  placeholderTextColor={colors.textMuted}
                  value={replyText}
                  onChangeText={setReplyText}
                />

                {/* Status selector */}
                <View style={styles.statusSelectRow}>
                  <Text style={styles.statusSelectLabel}>Set Ticket Status After Reply:</Text>
                  <View style={styles.statusBtnGroup}>
                    {['IN_PROGRESS', 'RESOLVED', 'CLOSED'].map(st => (
                      <TouchableOpacity
                        key={st}
                        style={[styles.statusSelectBtn, replyStatus === st && styles.statusSelectBtnActive]}
                        onPress={() => setReplyStatus(st)}
                      >
                        <Text style={[styles.statusSelectBtnText, replyStatus === st && styles.statusSelectBtnTextActive]}>
                          {st}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* Modal Actions Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelModalBtn} 
                onPress={() => setSelectedTicket(null)}
              >
                <Text style={styles.cancelModalBtnText}>Close</Text>
              </TouchableOpacity>

              {(() => {
                const modalUser = getUserForTicket(selectedTicket);
                const isSusp = modalUser?.isSuspended || modalUser?.status === 'SUSPENDED' || isSuspensionTicket(selectedTicket || {}) || selectedTicket?.isSuspensionAppeal;
                const isNotResolved = selectedTicket?.status !== 'RESOLVED';
                if (isSusp && isNotResolved) {
                  return (
                    <TouchableOpacity
                      style={[styles.reactivateModalBtn, { marginRight: 8 }]}
                      onPress={() => handleReactivateFromTicket(selectedTicket)}
                      disabled={reactivating}
                    >
                      <Ionicons name="checkmark-circle-outline" size={16} color={colors.textWhite} />
                      <Text style={styles.reactivateModalBtnText}>Reactivate & Resolve</Text>
                    </TouchableOpacity>
                  );
                }
                return null;
              })()}

              <TouchableOpacity 
                style={styles.sendReplyBtn} 
                onPress={handleSendReply}
                disabled={submittingReply}
              >
                {submittingReply ? (
                  <ActivityIndicator size="small" color={colors.textWhite} />
                ) : (
                  <>
                    <Ionicons name="send" size={16} color={colors.textWhite} />
                    <Text style={styles.sendReplyBtnText}>Send Official Response</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* 5b. REACTIVATE ACCOUNT CONFIRMATION MODAL */}
      {/* ======================================================== */}
      <Modal
        visible={reactivateModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => !reactivating && setReactivateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxWidth: 480 }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Reactivate User Account</Text>
                  <Text style={styles.modalSubtitle}>Ticket #{reactivateTargetTicket?.id}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => !reactivating && setReactivateModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={{ padding: 20 }}>
              <Text style={{ fontSize: 14, color: colors.textPrimary, lineHeight: 22, marginBottom: 16 }}>
                Are you sure you want to reinstate access for <Text style={{ fontWeight: 'bold' }}>{reactivateTargetTicket?.userName || reactivateTargetTicket?.userEmail || 'this user'}</Text>?
              </Text>
              
              <View style={{ backgroundColor: colors.background, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: colors.border, marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <Ionicons name="person-outline" size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                    Name: <Text style={{ fontWeight: '700', color: colors.textPrimary }}>{reactivateTargetTicket?.userName || 'User'}</Text>
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <Ionicons name="mail-outline" size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                    Email: <Text style={{ fontWeight: '700', color: colors.textPrimary }}>{reactivateTargetTicket?.userEmail || 'N/A'}</Text>
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <Ionicons name="finger-print-outline" size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                    UID: <Text style={{ fontFamily: 'monospace', color: colors.textPrimary }}>{reactivateTargetTicket?.userId || reactivateTargetTicket?.resolvedUserId || 'Resolving from email...'}</Text>
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, paddingTop: 6, borderTopWidth: 1, borderTopColor: colors.border }}>
                  <Ionicons name="shield-checkmark-outline" size={14} color={colors.success} style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: 12, color: colors.success, fontWeight: '600' }}>
                    Status will become ACTIVE, suspension removed, and ticket resolved.
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
                <TouchableOpacity 
                  style={[styles.cancelModalBtn, { paddingHorizontal: 16 }]} 
                  onPress={() => setReactivateModalVisible(false)}
                  disabled={reactivating}
                >
                  <Text style={styles.cancelModalBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.reactivateModalBtn, { paddingHorizontal: 20 }]}
                  onPress={handleConfirmReactivate}
                  disabled={reactivating}
                >
                  {reactivating ? (
                    <ActivityIndicator size="small" color={colors.textWhite} />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle-outline" size={16} color={colors.textWhite} />
                      <Text style={styles.reactivateModalBtnText}>Confirm & Reactivate</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* 6. NEW TICKET MODAL */}
      {/* ======================================================== */}
      <Modal
        visible={newTicketModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setNewTicketModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log Support Ticket</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setNewTicketModal(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Subject / Issue Title *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. Account Suspension Appeal / Milestone Dispute"
                  placeholderTextColor={colors.textMuted}
                  value={newSubject}
                  onChangeText={setNewSubject}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Category</Text>
                <View style={styles.categoryChipsRow}>
                  {['Account & Login', 'Suspension Appeal', 'Payment & Escrow', 'Milestone Dispute', 'Verification', 'General'].map(cat => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.categorySelectChip, newCategory === cat && styles.categorySelectChipActive]}
                      onPress={() => {
                        setNewCategory(cat);
                        if (cat === 'Suspension Appeal') setNewIsAppeal(true);
                      }}
                    >
                      <Text style={[styles.categorySelectChipText, newCategory === cat && styles.categorySelectChipTextActive]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.formLabel}>Customer Email</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="user@student.edu"
                    placeholderTextColor={colors.textMuted}
                    value={newUserEmail}
                    onChangeText={setNewUserEmail}
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.formLabel}>User ID (UID)</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Firebase UID (optional)"
                    placeholderTextColor={colors.textMuted}
                    value={newUserId}
                    onChangeText={setNewUserId}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Priority</Text>
                <View style={styles.priorityRow}>
                  {['NORMAL', 'HIGH', 'URGENT'].map(p => (
                    <TouchableOpacity
                      key={p}
                      style={[styles.priorityChip, newPriority === p && styles.priorityChipActive]}
                      onPress={() => setNewPriority(p)}
                    >
                      <Text style={[styles.priorityChipText, newPriority === p && styles.priorityChipTextActive]}>
                        {p}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description / Message *</Text>
                <TextInput
                  style={[styles.formInput, { height: 110 }]}
                  multiline
                  placeholder="Detailed notes or transcript of the customer's issue..."
                  placeholderTextColor={colors.textMuted}
                  value={newMessage}
                  onChangeText={setNewMessage}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelModalBtn} 
                onPress={() => setNewTicketModal(false)}
              >
                <Text style={styles.cancelModalBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.sendReplyBtn} 
                onPress={handleCreateTicketSubmit}
                disabled={creatingTicket}
              >
                {creatingTicket ? (
                  <ActivityIndicator size="small" color={colors.textWhite} />
                ) : (
                  <>
                    <Ionicons name="checkmark-done" size={16} color={colors.textWhite} />
                    <Text style={styles.sendReplyBtnText}>Create Ticket</Text>
                  </>
                )}
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
  body: {
    flex: 1,
  },
  bodyContent: {
    maxWidth: 1600,
    width: '100%',
    alignSelf: 'center',
    padding: 20,
    paddingBottom: 40,
  },
  newTicketBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    gap: 6,
  },
  newTicketBtnText: {
    color: colors.textWhite,
    fontWeight: 'bold',
    fontSize: 13,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 16,
  },
  kpiCol: {
    flex: 1,
    minWidth: 160,
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  searchFilterCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  searchHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  tabsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  tabChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabChipTextActive: {
    color: colors.textWhite,
    fontWeight: 'bold',
  },
  tabBadge: {
    backgroundColor: colors.warning,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tabBadgeText: {
    color: colors.textWhite,
    fontSize: 10,
    fontWeight: 'bold',
  },
  loadingBox: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: colors.textSecondary,
    fontSize: 14,
  },
  emptyBox: {
    padding: 50,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
  },
  columnWrapper: {
    flexDirection: 'row',
    marginHorizontal: -8,
    marginBottom: 16,
  },
  cardWrapper: {
    paddingHorizontal: 8,
  },
  ticketCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    shadowColor: '#0F172A',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  ticketCardAppeal: {
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
    backgroundColor: '#FFFDFD',
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
    marginBottom: 6,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ticketIdBadge: {
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ticketIdText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  appealBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FECDD3',
    gap: 3,
  },
  appealBadgeText: {
    color: colors.danger,
    fontSize: 9,
    fontWeight: 'bold',
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  urgentBadgeText: {
    color: '#DC2626',
    fontSize: 9,
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 10,
    color: colors.textMuted,
  },
  ticketSubject: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  userNameText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  userEmailText: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  suspendedTag: {
    backgroundColor: colors.dangerLight,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  suspendedTagText: {
    fontSize: 9,
    color: colors.danger,
    fontWeight: 'bold',
  },
  messagePreview: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
    marginBottom: 8,
  },
  latestReplySnippet: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.infoLight,
    padding: 6,
    borderRadius: 6,
    gap: 4,
    marginBottom: 8,
  },
  latestReplyText: {
    fontSize: 11,
    color: colors.primary,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'column',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  replyCountText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  bulletSeparator: {
    fontSize: 11,
    color: colors.textMuted,
  },
  categoryTag: {
    fontSize: 10,
    color: colors.textSecondary,
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: '100%',
  },
  reactivateQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
    marginBottom: 4,
    width: '100%',
  },
  reactivateQuickBtnText: {
    color: colors.textWhite,
    fontSize: 11,
    fontWeight: '700',
  },
  replyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  replyBtnText: {
    color: colors.textWhite,
    fontSize: 11,
    fontWeight: '600',
  },
  deleteIconBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: colors.danger + '40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    width: '100%',
    maxWidth: 750,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  modalScroll: {
    padding: 18,
  },
  modalSection: {
    marginBottom: 16,
  },
  modalBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  modalSubjectText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  userInfoCard: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userInfoTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalUserName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  modalUserEmail: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  modalUserUid: {
    fontSize: 11,
    color: colors.textMuted,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  viewProfileBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  viewProfileBtnText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
  },
  suspendedWarningBanner: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: '#FECDD3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
  },
  suspendedBannerTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.danger,
  },
  suspendedBannerDesc: {
    fontSize: 11,
    color: colors.danger,
    marginTop: 2,
  },
  reactivateModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
    gap: 6,
  },
  reactivateModalBtnText: {
    color: colors.textWhite,
    fontSize: 12,
    fontWeight: 'bold',
  },
  messageBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  messageBoxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  messageBoxTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  messageBoxDate: {
    fontSize: 11,
    color: colors.textMuted,
  },
  messageBoxContent: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 21,
  },
  repliesHistorySection: {
    marginBottom: 16,
  },
  repliesHistoryTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  replyItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  replyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.infoLight,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  adminBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.primary,
  },
  replyDateText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  replyItemBody: {
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 19,
  },
  templatesSection: {
    marginBottom: 14,
  },
  templatesTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  templateChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  templateChip: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  templateChipText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
  },
  replyComposerSection: {
    marginBottom: 16,
  },
  composerLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  replyInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: 8,
    padding: 12,
    fontSize: 13,
    color: colors.textPrimary,
    minHeight: 90,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  statusSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusSelectLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  statusBtnGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  statusSelectBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusSelectBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusSelectBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  statusSelectBtnTextActive: {
    color: colors.textWhite,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surfaceSubtle,
    gap: 10,
  },
  cancelModalBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  cancelModalBtnText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  sendReplyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    gap: 6,
  },
  sendReplyBtnText: {
    color: colors.textWhite,
    fontWeight: 'bold',
    fontSize: 13,
  },
  formGroup: {
    marginBottom: 14,
  },
  formRow: {
    flexDirection: 'row',
  },
  formLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: colors.textPrimary,
  },
  categoryChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  categorySelectChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categorySelectChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categorySelectChipText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  categorySelectChipTextActive: {
    color: colors.textWhite,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  priorityChipActive: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  priorityChipText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  priorityChipTextActive: {
    color: colors.textWhite,
  },
  toastContainer: {
    position: 'absolute',
    top: 24,
    right: 24,
    zIndex: 99999,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 10,
    gap: 10,
    maxWidth: 460,
  },
  toastSuccess: {
    backgroundColor: '#059669',
  },
  toastError: {
    backgroundColor: '#DC2626',
  },
  toastText: {
    color: colors.textWhite,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
});
