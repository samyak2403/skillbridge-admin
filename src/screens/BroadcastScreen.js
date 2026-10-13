import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ScrollView,
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import AdminHeader from '../components/AdminHeader';
import { sendBroadcastNotification } from '../services/adminService';

export default function BroadcastScreen() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetRole, setTargetRole] = useState('ALL');
  const [sending, setSending] = useState(false);

  const targets = [
    { label: 'All Platform Users', value: 'ALL', icon: 'people' },
    { label: 'Freelancers Only', value: 'FREELANCER', icon: 'school' },
    { label: 'Clients Only', value: 'CLIENT', icon: 'business' },
  ];

  const templates = [
    {
      title: 'Platform Maintenance Notice',
      body: 'SkillBridge services will undergo scheduled performance optimization tonight between 2:00 AM - 3:00 AM IST. All contracts remain secure.'
    },
    {
      title: 'Fast Milestone Payout Notice',
      body: 'Reminder: Promptly approve submitted deliverables to release milestone payments to student freelancers.'
    },
    {
      title: 'New Campus Gigs Available',
      body: 'Check out newly posted mobile, web, and design projects from top verified client startups!'
    }
  ];

  const applyTemplate = (t) => {
    setTitle(t.title);
    setBody(t.body);
  };

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert('Incomplete Form', 'Please enter both an announcement title and message body.');
      return;
    }

    Alert.alert(
      'Confirm Broadcast',
      `Send broadcast notification to ${targetRole === 'ALL' ? 'ALL USERS' : targetRole + 'S'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Broadcast',
          onPress: async () => {
            setSending(true);
            try {
              const count = await sendBroadcastNotification({
                title: title.trim(),
                body: body.trim(),
                targetRole
              });
              Alert.alert('Broadcast Sent', `Notification successfully dispatched to ${count} users.`);
              setTitle('');
              setBody('');
            } catch (e) {
              Alert.alert('Error', e.message);
            } finally {
              setSending(false);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <AdminHeader title="Push Announcements" subtitle="Send In-App Broadcasts to Users" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Target Audience Picker */}
        <Text style={styles.sectionTitle}>1. Target Audience</Text>
        <View style={styles.targetRow}>
          {targets.map(t => {
            const isSelected = targetRole === t.value;
            return (
              <TouchableOpacity
                key={t.value}
                style={[styles.targetBtn, isSelected && styles.targetBtnActive]}
                onPress={() => setTargetRole(t.value)}
              >
                <Ionicons 
                  name={t.icon} 
                  size={18} 
                  color={isSelected ? colors.textWhite : colors.textSecondary} 
                />
                <Text style={[styles.targetBtnText, isSelected && styles.targetBtnTextActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Quick Templates */}
        <Text style={styles.sectionTitle}>2. Quick Templates</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.templateRow}>
          {templates.map((tpl, i) => (
            <TouchableOpacity 
              key={i} 
              style={styles.templateCard} 
              onPress={() => applyTemplate(tpl)}
            >
              <Text style={styles.templateTitle} numberOfLines={1}>{tpl.title}</Text>
              <Text style={styles.templateDesc} numberOfLines={2}>{tpl.body}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Message Composition */}
        <Text style={styles.sectionTitle}>3. Compose Announcement</Text>
        <View style={styles.formCard}>
          <Text style={styles.inputLabel}>NOTIFICATION TITLE</Text>
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Scheduled Maintenance or New Policy"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.inputLabel}>MESSAGE BODY</Text>
          <TextInput
            style={styles.bodyInput}
            value={body}
            onChangeText={setBody}
            placeholder="Write clear, informative message for campus users..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <TouchableOpacity 
            style={[styles.sendBtn, sending && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={sending}
          >
            {sending ? (
              <ActivityIndicator color={colors.textWhite} size="small" />
            ) : (
              <>
                <Ionicons name="send" size={18} color={colors.textWhite} />
                <Text style={styles.sendBtnText}>Dispatch In-App Broadcast</Text>
              </>
            )}
          </TouchableOpacity>
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
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 10,
    marginTop: 8,
  },
  targetRow: {
    gap: 8,
    marginBottom: 16,
  },
  targetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  targetBtnActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  targetBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  targetBtnTextActive: {
    color: colors.textWhite,
  },
  templateRow: {
    gap: 10,
    marginBottom: 16,
  },
  templateCard: {
    width: 220,
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  templateTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  templateDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 15,
  },
  formCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  titleInput: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  bodyInput: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 10,
    padding: 12,
    minHeight: 100,
    fontSize: 14,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 18,
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  sendBtnDisabled: {
    opacity: 0.6,
  },
  sendBtnText: {
    color: colors.textWhite,
    fontSize: 14,
    fontWeight: '700',
  },
});
