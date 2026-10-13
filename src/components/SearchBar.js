import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, ScrollView, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

export default function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search...',
  tabs = [],
  activeTab = '',
  onTabChange = () => {}
}) {
  return (
    <View style={styles.container}>
      <View style={styles.containerInner}>
        <View style={styles.inputWrap}>
          <Ionicons name="search" size={18} color={colors.textSecondary} style={styles.icon} />
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={colors.textMuted}
          />
          {value ? (
            <TouchableOpacity onPress={() => onChangeText('')} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {tabs.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
            {tabs.map(tab => {
              const isSelected = activeTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  onPress={() => onTabChange(tab)}
                  style={[styles.tab, isSelected && styles.tabActive]}
                >
                  <Text style={[styles.tabText, isSelected && styles.tabTextActive]}>
                    {tab}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    width: '100%',
  },
  containerInner: {
    maxWidth: 1400,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: colors.border,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
  },
  clearBtn: {
    padding: 4,
  },
  tabsRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.textWhite,
  },
});
