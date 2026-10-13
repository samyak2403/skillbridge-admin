import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { subscribeAdminAuth, getCurrentAdmin } from '../services/authService';

export default function AdminSidebar({ 
  activeTab, 
  onSelectTab, 
  collapsed = false, 
  onToggleCollapse = () => {},
  counts = {}
}) {
  const [adminData, setAdminData] = useState(getCurrentAdmin());

  useEffect(() => {
    const unsub = subscribeAdminAuth((admin) => {
      setAdminData(admin);
    });
    return () => unsub();
  }, []);
  const menuSections = [
    {
      title: 'MARKETPLACE',
      items: [
        { 
          key: 'Dashboard', 
          label: 'Dashboard', 
          icon: 'grid', 
          iconActive: 'grid',
          color: colors.primary 
        },
        { 
          key: 'Users', 
          label: 'User Management', 
          icon: 'people-outline', 
          iconActive: 'people',
          color: colors.success,
          badge: counts.users ? `${counts.users}` : null
        },
        { 
          key: 'Projects', 
          label: 'Jobs & Projects', 
          icon: 'briefcase-outline', 
          iconActive: 'briefcase',
          color: colors.warning,
          badge: counts.projects ? `${counts.projects}` : null
        },
        { 
          key: 'Proposals', 
          label: 'Proposals & Bids', 
          icon: 'paper-plane-outline', 
          iconActive: 'paper-plane',
          color: colors.info,
          badge: counts.proposals ? `${counts.proposals}` : null
        },
        { 
          key: 'Contracts', 
          label: 'Contracts & Escrow', 
          icon: 'shield-checkmark-outline', 
          iconActive: 'shield-checkmark',
          color: colors.purple,
          badge: counts.contracts ? `${counts.contracts}` : null
        },
      ]
    },
    {
      title: 'OPERATIONS',
      items: [
        { 
          key: 'Finance', 
          label: 'Finance & Payouts', 
          icon: 'wallet-outline', 
          iconActive: 'wallet',
          color: '#EC4899',
          badge: counts.pendingWithdrawals > 0 ? `${counts.pendingWithdrawals} PENDING` : null,
          badgeAlert: counts.pendingWithdrawals > 0
        },
        { 
          key: 'Disputes', 
          label: 'Disputes & Mediation', 
          icon: 'alert-circle-outline', 
          iconActive: 'alert-circle',
          color: colors.danger,
          badge: counts.disputes > 0 ? `${counts.disputes} FLAGGED` : null,
          badgeAlert: counts.disputes > 0
        },
        { 
          key: 'Support', 
          label: 'Customer Support', 
          icon: 'headset-outline', 
          iconActive: 'headset',
          color: '#0284C7',
          badge: counts.openTickets > 0 ? `${counts.openTickets} NEW` : (counts.tickets ? `${counts.tickets}` : null),
          badgeAlert: counts.openTickets > 0
        },
        { 
          key: 'Broadcast', 
          label: 'Push Announcements', 
          icon: 'megaphone-outline', 
          iconActive: 'megaphone',
          color: colors.info 
        },
        { 
          key: 'Reviews', 
          label: 'Reviews Moderation', 
          icon: 'star-outline', 
          iconActive: 'star',
          color: '#F97316' 
        },
        { 
          key: 'Analytics', 
          label: 'Analytics & KPIs', 
          icon: 'bar-chart-outline', 
          iconActive: 'bar-chart',
          color: '#14B8A6' 
        },
        { 
          key: 'Settings', 
          label: 'Platform Settings', 
          icon: 'settings-outline', 
          iconActive: 'settings',
          color: '#6366F1' 
        },
        { 
          key: 'Profile', 
          label: 'Admin Profile', 
          icon: 'person-circle-outline', 
          iconActive: 'person-circle',
          color: '#4F46E5' 
        },
      ]
    }
  ];

  return (
    <View style={[styles.sidebar, collapsed && styles.sidebarCollapsed]}>
      {/* 1. Brand Logo Header */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <Ionicons name="school" size={20} color={colors.textWhite} />
          </View>
          {!collapsed ? (
            <View style={styles.brandTitles}>
              <Text style={styles.brandName}>SkillBridge</Text>
              <Text style={styles.brandRole}>ADMIN CONSOLE</Text>
            </View>
          ) : null}
        </View>

        {!collapsed ? (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>FIRESTORE LIVE</Text>
          </View>
        ) : null}
      </View>

      {/* 2. Menu Navigation Items */}
      <ScrollView style={styles.navScroll} showsVerticalScrollIndicator={false}>
        {menuSections.map((section, sIdx) => (
          <View key={sIdx} style={styles.sectionWrap}>
            {!collapsed ? (
              <Text style={styles.sectionHeader}>{section.title}</Text>
            ) : (
              <View style={styles.sectionDivider} />
            )}

            {section.items.map(item => {
              const isActive = activeTab === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.navItem,
                    isActive && styles.navItemActive,
                    collapsed && styles.navItemCollapsed
                  ]}
                  onPress={() => onSelectTab(item.key)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.iconBox,
                    isActive && styles.iconBoxActive
                  ]}>
                    <Ionicons 
                      name={isActive ? item.iconActive : item.icon} 
                      size={20} 
                      color={isActive ? colors.textWhite : colors.textSecondary} 
                    />
                  </View>

                  {!collapsed ? (
                    <View style={styles.itemTextWrap}>
                      <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                        {item.label}
                      </Text>
                      {item.badge ? (
                        <View style={[styles.badge, item.badgeAlert && styles.badgeAlert]}>
                          <Text style={[styles.badgeText, item.badgeAlert && styles.badgeAlertText]}>
                            {item.badge}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>

      {/* 3. Bottom Admin Profile Card & Collapse Toggle */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.profileRow, activeTab === 'Profile' && styles.profileRowActive]}
          onPress={() => onSelectTab('Profile')}
          activeOpacity={0.8}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarInitials}>
              {adminData?.avatarInitials || 'ME'}
            </Text>
          </View>
          {!collapsed ? (
            <View style={styles.profileInfo}>
              <Text style={styles.profileName} numberOfLines={1}>
                {adminData?.name || 'Manuel Elizondo'}
              </Text>
              <Text style={styles.profileEmail} numberOfLines={1}>
                {adminData?.email || 'manuel@harinaselizondo.com'}
              </Text>
            </View>
          ) : null}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.collapseBtn} 
          onPress={onToggleCollapse}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={collapsed ? "chevron-forward" : "chevron-back"} 
            size={18} 
            color={colors.textSecondary} 
          />
          {!collapsed ? (
            <Text style={styles.collapseText}>Collapse Sidebar</Text>
          ) : null}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 260,
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  sidebarCollapsed: {
    width: 76,
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.navy,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  brandTitles: {
    flex: 1,
  },
  brandName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  brandRole: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1.2,
    marginTop: 1,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 10,
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  liveText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.success,
    letterSpacing: 0.5,
  },
  navScroll: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 14,
  },
  sectionWrap: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.8,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 10,
    marginHorizontal: 10,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 4,
  },
  navItemActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  navItemCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  iconBox: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  iconBoxActive: {
    transform: [{ scale: 1.05 }],
  },
  itemTextWrap: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  navLabelActive: {
    color: colors.textWhite,
    fontWeight: '700',
  },
  badge: {
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  badgeAlert: {
    backgroundColor: colors.warningLight,
  },
  badgeAlertText: {
    color: colors.warning,
  },
  footer: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surfaceSubtle,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
    padding: 6,
    borderRadius: 8,
  },
  profileRowActive: {
    backgroundColor: '#EEF2FF',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.navy,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: colors.textWhite,
    fontSize: 12,
    fontWeight: '800',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  profileEmail: {
    fontSize: 11,
    color: colors.textMuted,
  },
  collapseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  collapseText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
