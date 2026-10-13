import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

export default function StatCard({ 
  title, 
  value, 
  subtext, 
  icon = 'analytics', 
  color = colors.primary,
  trend = ''
}) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon} size={22} color={color} />
        </View>
        {trend ? (
          <View style={styles.trendBadge}>
            <Text style={styles.trendText}>{trend}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtext ? <Text style={styles.subtext}>{subtext}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    flex: 1,
    minWidth: 150,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendBadge: {
    backgroundColor: colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.success,
  },
  value: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  subtext: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
});
