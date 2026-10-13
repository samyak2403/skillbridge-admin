import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import AdminHeader from '../components/AdminHeader';
import StatCard from '../components/StatCard';
import { 
  subscribeUsers, 
  subscribeProjects, 
  subscribeAssignments, 
  subscribeTransactions,
  subscribeProposals 
} from '../services/adminService';

export default function AnalyticsScreen() {
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubUsers = subscribeUsers(data => { setUsers(data); setLoading(false); });
    const unsubProjects = subscribeProjects(data => setProjects(data));
    const unsubAssignments = subscribeAssignments(data => setAssignments(data));
    const unsubTransactions = subscribeTransactions(data => setTransactions(data));
    const unsubProposals = subscribeProposals(data => setProposals(data));

    return () => {
      if (unsubUsers) unsubUsers();
      if (unsubProjects) unsubProjects();
      if (unsubAssignments) unsubAssignments();
      if (unsubTransactions) unsubTransactions();
      if (unsubProposals) unsubProposals();
    };
  }, []);

  // Compute Analytics
  const totalUsers = users.length;
  const freelancers = users.filter(u => u.userRole === 'FREELANCER' || !u.userRole);
  const clients = users.filter(u => u.userRole === 'CLIENT');
  const verifiedUsers = users.filter(u => u.isVerified);
  const verificationRate = totalUsers > 0 ? Math.round((verifiedUsers.length / totalUsers) * 100) : 0;

  const totalGMV = transactions
    .filter(t => t.paymentStatus === 'COMPLETED' && t.amount > 0)
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

  const activeEscrow = assignments
    .filter(a => a.status === 'ACTIVE' || a.status === 'SUBMITTED')
    .reduce((sum, a) => sum + (parseFloat(a.agreedBudget) || 0), 0);

  const totalEarningsPaid = transactions
    .filter(t => t.transactionType === 'EARNING' && t.paymentStatus === 'COMPLETED')
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

  const completedContracts = assignments.filter(a => a.status === 'COMPLETED').length;
  const completionRate = assignments.length > 0 
    ? Math.round((completedContracts / assignments.length) * 100) 
    : 0;

  // Category breakdown
  const categoryCounts = {};
  projects.forEach(p => {
    const cat = p.category || 'General Software';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  const categoryList = Object.entries(categoryCounts).map(([cat, count]) => ({
    name: cat,
    count,
    percent: projects.length > 0 ? Math.round((count / projects.length) * 100) : 0
  })).sort((a, b) => b.count - a.count);

  // Contract Status Distribution
  const activeContractsCount = assignments.filter(a => a.status === 'ACTIVE').length;
  const submittedContractsCount = assignments.filter(a => a.status === 'SUBMITTED').length;
  const cancelledContractsCount = assignments.filter(a => a.status === 'CANCELLED').length;

  const handleExportAudit = () => {
    Alert.alert(
      'Export Platform Report',
      `Audit Summary:\n• Total Users: ${totalUsers}\n• Total Volume: ₹${totalGMV.toLocaleString()} INR\n• Total Contracts: ${assignments.length}\n• Escrow Locked: ₹${activeEscrow.toLocaleString()} INR\n\nReport generation timestamp: ${new Date().toLocaleString()}`,
      [{ text: 'Close', style: 'default' }]
    );
  };

  return (
    <View style={styles.container}>
      <AdminHeader 
        title="Marketplace Analytics" 
        subtitle="Performance KPIs, Volume & Student Economics" 
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Synthesizing Analytics...</Text>
          </View>
        ) : null}

        {/* 1. High-Level Financial Metrics */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Financial & Escrow Metrics</Text>
          <TouchableOpacity style={styles.exportBtn} onPress={handleExportAudit}>
            <Ionicons name="download-outline" size={14} color={colors.primary} />
            <Text style={styles.exportText}>Export Report</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.kpiGrid}>
          <StatCard
            title="Gross Merchandise Value"
            value={`₹${totalGMV.toLocaleString()}`}
            subtext="Platform Settled"
            icon="cash"
            color={colors.success}
            trend="+100% Live"
          />
          <StatCard
            title="Escrow in Flight"
            value={`₹${activeEscrow.toLocaleString()}`}
            subtext="Protected Funds"
            icon="shield-checkmark"
            color={colors.purple}
          />
          <StatCard
            title="Student Wallet Earnings"
            value={`₹${totalEarningsPaid.toLocaleString()}`}
            subtext="Disbursed to Students"
            icon="wallet"
            color={colors.primary}
          />
          <StatCard
            title="Contract Success Rate"
            value={`${completionRate}%`}
            subtext={`${completedContracts} Completed`}
            icon="trophy"
            color={colors.warning}
          />
        </View>

        {/* 2. User Demographics Ratio */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Marketplace Demographics</Text>
          <Text style={styles.cardSub}>Balance between student supply and client demand</Text>

          <View style={styles.ratioRow}>
            <View style={styles.ratioItem}>
              <View style={[styles.ratioIcon, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="school" size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.ratioValue}>{freelancers.length}</Text>
                <Text style={styles.ratioLabel}>Student Freelancers</Text>
              </View>
            </View>

            <View style={styles.ratioDivider} />

            <View style={styles.ratioItem}>
              <View style={[styles.ratioIcon, { backgroundColor: colors.info + '15' }]}>
                <Ionicons name="business" size={20} color={colors.info} />
              </View>
              <View>
                <Text style={styles.ratioValue}>{clients.length}</Text>
                <Text style={styles.ratioLabel}>Client Employers</Text>
              </View>
            </View>

            <View style={styles.ratioDivider} />

            <View style={styles.ratioItem}>
              <View style={[styles.ratioIcon, { backgroundColor: colors.success + '15' }]}>
                <Ionicons name="checkmark-done" size={20} color={colors.success} />
              </View>
              <View>
                <Text style={styles.ratioValue}>{verificationRate}%</Text>
                <Text style={styles.ratioLabel}>Verified Credential Rate</Text>
              </View>
            </View>
          </View>

          {/* Bar representation */}
          <View style={styles.barWrap}>
            <View 
              style={[
                styles.barFreelancer, 
                { flex: freelancers.length || 1 }
              ]} 
            />
            <View 
              style={[
                styles.barClient, 
                { flex: clients.length || 1 }
              ]} 
            />
          </View>
          <View style={styles.barLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
              <Text style={styles.legendText}>Students ({freelancers.length})</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.info }]} />
              <Text style={styles.legendText}>Clients ({clients.length})</Text>
            </View>
          </View>
        </View>

        {/* 3. Project Categories Distribution */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Projects by Specialization Category</Text>
          <Text style={styles.cardSub}>Market demand breakdown across technical fields</Text>

          <View style={styles.categoryList}>
            {categoryList.length === 0 ? (
              <Text style={styles.emptyText}>No project categories recorded.</Text>
            ) : (
              categoryList.map((cat, idx) => (
                <View key={idx} style={styles.catRow}>
                  <View style={styles.catInfo}>
                    <Text style={styles.catName}>{cat.name}</Text>
                    <Text style={styles.catMeta}>{cat.count} Listings ({cat.percent}%)</Text>
                  </View>
                  <View style={styles.catTrack}>
                    <View style={[styles.catFill, { width: `${Math.max(cat.percent, 8)}%` }]} />
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        {/* 4. Contract Progression Lifecycle */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Contract Pipeline Health</Text>
          <Text style={styles.cardSub}>Distribution of milestone contracts</Text>

          <View style={styles.pipelineGrid}>
            <View style={styles.pipelineCard}>
              <Text style={styles.pipelineCount}>{activeContractsCount}</Text>
              <Text style={styles.pipelineLabel}>In Progress</Text>
              <View style={[styles.pipelinePill, { backgroundColor: colors.infoLight }]}>
                <Text style={[styles.pipelinePillText, { color: colors.primary }]}>Active</Text>
              </View>
            </View>

            <View style={styles.pipelineCard}>
              <Text style={styles.pipelineCount}>{submittedContractsCount}</Text>
              <Text style={styles.pipelineLabel}>Deliverables Submitted</Text>
              <View style={[styles.pipelinePill, { backgroundColor: colors.warningLight }]}>
                <Text style={[styles.pipelinePillText, { color: colors.warning }]}>In Review</Text>
              </View>
            </View>

            <View style={styles.pipelineCard}>
              <Text style={styles.pipelineCount}>{completedContracts}</Text>
              <Text style={styles.pipelineLabel}>Completed & Paid</Text>
              <View style={[styles.pipelinePill, { backgroundColor: colors.successLight }]}>
                <Text style={[styles.pipelinePillText, { color: colors.success }]}>Settled</Text>
              </View>
            </View>

            <View style={styles.pipelineCard}>
              <Text style={styles.pipelineCount}>{cancelledContractsCount}</Text>
              <Text style={styles.pipelineLabel}>Cancelled / Refunded</Text>
              <View style={[styles.pipelinePill, { backgroundColor: colors.dangerLight }]}>
                <Text style={[styles.pipelinePillText, { color: colors.danger }]}>Closed</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 5. Proposal Conversion Funnel */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Marketplace Liquidity Funnel</Text>
          <View style={styles.funnelRow}>
            <View style={styles.funnelStep}>
              <Text style={styles.funnelStepVal}>{projects.length}</Text>
              <Text style={styles.funnelStepLabel}>Projects Posted</Text>
            </View>
            <Ionicons name="arrow-forward" size={16} color={colors.textMuted} />
            <View style={styles.funnelStep}>
              <Text style={styles.funnelStepVal}>{proposals.length}</Text>
              <Text style={styles.funnelStepLabel}>Bids Received</Text>
            </View>
            <Ionicons name="arrow-forward" size={16} color={colors.textMuted} />
            <View style={styles.funnelStep}>
              <Text style={styles.funnelStepVal}>{assignments.length}</Text>
              <Text style={styles.funnelStepLabel}>Contracts Funded</Text>
            </View>
            <Ionicons name="arrow-forward" size={16} color={colors.textMuted} />
            <View style={styles.funnelStep}>
              <Text style={styles.funnelStepVal}>{completedContracts}</Text>
              <Text style={styles.funnelStepLabel}>Graduated Work</Text>
            </View>
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
  scrollContent: {
    maxWidth: 1400,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 48,
    gap: 16,
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 8,
    color: colors.textSecondary,
    fontSize: 13,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  exportText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  cardSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: 16,
  },
  ratioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  ratioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ratioIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratioValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  ratioLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  ratioDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.border,
  },
  barWrap: {
    height: 12,
    flexDirection: 'row',
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: colors.surfaceSubtle,
    marginBottom: 10,
  },
  barFreelancer: {
    backgroundColor: colors.primary,
  },
  barClient: {
    backgroundColor: colors.info,
  },
  barLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  categoryList: {
    gap: 12,
  },
  catRow: {
    gap: 6,
  },
  catInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  catName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  catMeta: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  catTrack: {
    height: 8,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 4,
    overflow: 'hidden',
  },
  catFill: {
    height: '100%',
    backgroundColor: colors.purple,
    borderRadius: 4,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  pipelineGrid: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  pipelineCard: {
    flex: 1,
    minWidth: 130,
    backgroundColor: colors.surfaceSubtle,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  pipelineCount: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  pipelineLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  pipelinePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 8,
  },
  pipelinePillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  funnelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSubtle,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    flexWrap: 'wrap',
    gap: 8,
  },
  funnelStep: {
    alignItems: 'center',
  },
  funnelStepVal: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  funnelStepLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
