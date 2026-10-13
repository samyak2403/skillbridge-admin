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
  ActivityIndicator,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import StatusBadge from '../components/StatusBadge';
import { 
  subscribeProjectById, 
  updateProjectStatus, 
  deleteProjectDoc,
  updateProjectDoc,
  subscribeProposalsByProject,
  subscribeAssignments,
  sendNotificationToUser,
  updateProposalStatus,
  releaseMilestonePayment
} from '../services/adminService';

const BANNER_PRESETS = [
  { label: '💻 Mobile App', url: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=1200&q=80' },
  { label: '🌐 Web Dev', url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&q=80' },
  { label: '🎨 UI/UX Design', url: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=1200&q=80' },
  { label: '🤖 AI & Data', url: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=1200&q=80' },
  { label: '🚀 Startup Team', url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&q=80' },
  { label: '📊 Cloud & Backend', url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&q=80' },
];

export default function ProjectDetailScreen({ navigation, route }) {
  const initialProject = route?.params?.project || null;
  const projectId = route?.params?.projectId || initialProject?.id || initialProject?.projectId;

  const [project, setProject] = useState(initialProject);
  const [loading, setLoading] = useState(!initialProject);
  const [activeTab, setActiveTab] = useState('OVERVIEW'); // 'OVERVIEW', 'PROPOSALS', 'CONTRACT', 'MODERATION'

  const [proposals, setProposals] = useState([]);
  const [assignment, setAssignment] = useState(null);

  // Client notification modal
  const [notifyModalVisible, setNotifyModalVisible] = useState(false);
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');
  const [sendingNotif, setSendingNotif] = useState(false);

  // Edit project state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCategory, setEditCategory] = useState('Mobile Development');
  const [editMinBudget, setEditMinBudget] = useState('0');
  const [editMaxBudget, setEditMaxBudget] = useState('0');
  const [editDuration, setEditDuration] = useState('');
  const [editSkills, setEditSkills] = useState('');
  const [editBannerUrl, setEditBannerUrl] = useState('');
  const [editStatus, setEditStatus] = useState('OPEN');
  const [savingProject, setSavingProject] = useState(false);

  // Subscribe to live project document
  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    const unsubProject = subscribeProjectById(projectId, (liveData) => {
      if (liveData) {
        setProject(liveData);
      }
      setLoading(false);
    }, (err) => {
      console.warn('Live project doc subscription warning:', err);
      setLoading(false);
    });

    const unsubProposals = subscribeProposalsByProject(projectId, (liveProposals) => {
      setProposals(liveProposals);
    });

    const unsubAssignments = subscribeAssignments((allAssignments) => {
      const match = allAssignments.find(a => a.projectId === projectId);
      setAssignment(match || null);
    });

    return () => {
      if (unsubProject) unsubProject();
      if (unsubProposals) unsubProposals();
      if (unsubAssignments) unsubAssignments();
    };
  }, [projectId]);

  const handleUpdateStatus = (newStatus) => {
    Alert.alert(
      'Change Project Status',
      `Change project status to ${newStatus}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async () => {
            try {
              await updateProjectStatus(projectId, newStatus);
              setProject(prev => prev ? { ...prev, status: newStatus } : null);
              Alert.alert('Updated', `Project status changed to ${newStatus}.`);
            } catch (err) {
              Alert.alert('Error', err.message);
            }
          }
        }
      ]
    );
  };

  const handleDeleteProject = () => {
    Alert.alert(
      'Delete Project Listing',
      `Permanently delete "${project?.title}" and remove it from the student feed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProjectDoc(projectId);
              Alert.alert('Deleted', 'Project removed from marketplace.');
              navigation?.goBack();
            } catch (err) {
              Alert.alert('Error', err.message);
            }
          }
        }
      ]
    );
  };

  const handleSendNotification = async () => {
    if (!notifTitle.trim() || !notifBody.trim()) {
      Alert.alert('Validation Error', 'Please enter both a title and message body.');
      return;
    }
    if (!project?.clientId) {
      Alert.alert('Error', 'Client ID not found on this project.');
      return;
    }

    setSendingNotif(true);
    try {
      await sendNotificationToUser({
        userId: project.clientId,
        title: notifTitle,
        body: notifBody,
        type: 'PROJECT'
      });
      setSendingNotif(false);
      setNotifyModalVisible(false);
      setNotifTitle('');
      setNotifBody('');
      Alert.alert('Sent', 'Message sent to client successfully.');
    } catch (err) {
      setSendingNotif(false);
      Alert.alert('Error', err.message);
    }
  };

  const handleOpenEdit = () => {
    setEditTitle(project?.title || '');
    setEditDesc(project?.description || '');
    setEditCategory(project?.category || 'Mobile Development');
    setEditMinBudget(String(project?.minimumBudget ?? 0));
    setEditMaxBudget(String(project?.maximumBudget ?? 0));
    setEditDuration(project?.estimatedDuration || '');
    setEditSkills(Array.isArray(project?.requiredSkills) ? project.requiredSkills.join(', ') : '');
    setEditBannerUrl(project?.bannerUrl || '');
    setEditStatus(project?.status || 'OPEN');
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) {
      Alert.alert('Required', 'Project title is required.');
      return;
    }
    setSavingProject(true);
    try {
      const skillsArray = editSkills.split(',').map(s => s.trim()).filter(Boolean);
      await updateProjectDoc(projectId, {
        title: editTitle.trim(),
        description: editDesc.trim(),
        category: editCategory,
        minimumBudget: parseFloat(editMinBudget) || 0,
        maximumBudget: parseFloat(editMaxBudget) || 0,
        estimatedDuration: editDuration.trim(),
        requiredSkills: skillsArray,
        bannerUrl: editBannerUrl.trim(),
        status: editStatus
      });
      setProject(prev => prev ? {
        ...prev,
        title: editTitle.trim(),
        description: editDesc.trim(),
        category: editCategory,
        minimumBudget: parseFloat(editMinBudget) || 0,
        maximumBudget: parseFloat(editMaxBudget) || 0,
        estimatedDuration: editDuration.trim(),
        requiredSkills: skillsArray,
        bannerUrl: editBannerUrl.trim(),
        status: editStatus
      } : null);
      setSavingProject(false);
      setEditModalVisible(false);
      Alert.alert('Success', 'Project updated successfully.');
    } catch (err) {
      setSavingProject(false);
      Alert.alert('Error', err.message);
    }
  };

  const handleReleaseEscrow = async (asgn) => {
    Alert.alert(
      'Release Escrow Funds',
      `Release ₹${asgn.agreedBudget || 0} INR to freelancer ${asgn.freelancerName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Release Payment',
          onPress: async () => {
            try {
              await releaseMilestonePayment({
                assignmentId: asgn.id || asgn.assignmentId,
                milestoneId: 'admin_project_rel',
                amount: asgn.agreedBudget || 0,
                freelancerId: asgn.freelancerId,
                projectId: asgn.projectId,
                projectTitle: asgn.projectTitle
              });
              Alert.alert('Payment Released', 'Escrow funds credited to freelancer.');
            } catch (err) {
              Alert.alert('Error', err.message);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading Project Details...</Text>
      </View>
    );
  }

  if (!project) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
        <Text style={styles.notFoundTitle}>Project Not Found</Text>
        <TouchableOpacity style={styles.backBtnPill} onPress={() => navigation?.goBack()}>
          <Ionicons name="arrow-back" size={16} color={colors.textWhite} />
          <Text style={styles.backBtnPillText}>Back to Projects</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 1. Header with Breadcrumb and Back */}
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation?.goBack()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {project.title || 'Project Details'}
              </Text>
              <Text style={styles.headerSubtitle}>
                Project ID: {project.id || projectId}
              </Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.headerEditBtn}
              onPress={handleOpenEdit}
            >
              <Ionicons name="create-outline" size={15} color={colors.primary} />
              <Text style={styles.headerEditBtnText}>Edit</Text>
            </TouchableOpacity>
            <StatusBadge label={project.status || 'OPEN'} />
          </View>
        </View>
      </View>

      {/* 2. Sub-Nav Tabs */}
      <View style={styles.tabBar}>
        <View style={styles.tabBarInner}>
          {[
            { key: 'OVERVIEW', label: 'Overview', icon: 'document-text-outline' },
            { key: 'PROPOSALS', label: `Proposals (${proposals.length})`, icon: 'paper-plane-outline' },
            { key: 'CONTRACT', label: assignment ? 'Contract (Active)' : 'Contract', icon: 'shield-checkmark-outline' },
            { key: 'MODERATION', label: 'Admin Actions', icon: 'settings-outline' }
          ].map(t => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tabItem, activeTab === t.key && styles.tabItemActive]}
              onPress={() => setActiveTab(t.key)}
            >
              <Ionicons 
                name={t.icon} 
                size={16} 
                color={activeTab === t.key ? colors.primary : colors.textSecondary} 
              />
              <Text style={[styles.tabLabel, activeTab === t.key && styles.tabLabelActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 3. Main Tab Contents */}
      <ScrollView contentContainerStyle={styles.contentWrap} showsVerticalScrollIndicator={false}>
        {activeTab === 'OVERVIEW' && (
          <View style={styles.sectionWrap}>
            {/* Project Hero Banner */}
            {project.bannerUrl ? (
              <View style={styles.detailHeroBannerWrap}>
                <Image 
                  source={{ uri: project.bannerUrl }} 
                  style={styles.detailHeroBannerImage} 
                  resizeMode="cover"
                />
                <View style={styles.detailBannerOverlay}>
                  <View style={styles.bannerTagWrap}>
                    <Ionicons name="sparkles" size={13} color="#fff" />
                    <Text style={styles.bannerTagText}>Project Cover Banner</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.changeBannerBtn}
                    onPress={handleOpenEdit}
                  >
                    <Ionicons name="create-outline" size={14} color="#fff" />
                    <Text style={styles.changeBannerBtnText}>Change Banner</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.noBannerPrompt}>
                <View style={styles.noBannerLeft}>
                  <View style={styles.noBannerIconWrap}>
                    <Ionicons name="image-outline" size={22} color={colors.primary} />
                  </View>
                  <View style={styles.noBannerTextWrap}>
                    <Text style={styles.noBannerTitle}>No Cover Banner Attached</Text>
                    <Text style={styles.noBannerSub}>Add a visual cover image to enhance this job listing in student search feeds.</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.addBannerBtn}
                  onPress={handleOpenEdit}
                >
                  <Ionicons name="add" size={16} color={colors.primary} />
                  <Text style={styles.addBannerBtnText}>Add Banner</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* KPI Cards Row */}
            <View style={styles.overviewGrid}>
              <View style={styles.kpiCard}>
                <Ionicons name="cash-outline" size={20} color={colors.success} />
                <Text style={styles.kpiLabel}>Budget Range</Text>
                <Text style={styles.kpiValue}>
                  ₹{project.minimumBudget || 0} - ₹{project.maximumBudget || 0}
                </Text>
                <Text style={styles.kpiSub}>{project.budgetType || 'Fixed'} Budget</Text>
              </View>

              <View style={styles.kpiCard}>
                <Ionicons name="calendar-outline" size={20} color={colors.info} />
                <Text style={styles.kpiLabel}>Duration & Deadline</Text>
                <Text style={styles.kpiValue}>{project.estimatedDuration || '1-2 weeks'}</Text>
                <Text style={styles.kpiSub}>Deadline: {project.deadline || 'Flexible'}</Text>
              </View>

              <View style={styles.kpiCard}>
                <Ionicons name="layers-outline" size={20} color={colors.purple} />
                <Text style={styles.kpiLabel}>Category</Text>
                <Text style={styles.kpiValue}>{project.category || 'General'}</Text>
                <Text style={styles.kpiSub}>{proposals.length} Proposals Submitted</Text>
              </View>
            </View>

            {/* Client Profile Card */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardHeading}>Client Information</Text>
                {project.clientId ? (
                  <TouchableOpacity
                    style={styles.cardActionBtn}
                    onPress={() => navigation?.navigate('UserDetail', { userId: project.clientId })}
                  >
                    <Ionicons name="open-outline" size={14} color={colors.primary} />
                    <Text style={styles.cardActionText}>View Full Client Profile</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              <View style={styles.clientInfoRow}>
                <View style={styles.clientAvatar}>
                  <Text style={styles.clientAvatarText}>
                    {(project.clientName || 'C').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.clientMeta}>
                  <Text style={styles.clientName}>{project.clientName || 'Client'}</Text>
                  <Text style={styles.clientCompany}>{project.clientCompany || 'Individual Client'}</Text>
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={12} color="#F59E0B" />
                    <Text style={styles.ratingText}>{project.clientRating || '4.9'} Client Rating</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.notifyClientBtn}
                  onPress={() => setNotifyModalVisible(true)}
                >
                  <Ionicons name="mail-outline" size={16} color={colors.primary} />
                  <Text style={styles.notifyClientText}>Message</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Scope of Work */}
            <View style={styles.card}>
              <Text style={styles.cardHeading}>Project Brief & Deliverable Requirements</Text>
              <Text style={styles.descriptionText}>
                {project.description || 'No detailed project description was provided for this job.'}
              </Text>
            </View>

            {/* Required Skills */}
            <View style={styles.card}>
              <Text style={styles.cardHeading}>Required Student Skills</Text>
              <View style={styles.skillsTagRow}>
                {Array.isArray(project.requiredSkills) && project.requiredSkills.length > 0 ? (
                  project.requiredSkills.map((sk, idx) => (
                    <View key={idx} style={styles.skillPill}>
                      <Ionicons name="checkmark" size={12} color={colors.primary} />
                      <Text style={styles.skillPillText}>{sk}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.mutedText}>No specific skill tags attached.</Text>
                )}
              </View>
            </View>
          </View>
        )}

        {activeTab === 'PROPOSALS' && (
          <View style={styles.sectionWrap}>
            <View style={styles.proposalsHeader}>
              <Text style={styles.cardHeading}>
                Candidate Bids for this Project ({proposals.length})
              </Text>
            </View>

            {proposals.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Ionicons name="paper-plane-outline" size={42} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>No student bids yet</Text>
                <Text style={styles.emptySub}>Students have not submitted proposals for this project yet.</Text>
              </View>
            ) : (
              proposals.map(prop => (
                <View key={prop.id || prop.proposalId} style={styles.proposalItemCard}>
                  <View style={styles.propHeader}>
                    <View style={styles.propAuthorWrap}>
                      <View style={styles.propAvatar}>
                        <Text style={styles.propAvatarText}>
                          {(prop.freelancerName || 'S').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View>
                        <Text style={styles.propAuthorName}>
                          {prop.freelancerName || 'Student Freelancer'}
                        </Text>
                        <Text style={styles.propDelivery}>
                          Delivery in {prop.deliveryDays || 7} days
                        </Text>
                      </View>
                    </View>
                    <View style={styles.propRight}>
                      <Text style={styles.propPrice}>₹{prop.proposedPrice || 0}</Text>
                      <StatusBadge label={prop.status || 'PENDING'} size="small" />
                    </View>
                  </View>

                  <Text style={styles.propCoverLetter} numberOfLines={3}>
                    {prop.coverLetter || 'No cover letter attached.'}
                  </Text>

                  <View style={styles.propFooter}>
                    <TouchableOpacity
                      style={styles.propActionBtn}
                      onPress={() => navigation?.navigate('UserDetail', { userId: prop.freelancerId })}
                    >
                      <Ionicons name="person-outline" size={14} color={colors.primary} />
                      <Text style={styles.propActionText}>Student Profile</Text>
                    </TouchableOpacity>

                    {prop.status !== 'ACCEPTED' ? (
                      <TouchableOpacity
                        style={[styles.propActionBtn, { backgroundColor: colors.successLight }]}
                        onPress={async () => {
                          try {
                            await updateProposalStatus(prop.id, 'ACCEPTED');
                            Alert.alert('Accepted', 'Proposal bid marked as accepted.');
                          } catch (e) {
                            Alert.alert('Error', e.message);
                          }
                        }}
                      >
                        <Ionicons name="checkmark" size={14} color={colors.success} />
                        <Text style={[styles.propActionText, { color: colors.success }]}>Accept Bid</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'CONTRACT' && (
          <View style={styles.sectionWrap}>
            {assignment ? (
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <View>
                    <Text style={styles.cardHeading}>Escrow Contract & Milestones</Text>
                    <Text style={styles.mutedText}>Contract ID: {assignment.id || assignment.assignmentId}</Text>
                  </View>
                  <StatusBadge label={assignment.status || 'ACTIVE'} />
                </View>

                <View style={styles.escrowSummaryBox}>
                  <View style={styles.escrowSumRow}>
                    <Text style={styles.escrowSumLabel}>Agreed Contract Escrow:</Text>
                    <Text style={styles.escrowSumVal}>₹{assignment.agreedBudget || 0} INR</Text>
                  </View>
                  <View style={styles.escrowSumRow}>
                    <Text style={styles.escrowSumLabel}>Hired Student:</Text>
                    <Text style={styles.escrowSumVal}>{assignment.freelancerName || 'Freelancer'}</Text>
                  </View>
                </View>

                {/* Milestones list */}
                <Text style={[styles.cardHeading, { marginTop: 16 }]}>Project Milestones</Text>
                {Array.isArray(assignment.milestones) && assignment.milestones.length > 0 ? (
                  assignment.milestones.map((m, idx) => (
                    <View key={m.milestoneId || idx} style={styles.milestoneItem}>
                      <Ionicons 
                        name={m.isCompleted ? "checkmark-circle" : "ellipse-outline"} 
                        size={20} 
                        color={m.isCompleted ? colors.success : colors.textMuted} 
                      />
                      <View style={styles.milestoneInfo}>
                        <Text style={styles.milestoneTitle}>{m.title || `Milestone ${idx + 1}`}</Text>
                        <Text style={styles.milestoneDue}>Due: {m.dueDate || 'Flexible'}</Text>
                      </View>
                      <Text style={styles.milestoneAmount}>₹{m.amount || 0}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.mutedText}>No split milestones. Single-delivery escrow contract.</Text>
                )}

                {/* Deliverables */}
                {Array.isArray(assignment.deliverables) && assignment.deliverables.length > 0 ? (
                  <View style={{ marginTop: 16 }}>
                    <Text style={styles.cardHeading}>Delivered Project Links</Text>
                    {assignment.deliverables.map((d, dIdx) => (
                      <View key={d.id || dIdx} style={styles.deliverablePill}>
                        <Ionicons name="link-outline" size={16} color={colors.primary} />
                        <Text style={styles.deliverableTitle}>{d.title || 'Deliverable'}:</Text>
                        <Text style={styles.deliverableUrl} numberOfLines={1}>{d.url}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                {/* Release Action */}
                <TouchableOpacity
                  style={styles.releaseEscrowBtn}
                  onPress={() => handleReleaseEscrow(assignment)}
                >
                  <Ionicons name="shield-checkmark" size={18} color={colors.textWhite} />
                  <Text style={styles.releaseEscrowText}>Release Escrow Funds to Student</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.emptyWrap}>
                <Ionicons name="shield-outline" size={48} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>No Active Contract Yet</Text>
                <Text style={styles.emptySub}>
                  This project has not yet been awarded to a freelancer. It is currently in the bidding stage.
                </Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'MODERATION' && (
          <View style={styles.sectionWrap}>
            <View style={styles.card}>
              <Text style={styles.cardHeading}>Full Project Content & Pricing Editor</Text>
              <Text style={styles.mutedText}>
                Edit title, budget boundaries, category classification, skill tags, or detailed description.
              </Text>
              <TouchableOpacity
                style={styles.adminActionBtn}
                onPress={handleOpenEdit}
              >
                <Ionicons name="create" size={16} color={colors.primary} />
                <Text style={styles.adminActionBtnText}>Launch Project Editor</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardHeading}>Override Project Lifecycle Status</Text>
              <Text style={styles.mutedText}>
                Manually change the project status across all student applications.
              </Text>
              <View style={styles.statusButtonsGrid}>
                {['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map(st => (
                  <TouchableOpacity
                    key={st}
                    style={[
                      styles.statusSelectBtn,
                      project.status === st && styles.statusSelectBtnActive
                    ]}
                    onPress={() => handleUpdateStatus(st)}
                  >
                    <Text style={[
                      styles.statusSelectText,
                      project.status === st && styles.statusSelectTextActive
                    ]}>
                      Set {st}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardHeading}>Send Direct Notice to Client</Text>
              <Text style={styles.mutedText}>
                Transmit a formal admin inquiry or content correction request regarding this listing.
              </Text>
              <TouchableOpacity
                style={styles.adminActionBtn}
                onPress={() => setNotifyModalVisible(true)}
              >
                <Ionicons name="mail" size={16} color={colors.primary} />
                <Text style={styles.adminActionBtnText}>Compose Notification to Client</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.card, { borderColor: colors.danger + '40' }]}>
              <Text style={[styles.cardHeading, { color: colors.danger }]}>Danger Zone</Text>
              <Text style={styles.mutedText}>
                Permanently deletes this project from Firestore. Any associated bids will be orphaned.
              </Text>
              <TouchableOpacity
                style={styles.deleteProjectBtn}
                onPress={handleDeleteProject}
              >
                <Ionicons name="trash" size={16} color={colors.textWhite} />
                <Text style={styles.deleteProjectText}>Delete Project from SkillBridge</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Modal for Client Notification */}
      <Modal visible={notifyModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeading}>Send Message to Client</Text>
              <TouchableOpacity onPress={() => setNotifyModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Subject Title</Text>
              <TextInput
                style={styles.input}
                value={notifTitle}
                onChangeText={setNotifTitle}
                placeholder="e.g. Project Scope Clarification"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.inputLabel}>Notification Content</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notifBody}
                onChangeText={setNotifBody}
                placeholder="Enter details for the client..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
              />

              <TouchableOpacity
                style={styles.sendBtn}
                onPress={handleSendNotification}
                disabled={sendingNotif}
              >
                {sendingNotif ? (
                  <ActivityIndicator size="small" color={colors.textWhite} />
                ) : (
                  <>
                    <Ionicons name="send" size={16} color={colors.textWhite} />
                    <Text style={styles.sendBtnText}>Dispatch Message</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Full Control: Edit Project Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 580, maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalHeading}>Edit Project Specifications</Text>
                <Text style={{ fontSize: 11, color: colors.textSecondary }}>ID: {projectId}</Text>
              </View>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ paddingBottom: 10 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Project Title *</Text>
              <TextInput
                style={styles.input}
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="Project Title"
              />

              <Text style={styles.inputLabel}>Status</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map(st => (
                  <TouchableOpacity
                    key={st}
                    style={[
                      { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceSubtle },
                      editStatus === st && { backgroundColor: colors.primaryLight, borderColor: colors.primary }
                    ]}
                    onPress={() => setEditStatus(st)}
                  >
                    <Text style={[{ fontSize: 11, fontWeight: '700', color: colors.textSecondary }, editStatus === st && { color: colors.primary }]}>
                      {st}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Category</Text>
              <TextInput
                style={styles.input}
                value={editCategory}
                onChangeText={setEditCategory}
                placeholder="e.g. Mobile Development"
              />

              <View style={{ flexDirection: 'row', gap: 10, marginVertical: 4 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Min Budget (₹)</Text>
                  <TextInput
                    style={styles.input}
                    value={editMinBudget}
                    onChangeText={setEditMinBudget}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Max Budget (₹)</Text>
                  <TextInput
                    style={styles.input}
                    value={editMaxBudget}
                    onChangeText={setEditMaxBudget}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Estimated Duration</Text>
              <TextInput
                style={styles.input}
                value={editDuration}
                onChangeText={setEditDuration}
                placeholder="e.g. 2-3 weeks"
              />

              <Text style={styles.inputLabel}>Skills Required (comma-separated)</Text>
              <TextInput
                style={styles.input}
                value={editSkills}
                onChangeText={setEditSkills}
                placeholder="Kotlin, Android, Firebase"
              />

              <Text style={styles.inputLabel}>Detailed Scope & Instructions</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editDesc}
                onChangeText={setEditDesc}
                multiline
                numberOfLines={4}
              />

              {/* Project Cover Banner */}
              <View style={styles.bannerSection}>
                <View style={styles.bannerSectionHeader}>
                  <View style={styles.bannerLabelRow}>
                    <Ionicons name="image" size={16} color={colors.primary} />
                    <Text style={styles.formLabelBold}>Project Cover Banner</Text>
                  </View>
                  <View style={styles.optionalBadge}>
                    <Text style={styles.optionalBadgeText}>Optional</Text>
                  </View>
                </View>
                <Text style={styles.bannerHelpText}>
                  Set an attractive cover banner for this job listing or pick from curated tech presets below.
                </Text>

                {editBannerUrl ? (
                  <View style={styles.previewBannerWrap}>
                    <Image 
                      source={{ uri: editBannerUrl }} 
                      style={styles.previewBannerImage} 
                      resizeMode="cover"
                    />
                    <View style={styles.previewOverlayBadge}>
                      <Ionicons name="link-outline" size={12} color="#fff" />
                      <Text style={styles.previewOverlayText}>Active Banner</Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.removeBannerBtn}
                      onPress={() => setEditBannerUrl('')}
                    >
                      <Ionicons name="close" size={14} color="#fff" />
                      <Text style={styles.removeBannerText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}

                <TextInput
                  style={styles.input}
                  value={editBannerUrl}
                  onChangeText={setEditBannerUrl}
                  placeholder="Paste direct banner image URL (https://...)"
                  placeholderTextColor={colors.textMuted}
                />

                <Text style={styles.presetLabel}>Quick Curated Theme Presets:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
                  {BANNER_PRESETS.map((p) => {
                    const isSelected = editBannerUrl === p.url;
                    return (
                      <TouchableOpacity
                        key={p.label}
                        style={[styles.presetChip, isSelected && styles.presetChipActive]}
                        onPress={() => setEditBannerUrl(p.url)}
                      >
                        <Text style={[styles.presetChipText, isSelected && styles.presetChipTextActive]}>
                          {p.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                <TouchableOpacity
                  style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}
                  onPress={() => setEditModalVisible(false)}
                >
                  <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textSecondary }}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.sendBtn, { paddingHorizontal: 20, marginTop: 0 }, savingProject && { opacity: 0.7 }]}
                  onPress={handleSaveEdit}
                  disabled={savingProject}
                >
                  {savingProject ? (
                    <ActivityIndicator size="small" color={colors.textWhite} />
                  ) : (
                    <>
                      <Ionicons name="save-outline" size={16} color={colors.textWhite} />
                      <Text style={styles.sendBtnText}>Save Project</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  notFoundTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 12,
    marginBottom: 16,
  },
  backBtnPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  backBtnPillText: {
    color: colors.textWhite,
    fontSize: 13,
    fontWeight: '700',
  },
  header: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    width: '100%',
  },
  headerInner: {
    maxWidth: 1400,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  headerRight: {
    marginLeft: 12,
  },
  tabBar: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    width: '100%',
  },
  tabBarInner: {
    maxWidth: 1400,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 6,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: colors.primary,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  contentWrap: {
    maxWidth: 1400,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 60,
  },
  sectionWrap: {
    gap: 16,
  },
  overviewGrid: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  kpiCard: {
    flex: 1,
    minWidth: 160,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  kpiLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '700',
    marginTop: 8,
    textTransform: 'uppercase',
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 4,
  },
  kpiSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  cardActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  clientInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clientAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.navy,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clientAvatarText: {
    color: colors.textWhite,
    fontSize: 18,
    fontWeight: '800',
  },
  clientMeta: {
    flex: 1,
  },
  clientName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  clientCompany: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  notifyClientBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary + '12',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  notifyClientText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textPrimary,
    marginTop: 6,
  },
  skillsTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  skillPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  skillPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  mutedText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  // Proposals Tab
  proposalsHeader: {
    marginBottom: 4,
  },
  proposalItemCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  propHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  propAuthorWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  propAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary + '18',
    justifyContent: 'center',
    alignItems: 'center',
  },
  propAvatarText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  propAuthorName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  propDelivery: {
    fontSize: 11,
    color: colors.textMuted,
  },
  propRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  propPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.success,
  },
  propCoverLetter: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  propFooter: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceSubtle,
    paddingTop: 10,
  },
  propActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: colors.surfaceSubtle,
  },
  propActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  // Escrow / Contract tab
  escrowSummaryBox: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    gap: 6,
  },
  escrowSumRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  escrowSumLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  escrowSumVal: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSubtle,
  },
  milestoneInfo: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  milestoneDue: {
    fontSize: 11,
    color: colors.textMuted,
  },
  milestoneAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  deliverablePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceSubtle,
    padding: 8,
    borderRadius: 8,
    marginTop: 6,
  },
  deliverableTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  deliverableUrl: {
    fontSize: 12,
    color: colors.primary,
    flex: 1,
  },
  releaseEscrowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.purple,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 16,
  },
  releaseEscrowText: {
    color: colors.textWhite,
    fontSize: 13,
    fontWeight: '700',
  },
  // Moderation tab
  statusButtonsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  statusSelectBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusSelectBtnActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  statusSelectText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  statusSelectTextActive: {
    color: colors.textWhite,
  },
  adminActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.primary + '50',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  adminActionBtnText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  deleteProjectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.danger,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  deleteProjectText: {
    color: colors.textWhite,
    fontSize: 13,
    fontWeight: '700',
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 8,
  },
  emptySub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
    maxWidth: 360,
  },
  // Notification Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modalBody: {
    gap: 10,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  input: {
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
    height: 100,
    textAlignVertical: 'top',
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 6,
  },
  sendBtnText: {
    color: colors.textWhite,
    fontSize: 13,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSubtle,
  },
  headerEditBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  // Hero banner & modal banner styles
  detailHeroBannerWrap: {
    width: '100%',
    height: 200,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 12,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailHeroBannerImage: {
    width: '100%',
    height: '100%',
  },
  detailBannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
  },
  bannerTagWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bannerTagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  changeBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  changeBannerBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  noBannerPrompt: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primary + '50',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  noBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  noBannerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noBannerTextWrap: {
    flex: 1,
  },
  noBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  noBannerSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  addBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  addBannerBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  bannerSection: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 12,
    gap: 8,
  },
  bannerSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  formLabelBold: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  optionalBadge: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  optionalBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  bannerHelpText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  previewBannerWrap: {
    width: '100%',
    height: 130,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 6,
  },
  previewBannerImage: {
    width: '100%',
    height: '100%',
  },
  previewOverlayBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  previewOverlayText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '700',
  },
  removeBannerBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  removeBannerText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '700',
  },
  presetLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: 4,
  },
  presetScroll: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  presetChip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 6,
  },
  presetChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  presetChipTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
});
