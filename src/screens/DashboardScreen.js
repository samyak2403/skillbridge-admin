import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import AdminHeader from '../components/AdminHeader';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { 
  subscribeUsers, 
  subscribeProjects, 
  subscribeAssignments, 
  subscribeTransactions,
  subscribeSupportTickets 
} from '../services/adminService';

export default function DashboardScreen({ navigation }) {
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsubUsers = subscribeUsers(data => {
      setUsers(data);
      setLoading(false);
    });

    const unsubProjects = subscribeProjects(data => {
      setProjects(data);
    });

    const unsubAssignments = subscribeAssignments(data => {
      setAssignments(data);
    });

    const unsubTransactions = subscribeTransactions(data => {
      setTransactions(data);
    });

    const unsubTickets = subscribeSupportTickets(data => {
      setSupportTickets(data);
    });

    return () => {
      if (unsubUsers) unsubUsers();
      if (unsubProjects) unsubProjects();
      if (unsubAssignments) unsubAssignments();
      if (unsubTransactions) unsubTransactions();
      if (unsubTickets) unsubTickets();
    };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  // KPI Calculations
  const totalUsers = users.length;
  const verifiedUsers = users.filter(u => u.isVerified).length;
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'IN_PROGRESS' || p.status === 'OPEN').length;
  const activeContracts = assignments.filter(a => a.status === 'ACTIVE' || a.status === 'SUBMITTED').length;
  
  const totalVolume = transactions
    .filter(t => t.paymentStatus === 'COMPLETED' && t.amount > 0)
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

  const pendingWithdrawals = transactions.filter(
    t => t.transactionType === 'WITHDRAWAL' && t.paymentStatus === 'PENDING'
  );

  const openTickets = supportTickets.filter(t => t.status === 'OPEN' || !t.status);

  return (
    <View style={styles.container}>
      <AdminHeader title="Platform Dashboard" subtitle="Overview of SkillBridge Marketplace" />

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Connecting to Firebase Live Collections...</Text>
          </View>
        ) : null}

        {/* 1. Quick Stats Grid */}
        <Text style={styles.sectionTitle}>Key Performance Indicators</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCardWrapper}>
            <StatCard
              title="Total Users"
              value={totalUsers.toString()}
              subtext={`${verifiedUsers} Verified Users`}
              icon="people"
              color={colors.primary}
              trend="+100% Live"
            />
          </View>
          <View style={styles.statCardWrapper}>
            <StatCard
              title="Total Projects"
              value={totalProjects.toString()}
              subtext={`${activeProjects} Active / Open`}
              icon="briefcase"
              color={colors.info}
            />
          </View>
          <View style={styles.statCardWrapper}>
            <StatCard
              title="Active Contracts"
              value={activeContracts.toString()}
              subtext="Under Escrow Protection"
              icon="document-text"
              color={colors.purple}
            />
          </View>
          <View style={styles.statCardWrapper}>
            <StatCard
              title="Gross Volume"
              value={`₹${totalVolume.toLocaleString()}`}
              subtext="Platform Processed"
              icon="cash"
              color={colors.success}
            />
          </View>
        </View>

        {/* 2. Urgent Attention / Action Banners */}
        {openTickets.length > 0 ? (
          <TouchableOpacity 
            style={[styles.alertCard, { borderColor: '#0284C7', backgroundColor: '#F0F9FF', marginBottom: 12 }]}
            onPress={() => navigation.navigate('Support')}
          >
            <View style={[styles.alertIcon, { backgroundColor: '#E0F2FE' }]}>
              <Ionicons name="headset" size={24} color="#0284C7" />
            </View>
            <View style={styles.alertContent}>
              <Text style={[styles.alertTitle, { color: '#0369A1' }]}>
                {openTickets.length} Customer Support Ticket / Appeal(s) Awaiting Review
              </Text>
              <Text style={styles.alertSub}>
                Tap to answer inquiries and process account suspension appeals.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : null}

        {pendingWithdrawals.length > 0 ? (
          <TouchableOpacity 
            style={styles.alertCard}
            onPress={() => navigation.navigate('Finance')}
          >
            <View style={styles.alertIcon}>
              <Ionicons name="alert-circle" size={24} color={colors.warning} />
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>
                {pendingWithdrawals.length} Pending Withdrawal Request(s)
              </Text>
              <Text style={styles.alertSub}>
                Tap to review bank transfer requests and approve payouts.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : null}

        {/* 3. Quick Action Hub */}
        <Text style={styles.sectionTitle}>Admin Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity 
            style={styles.actionBtn}
            onPress={() => navigation.navigate('Users')}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="people" size={20} color={colors.primary} />
            </View>
            <Text style={styles.actionBtnText}>Users & Verification</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionBtn}
            onPress={() => navigation.navigate('Projects')}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: colors.info + '15' }]}>
              <Ionicons name="folder-open" size={20} color={colors.info} />
            </View>
            <Text style={styles.actionBtnText}>Jobs & Catalog</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionBtn}
            onPress={() => navigation.navigate('Proposals')}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: '#06B6D4' + '15' }]}>
              <Ionicons name="paper-plane" size={20} color="#06B6D4" />
            </View>
            <Text style={styles.actionBtnText}>Proposals & Bids</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionBtn}
            onPress={() => navigation.navigate('Contracts')}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: colors.purple + '15' }]}>
              <Ionicons name="shield-checkmark" size={20} color={colors.purple} />
            </View>
            <Text style={styles.actionBtnText}>Escrow Release</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionBtn}
            onPress={() => navigation.navigate('Disputes')}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: colors.danger + '15' }]}>
              <Ionicons name="alert-circle" size={20} color={colors.danger} />
            </View>
            <Text style={styles.actionBtnText}>Dispute Mediation</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionBtn}
            onPress={() => navigation.navigate('Support')}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: '#0284C7' + '15' }]}>
              <Ionicons name="headset" size={20} color="#0284C7" />
            </View>
            <Text style={styles.actionBtnText}>Support Desk</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionBtn}
            onPress={() => navigation.navigate('Analytics')}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: colors.success + '15' }]}>
              <Ionicons name="bar-chart" size={20} color={colors.success} />
            </View>
            <Text style={styles.actionBtnText}>Analytics & KPIs</Text>
          </TouchableOpacity>
        </View>

        {/* 4. Recent Projects Oversight */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Projects Catalog</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Projects')}>
            <Text style={styles.viewAllText}>View All ({projects.length})</Text>
          </TouchableOpacity>
        </View>

        {projects.slice(0, 4).map(proj => (
          <TouchableOpacity 
            key={proj.id} 
            style={styles.listItem}
            onPress={() => navigation.navigate('ProjectDetail', { projectId: proj.id, project: proj })}
            activeOpacity={0.7}
          >
            <View style={styles.itemHeader}>
              <Text style={styles.itemTitle} numberOfLines={1}>{proj.title}</Text>
              <StatusBadge label={proj.status || 'OPEN'} size="small" />
            </View>
            <Text style={styles.itemSub} numberOfLines={2}>{proj.description}</Text>
            <View style={styles.itemFooter}>
              <Text style={styles.itemMeta}>Budget: ₹{proj.minimumBudget || 0} - ₹{proj.maximumBudget || 0}</Text>
              <Text style={styles.itemMeta}>{proj.clientName || 'Client'}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* 5. Recent Registered Users */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent User Signups</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Users')}>
            <Text style={styles.viewAllText}>View All ({users.length})</Text>
          </TouchableOpacity>
        </View>

        {users.slice(0, 4).map(user => (
          <TouchableOpacity 
            key={user.id} 
            style={styles.listItem}
            onPress={() => navigation.navigate('UserDetail', { userId: user.id, user })}
            activeOpacity={0.7}
          >
            <View style={styles.itemHeader}>
              <Text style={styles.itemTitle}>{user.fullName || 'Anonymous User'}</Text>
              <StatusBadge label={user.userRole || 'FREELANCER'} size="small" />
            </View>
            <Text style={styles.itemSub}>{user.email || 'No email provided'}</Text>
            <View style={styles.itemFooter}>
              <Text style={styles.itemMeta}>{user.collegeName || 'Student Freelancer'}</Text>
              <Text style={[styles.itemMeta, { color: user.isVerified ? colors.success : colors.warning }]}>
                {user.isVerified ? '✓ Verified' : 'Unverified'}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    maxWidth: 1400,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 48,
  },
  loadingWrap: {
    padding: 12,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 12,
    marginTop: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 20,
  },
  statCardWrapper: {
    flex: 1,
    minWidth: 260,
  },
  alertCard: {
    backgroundColor: colors.warningLight,
    borderWidth: 1,
    borderColor: colors.warning + '40',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertIcon: {
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  alertSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  actionBtn: {
    flex: 1,
    minWidth: 160,
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  actionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  listItem: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  itemSub: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
    marginBottom: 8,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.surfaceSubtle,
    paddingTop: 8,
  },
  itemMeta: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
});
