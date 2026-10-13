import React, { useState, useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { colors } from '../theme/colors';

import DashboardScreen from '../screens/DashboardScreen';
import UsersScreen from '../screens/UsersScreen';
import UserDetailScreen from '../screens/UserDetailScreen';
import UserDeleteScreen from '../screens/UserDeleteScreen';
import ProjectsScreen from '../screens/ProjectsScreen';
import ProjectDetailScreen from '../screens/ProjectDetailScreen';
import ProposalsScreen from '../screens/ProposalsScreen';
import ContractsScreen from '../screens/ContractsScreen';
import DisputesScreen from '../screens/DisputesScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import BroadcastScreen from '../screens/BroadcastScreen';
import ReviewsScreen from '../screens/ReviewsScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import PlatformSettingsScreen from '../screens/PlatformSettingsScreen';
import CustomerSupportScreen from '../screens/CustomerSupportScreen';
import AdminLoginScreen from '../screens/AdminLoginScreen';
import AdminProfileScreen from '../screens/AdminProfileScreen';

import AdminSidebar from '../components/AdminSidebar';
import { 
  subscribeUsers, 
  subscribeProjects, 
  subscribeAssignments, 
  subscribeTransactions,
  subscribeProposals,
  subscribeSupportTickets
} from '../services/adminService';
import { 
  subscribeAdminAuth, 
  getCurrentAdmin, 
  logoutAdmin 
} from '../services/authService';

export default function RootNavigator() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!getCurrentAdmin());
  const [adminUser, setAdminUser] = useState(getCurrentAdmin());
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [routeParams, setRouteParams] = useState({});
  const [collapsed, setCollapsed] = useState(false);
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [counts, setCounts] = useState({
    users: 0,
    projects: 0,
    proposals: 0,
    contracts: 0,
    disputes: 0,
    pendingWithdrawals: 0,
    tickets: 0,
    openTickets: 0
  });

  useEffect(() => {
    const unsubAuth = subscribeAdminAuth((user) => {
      setAdminUser(user);
      setIsAuthenticated(!!user);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubUsers = subscribeUsers(data => {
      setCounts(prev => ({ ...prev, users: data.length }));
    });
    const unsubProjects = subscribeProjects(data => {
      setCounts(prev => ({ ...prev, projects: data.length }));
    });
    const unsubProposals = subscribeProposals(data => {
      setCounts(prev => ({ ...prev, proposals: data.length }));
    });
    const unsubAssignments = subscribeAssignments(data => {
      const activeDisputes = data.filter(a => 
        a.status === 'REVISION_REQUESTED' || 
        (a.revisionCount && a.revisionCount > 0) ||
        (a.disputeStatus && !a.disputeStatus.startsWith('RESOLVED'))
      ).length;
      setCounts(prev => ({ 
        ...prev, 
        contracts: data.length,
        disputes: activeDisputes 
      }));
    });
    const unsubTransactions = subscribeTransactions(data => {
      const pending = data.filter(t => t.transactionType === 'WITHDRAWAL' && t.paymentStatus === 'PENDING').length;
      setCounts(prev => ({ ...prev, pendingWithdrawals: pending }));
    });
    const unsubTickets = subscribeSupportTickets(data => {
      const open = data.filter(t => t.status === 'OPEN' || !t.status).length;
      setCounts(prev => ({ ...prev, tickets: data.length, openTickets: open }));
    });

    return () => {
      if (unsubUsers) unsubUsers();
      if (unsubProjects) unsubProjects();
      if (unsubProposals) unsubProposals();
      if (unsubAssignments) unsubAssignments();
      if (unsubTransactions) unsubTransactions();
      if (unsubTickets) unsubTickets();
    };
  }, [isAuthenticated]);

  const handleLogout = async () => {
    await logoutAdmin();
    setIsAuthenticated(false);
    setAdminUser(null);
    setActiveTab('Dashboard');
  };

  const navigation = {
    navigate: (screenName, params = {}) => {
      setRouteParams(params);
      setActiveTab(screenName);
    },
    goBack: () => {
      if (activeTab === 'UserDetail' || activeTab === 'UserDelete') {
        setActiveTab('Users');
      } else if (activeTab === 'ProjectDetail') {
        setActiveTab('Projects');
      } else if (activeTab === 'Profile') {
        setActiveTab('Dashboard');
      } else {
        setActiveTab('Dashboard');
      }
    },
    logout: handleLogout
  };

  // If not logged in, show the split-screen Admin Login page
  if (!isAuthenticated) {
    return (
      <AdminLoginScreen 
        onLoginSuccess={(user) => {
          setAdminUser(user);
          setIsAuthenticated(true);
        }} 
      />
    );
  }

  const renderScreen = () => {
    switch (activeTab) {
      case 'Dashboard':
        return <DashboardScreen navigation={navigation} />;
      case 'Users':
        return <UsersScreen navigation={navigation} />;
      case 'UserDetail':
        return <UserDetailScreen navigation={navigation} route={{ params: routeParams }} />;
      case 'UserDelete':
        return <UserDeleteScreen navigation={navigation} route={{ params: routeParams }} />;
      case 'Projects':
        return <ProjectsScreen navigation={navigation} />;
      case 'ProjectDetail':
        return <ProjectDetailScreen navigation={navigation} route={{ params: routeParams }} />;
      case 'Proposals':
        return <ProposalsScreen navigation={navigation} />;
      case 'Contracts':
        return <ContractsScreen navigation={navigation} />;
      case 'Disputes':
        return <DisputesScreen navigation={navigation} />;
      case 'Support':
        return <CustomerSupportScreen navigation={navigation} route={{ params: routeParams }} />;
      case 'Finance':
        return <TransactionsScreen navigation={navigation} />;
      case 'Broadcast':
        return <BroadcastScreen navigation={navigation} />;
      case 'Reviews':
        return <ReviewsScreen navigation={navigation} />;
      case 'Analytics':
        return <AnalyticsScreen navigation={navigation} />;
      case 'Settings':
        return <PlatformSettingsScreen navigation={navigation} />;
      case 'Profile':
        return <AdminProfileScreen navigation={navigation} onLogout={handleLogout} />;
      default:
        return <DashboardScreen navigation={navigation} />;
    }
  };

  const getSidebarActiveTab = () => {
    if (activeTab === 'UserDetail' || activeTab === 'UserDelete') return 'Users';
    if (activeTab === 'ProjectDetail') return 'Projects';
    return activeTab;
  };

  return (
    <View style={styles.container}>
      <AdminSidebar
        activeTab={getSidebarActiveTab()}
        onSelectTab={(tab) => {
          setRouteParams({});
          setActiveTab(tab);
        }}
        collapsed={isDesktop ? collapsed : true}
        onToggleCollapse={() => setCollapsed(prev => !prev)}
        counts={counts}
      />
      <View style={styles.content}>
        {renderScreen()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.background,
    height: '100%',
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
    height: '100%',
  },
});
