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
  Image,
  useWindowDimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import AdminHeader from '../components/AdminHeader';
import SearchBar from '../components/SearchBar';
import StatusBadge from '../components/StatusBadge';
import { 
  subscribeProjects, 
  updateProjectStatus, 
  createProjectDoc,
  updateProjectDoc,
  deleteProjectDoc 
} from '../services/adminService';

const BANNER_PRESETS = [
  { label: '💻 Mobile App', url: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=1200&q=80' },
  { label: '🌐 Web Dev', url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&q=80' },
  { label: '🎨 UI/UX Design', url: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=1200&q=80' },
  { label: '🤖 AI & Data', url: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=1200&q=80' },
  { label: '🚀 Startup Team', url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&q=80' },
  { label: '📊 Cloud & Backend', url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&q=80' },
];

export default function ProjectsScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const numColumns = width >= 800 ? 4 : width >= 500 ? 2 : 1;

  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');
  const [selectedProject, setSelectedProject] = useState(null);

  // Create Project state
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [createCategory, setCreateCategory] = useState('Mobile Development');
  const [createMinBudget, setCreateMinBudget] = useState('2000');
  const [createMaxBudget, setCreateMaxBudget] = useState('5000');
  const [createDuration, setCreateDuration] = useState('1-2 weeks');
  const [createSkills, setCreateSkills] = useState('Kotlin, Jetpack Compose, Firebase');
  const [createClientName, setCreateClientName] = useState('Admin Staff');
  const [createBannerUrl, setCreateBannerUrl] = useState('');
  const [creatingProject, setCreatingProject] = useState(false);

  // Edit Project state
  const [editingProject, setEditingProject] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editMinBudget, setEditMinBudget] = useState('');
  const [editMaxBudget, setEditMaxBudget] = useState('');
  const [editDuration, setEditDuration] = useState('');
  const [editSkills, setEditSkills] = useState('');
  const [editBannerUrl, setEditBannerUrl] = useState('');
  const [editStatus, setEditStatus] = useState('OPEN');
  const [savingProject, setSavingProject] = useState(false);

  useEffect(() => {
    const unsub = subscribeProjects(data => setProjects(data));
    return () => { if (unsub) unsub(); };
  }, []);

  const tabs = ['ALL', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

  const filteredProjects = projects.filter(p => {
    const textMatch = (p.title || '').toLowerCase().includes(search.toLowerCase()) ||
                      (p.clientName || '').toLowerCase().includes(search.toLowerCase()) ||
                      (p.category || '').toLowerCase().includes(search.toLowerCase());
    
    if (!textMatch) return false;
    if (activeTab === 'ALL') return true;
    return p.status === activeTab;
  });

  const handleChangeStatus = (project) => {
    const options = ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    Alert.alert(
      'Change Project Status',
      `Select new status for "${project.title}":`,
      options.map(st => ({
        text: st,
        onPress: async () => {
          try {
            await updateProjectStatus(project.id, st);
            Alert.alert('Updated', `Project status changed to ${st}.`);
          } catch (e) {
            Alert.alert('Error', e.message);
          }
        }
      })).concat([{ text: 'Dismiss', style: 'cancel' }])
    );
  };

  const handleCreateProject = async () => {
    if (!createTitle.trim() || !createDesc.trim()) {
      Alert.alert('Required', 'Please enter a project title and description.');
      return;
    }
    setCreatingProject(true);
    try {
      const skillsArray = createSkills.split(',').map(s => s.trim()).filter(Boolean);
      await createProjectDoc({
        title: createTitle.trim(),
        description: createDesc.trim(),
        category: createCategory,
        minimumBudget: parseFloat(createMinBudget) || 1000,
        maximumBudget: parseFloat(createMaxBudget) || 5000,
        estimatedDuration: createDuration.trim() || '1-2 weeks',
        requiredSkills: skillsArray,
        clientName: createClientName.trim() || 'SkillBridge Admin',
        clientCompany: 'Platform Listing',
        bannerUrl: createBannerUrl.trim(),
        status: 'OPEN'
      });
      setCreatingProject(false);
      setCreateModalVisible(false);
      setCreateTitle('');
      setCreateDesc('');
      setCreateBannerUrl('');
      Alert.alert('Project Created', 'New project posted to student marketplace.');
    } catch (e) {
      setCreatingProject(false);
      Alert.alert('Error', e.message);
    }
  };

  const handleOpenEditProject = (project) => {
    setEditingProject(project);
    setEditTitle(project.title || '');
    setEditDesc(project.description || '');
    setEditCategory(project.category || 'General');
    setEditMinBudget(String(project.minimumBudget || '0'));
    setEditMaxBudget(String(project.maximumBudget || '0'));
    setEditDuration(project.estimatedDuration || '1-2 weeks');
    setEditSkills(Array.isArray(project.requiredSkills) ? project.requiredSkills.join(', ') : '');
    setEditBannerUrl(project.bannerUrl || '');
    setEditStatus(project.status || 'OPEN');
  };

  const handleSaveEditProject = async () => {
    if (!editTitle.trim()) {
      Alert.alert('Required', 'Please enter a project title.');
      return;
    }
    setSavingProject(true);
    try {
      const skillsArray = editSkills.split(',').map(s => s.trim()).filter(Boolean);
      await updateProjectDoc(editingProject.id, {
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
      setSavingProject(false);
      setEditingProject(null);
      Alert.alert('Success', 'Project updated successfully.');
    } catch (e) {
      setSavingProject(false);
      Alert.alert('Error', e.message);
    }
  };

  const handleDelete = (project) => {
    Alert.alert(
      'Delete Project',
      `Permanently delete "${project.title}" from the marketplace?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProjectDoc(project.id);
              if (selectedProject?.id === project.id) setSelectedProject(null);
              Alert.alert('Deleted', 'Project removed from marketplace.');
            } catch (e) {
              Alert.alert('Error', e.message);
            }
          }
        }
      ]
    );
  };

  const renderProjectItem = ({ item }) => (
    <View style={[styles.cardWrapper, { width: `${100 / numColumns}%` }]}>
      <View style={styles.card}>
        {item.bannerUrl ? (
          <View style={styles.cardBannerWrap}>
            <Image 
              source={{ uri: item.bannerUrl }} 
              style={styles.cardBanner} 
              resizeMode="cover" 
            />
            <View style={styles.bannerPill}>
              <Ionicons name="image" size={10} color="#fff" />
              <Text style={styles.bannerPillText}>Cover</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            <View style={styles.titleWrap}>
              <Text style={styles.title} numberOfLines={1}>{item.title || 'Untitled Job'}</Text>
              <Text style={styles.client} numberOfLines={1}>{item.clientName || 'Client'} • {item.clientCompany || 'Direct'}</Text>
            </View>
            <StatusBadge label={item.status || 'OPEN'} size="small" />
          </View>

          <Text style={styles.description} numberOfLines={2}>
            {item.description || 'No description provided.'}
          </Text>

          {/* Skills Pill Row */}
          {Array.isArray(item.requiredSkills) && item.requiredSkills.length > 0 ? (
            <View style={styles.skillsRow}>
              {item.requiredSkills.slice(0, 2).map((skill, idx) => (
                <View key={idx} style={styles.skillPill}>
                  <Text style={styles.skillText} numberOfLines={1}>{skill}</Text>
                </View>
              ))}
              {item.requiredSkills.length > 2 ? (
                <Text style={styles.moreSkillsText}>+{item.requiredSkills.length - 2}</Text>
              ) : null}
            </View>
          ) : null}

          <View style={styles.metaRow}>
            <View style={styles.metaTop}>
              <Ionicons name="cash-outline" size={12} color={colors.primary} />
              <Text style={styles.metaBudget} numberOfLines={1}>
                ₹{item.minimumBudget || 0} - ₹{item.maximumBudget || 0}
              </Text>
            </View>
            <View style={styles.metaSubRow}>
              <Text style={styles.metaSubText} numberOfLines={1}>
                <Ionicons name="paper-plane-outline" size={10} color={colors.textMuted} /> {item.proposalsCount || 0} bids
              </Text>
              <Text style={styles.metaSubText} numberOfLines={1}>
                <Ionicons name="time-outline" size={10} color={colors.textMuted} /> {item.estimatedDuration || '1-2 wks'}
              </Text>
            </View>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity 
              style={[styles.btn, styles.btnPrimary, { flex: 1 }]}
              onPress={() => handleChangeStatus(item)}
            >
              <Ionicons name="refresh" size={12} color={colors.primary} />
              <Text style={[styles.btnText, { color: colors.primary }]} numberOfLines={1}>Status</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.btn, styles.btnSecondary, { flex: 1 }]}
              onPress={() => handleOpenEditProject(item)}
            >
              <Ionicons name="create-outline" size={12} color={colors.textPrimary} />
              <Text style={[styles.btnText, { color: colors.textPrimary }]} numberOfLines={1}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.btn, styles.btnInfo, { flex: 1 }]}
              onPress={() => {
                if (navigation?.navigate) {
                  navigation.navigate('ProjectDetail', { projectId: item.id, project: item });
                } else {
                  setSelectedProject(item);
                }
              }}
            >
              <Ionicons name="eye-outline" size={12} color={colors.info} />
              <Text style={[styles.btnText, { color: colors.info }]} numberOfLines={1}>View</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.btn, styles.btnDanger]}
              onPress={() => handleDelete(item)}
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
      <AdminHeader title="Jobs & Projects Catalog" subtitle={`${filteredProjects.length} Projects Listed`} />

      <View style={styles.topActionsRow}>
        <TouchableOpacity 
          style={styles.postJobBtn}
          onPress={() => setCreateModalVisible(true)}
        >
          <Ionicons name="add-circle" size={16} color={colors.textWhite} />
          <Text style={styles.postJobBtnText}>+ Post New Job</Text>
        </TouchableOpacity>
      </View>

      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder="Search projects by title, client, skill..."
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <FlatList
        key={numColumns}
        data={filteredProjects}
        keyExtractor={item => item.id}
        numColumns={numColumns}
        renderItem={renderProjectItem}
        columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="briefcase-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No projects found</Text>
            <Text style={styles.emptySub}>No listings match the current filters.</Text>
          </View>
        }
      />

      {/* Project Details Modal */}
      <Modal visible={!!selectedProject} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Project Information</Text>
              <TouchableOpacity onPress={() => setSelectedProject(null)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedProject ? (
              <ScrollView style={styles.modalBody}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Title:</Text>
                  <Text style={styles.detailVal}>{selectedProject.title}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <StatusBadge label={selectedProject.status} />
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Client Name & Company:</Text>
                  <Text style={styles.detailVal}>{selectedProject.clientName} ({selectedProject.clientCompany || 'Individual'})</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Budget Range:</Text>
                  <Text style={styles.detailVal}>₹{selectedProject.minimumBudget} - ₹{selectedProject.maximumBudget} ({selectedProject.budgetType || 'Fixed'})</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Category:</Text>
                  <Text style={styles.detailVal}>{selectedProject.category || 'General'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Deadline & Duration:</Text>
                  <Text style={styles.detailVal}>{selectedProject.deadline || 'N/A'} • {selectedProject.estimatedDuration || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Full Scope of Work:</Text>
                  <Text style={styles.detailVal}>{selectedProject.description}</Text>
                </View>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* Post New Job / Create Project Modal */}
      <Modal visible={createModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 600, maxHeight: '88%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Post New Marketplace Job</Text>
                <Text style={styles.modalSub}>Create a new listing accessible to student freelancers</Text>
              </View>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.formLabel}>Job Title *</Text>
              <TextInput
                style={styles.formInput}
                value={createTitle}
                onChangeText={setCreateTitle}
                placeholder="e.g. Android Jetpack Compose App Development"
              />

              <Text style={styles.formLabel}>Client / Employer Display Name</Text>
              <TextInput
                style={styles.formInput}
                value={createClientName}
                onChangeText={setCreateClientName}
                placeholder="e.g. Acme Tech Studio / SkillBridge Admin"
              />

              <Text style={styles.formLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                {['Mobile Development', 'Web Development', 'UI/UX Design', 'Backend / Cloud', 'AI & Data Science', 'Content & Media'].map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.chip, createCategory === cat && styles.chipActive]}
                    onPress={() => setCreateCategory(cat)}
                  >
                    <Text style={[styles.chipText, createCategory === cat && styles.chipTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.formRow}>
                <View style={styles.formCol}>
                  <Text style={styles.formLabel}>Min Budget (₹)</Text>
                  <TextInput
                    style={styles.formInput}
                    value={createMinBudget}
                    onChangeText={setEditMinBudget ? setCreateMinBudget : setCreateMinBudget}
                    placeholder="1000"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.formCol}>
                  <Text style={styles.formLabel}>Max Budget (₹)</Text>
                  <TextInput
                    style={styles.formInput}
                    value={createMaxBudget}
                    onChangeText={setCreateMaxBudget}
                    placeholder="5000"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Text style={styles.formLabel}>Estimated Duration</Text>
              <TextInput
                style={styles.formInput}
                value={createDuration}
                onChangeText={setCreateDuration}
                placeholder="e.g. 2-3 weeks / 1 month"
              />

              <Text style={styles.formLabel}>Required Skills (comma-separated)</Text>
              <TextInput
                style={styles.formInput}
                value={createSkills}
                onChangeText={setCreateSkills}
                placeholder="e.g. React Native, TypeScript, Tailwind"
              />

              <Text style={styles.formLabel}>Full Project Scope & Requirements *</Text>
              <TextInput
                style={[styles.formInput, { height: 90, textAlignVertical: 'top' }]}
                value={createDesc}
                onChangeText={setCreateDesc}
                placeholder="Detailed deliverables, milestones, submission guidelines..."
                multiline
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
                  Add an eye-catching banner image URL or pick from curated tech presets below.
                </Text>

                {createBannerUrl ? (
                  <View style={styles.previewBannerWrap}>
                    <Image 
                      source={{ uri: createBannerUrl }} 
                      style={styles.previewBannerImage} 
                      resizeMode="cover"
                    />
                    <View style={styles.previewOverlayBadge}>
                      <Ionicons name="link-outline" size={12} color="#fff" />
                      <Text style={styles.previewOverlayText}>Active Banner</Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.removeBannerBtn}
                      onPress={() => setCreateBannerUrl('')}
                    >
                      <Ionicons name="close" size={14} color="#fff" />
                      <Text style={styles.removeBannerText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}

                <TextInput
                  style={styles.formInput}
                  value={createBannerUrl}
                  onChangeText={setCreateBannerUrl}
                  placeholder="Paste direct banner image URL (https://...)"
                  placeholderTextColor={colors.textMuted}
                />

                <Text style={styles.presetLabel}>Quick Curated Theme Presets:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
                  {BANNER_PRESETS.map((p) => {
                    const isSelected = createBannerUrl === p.url;
                    return (
                      <TouchableOpacity
                        key={p.label}
                        style={[styles.presetChip, isSelected && styles.presetChipActive]}
                        onPress={() => setCreateBannerUrl(p.url)}
                      >
                        <Text style={[styles.presetChipText, isSelected && styles.presetChipTextActive]}>
                          {p.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.modalActionsRow}>
                <TouchableOpacity 
                  style={styles.cancelBtn} 
                  onPress={() => setCreateModalVisible(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.saveBtn, creatingProject && { opacity: 0.7 }]} 
                  onPress={handleCreateProject}
                  disabled={creatingProject}
                >
                  {creatingProject ? (
                    <ActivityIndicator size="small" color={colors.textWhite} />
                  ) : (
                    <>
                      <Ionicons name="cloud-upload" size={16} color={colors.textWhite} />
                      <Text style={styles.saveBtnText}>Post Job</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Project Modal */}
      <Modal visible={!!editingProject} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 600, maxHeight: '88%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Edit Project Listing</Text>
                <Text style={styles.modalSub}>ID: {editingProject?.id}</Text>
              </View>
              <TouchableOpacity onPress={() => setEditingProject(null)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {editingProject ? (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <Text style={styles.formLabel}>Job Title *</Text>
                <TextInput
                  style={styles.formInput}
                  value={editTitle}
                  onChangeText={setEditTitle}
                  placeholder="Project title"
                />

                <Text style={styles.formLabel}>Listing Status</Text>
                <View style={styles.statusChipsRow}>
                  {['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map(st => (
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

                <Text style={styles.formLabel}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                  {['Mobile Development', 'Web Development', 'UI/UX Design', 'Backend / Cloud', 'AI & Data Science', 'Content & Media'].map(cat => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.chip, editCategory === cat && styles.chipActive]}
                      onPress={() => setEditCategory(cat)}
                    >
                      <Text style={[styles.chipText, editCategory === cat && styles.chipTextActive]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <View style={styles.formRow}>
                  <View style={styles.formCol}>
                    <Text style={styles.formLabel}>Min Budget (₹)</Text>
                    <TextInput
                      style={styles.formInput}
                      value={editMinBudget}
                      onChangeText={setEditMinBudget}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.formCol}>
                    <Text style={styles.formLabel}>Max Budget (₹)</Text>
                    <TextInput
                      style={styles.formInput}
                      value={editMaxBudget}
                      onChangeText={setEditMaxBudget}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <Text style={styles.formLabel}>Estimated Duration</Text>
                <TextInput
                  style={styles.formInput}
                  value={editDuration}
                  onChangeText={setEditDuration}
                />

                <Text style={styles.formLabel}>Required Skills (comma-separated)</Text>
                <TextInput
                  style={styles.formInput}
                  value={editSkills}
                  onChangeText={setEditSkills}
                />

                <Text style={styles.formLabel}>Scope & Description</Text>
                <TextInput
                  style={[styles.formInput, { height: 90, textAlignVertical: 'top' }]}
                  value={editDesc}
                  onChangeText={setEditDesc}
                  multiline
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
                    Add an eye-catching banner image URL or pick from curated tech presets below.
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
                    style={styles.formInput}
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

                <View style={styles.modalActionsRow}>
                  <TouchableOpacity 
                    style={styles.cancelBtn} 
                    onPress={() => setEditingProject(null)}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.saveBtn, savingProject && { opacity: 0.7 }]} 
                    onPress={handleSaveEditProject}
                    disabled={savingProject}
                  >
                    {savingProject ? (
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
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  cardBannerWrap: {
    width: '100%',
    height: 110,
    backgroundColor: colors.surfaceSubtle,
    position: 'relative',
  },
  cardBanner: {
    width: '100%',
    height: '100%',
  },
  bannerPill: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  bannerPillText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  cardBody: {
    padding: 12,
    flex: 1,
    justifyContent: 'space-between',
  },
  bannerSection: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: 10,
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
    gap: 6,
  },
  titleWrap: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  client: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  description: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
    marginBottom: 8,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 8,
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
    fontWeight: '600',
    color: colors.textSecondary,
  },
  moreSkillsText: {
    fontSize: 10,
    color: colors.textMuted,
    alignSelf: 'center',
  },
  metaRow: {
    backgroundColor: colors.surfaceSubtle,
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
    gap: 4,
  },
  metaTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaBudget: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  metaSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaSubText: {
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
  btnPrimary: {
    backgroundColor: colors.surfaceSubtle,
    borderColor: colors.border,
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
  },
  btnText: {
    fontSize: 10,
    fontWeight: '700',
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
    lineHeight: 20,
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
  postJobBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  postJobBtnText: {
    color: colors.textWhite,
    fontSize: 13,
    fontWeight: '700',
  },
  modalSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
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
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formCol: {
    flex: 1,
  },
  chipsScroll: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  chip: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.textWhite,
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
  modalActionsRow: {
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

