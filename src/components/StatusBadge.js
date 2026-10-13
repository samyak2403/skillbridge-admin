import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export default function StatusBadge({ label = '', variant = 'default', size = 'normal' }) {
  const normalized = String(label).toUpperCase();

  let bg = colors.surfaceSubtle;
  let text = colors.textSecondary;

  switch (normalized) {
    case 'VERIFIED':
    case 'COMPLETED':
    case 'ACTIVE':
    case 'ACCEPTED':
    case 'PAID':
    case 'RESOLVED':
    case 'FREELANCER':
      bg = colors.successLight;
      text = colors.success;
      break;

    case 'OPEN':
    case 'CLIENT':
    case 'IN_PROGRESS':
    case 'EARNING':
      bg = colors.infoLight;
      text = colors.primary;
      break;

    case 'SHORTLISTED':
    case 'VIEWED':
      bg = colors.purpleLight;
      text = colors.purple;
      break;

    case 'PENDING':
    case 'SUBMITTED':
    case 'UPCOMING':
    case 'WITHDRAWAL':
    case 'ESCROW':
    case 'REVISION_REQUESTED':
      bg = colors.warningLight;
      text = colors.warning;
      break;

    case 'REJECTED':
    case 'UNVERIFIED':
    case 'CANCELLED':
    case 'SUSPENDED':
    case 'BANNED':
    case 'DISPUTED':
    case 'REFUND':
    case 'REFUNDED':
    case 'WITHDRAWN':
      bg = colors.dangerLight;
      text = colors.danger;
      break;

    case 'ADMIN':
      bg = colors.purpleLight;
      text = colors.purple;
      break;

    default:
      bg = colors.surfaceSubtle;
      text = colors.textSecondary;
  }

  const isSmall = size === 'small';

  return (
    <View style={[styles.badge, { backgroundColor: bg }, isSmall && styles.badgeSmall]}>
      <Text style={[styles.text, { color: text }, isSmall && styles.textSmall]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  textSmall: {
    fontSize: 10,
    fontWeight: '600',
  },
});
