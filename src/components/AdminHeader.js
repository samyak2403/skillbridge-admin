import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

export default function AdminHeader({ 
  title = 'Admin Panel', 
  subtitle = 'SkillBridge Control Center',
  rightAction = null
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerInner}>
        <View>
          <View style={styles.brandRow}>
            <View style={styles.dot} />
            <Text style={styles.brandText}>SKILLBRIDGE ADMIN</Text>
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        <View style={styles.actions}>
          {rightAction}
          <View style={[styles.liveIndicator, rightAction && { marginLeft: 12 }]}>
            <View style={styles.greenDot} />
            <Text style={styles.liveText}>FIRESTORE LIVE</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginRight: 6,
  },
  brandText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
    marginRight: 6,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.success,
    letterSpacing: 0.5,
  },
});
