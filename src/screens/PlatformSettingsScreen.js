import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Switch, 
  Alert, 
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import AdminHeader from '../components/AdminHeader';
import { 
  subscribePlatformSettings, 
  updatePlatformSettings 
} from '../services/adminService';

export default function PlatformSettingsScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Platform Fee Settings
  const [studentCommission, setStudentCommission] = useState('0');
  const [clientFee, setClientFee] = useState('3');
  const [minBudget, setMinBudget] = useState('500');
  const [disputeDays, setDisputeDays] = useState('5');

  // Maintenance Mode
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');

  // Allowed University Domains
  const [domains, setDomains] = useState([
    'amietv.org', 
    'unipune.ac.in', 
    'iitb.ac.in', 
    'coep.ac.in', 
    'vjti.ac.in'
  ]);
  const [newDomain, setNewDomain] = useState('');

  useEffect(() => {
    const unsub = subscribePlatformSettings((config) => {
      if (config) {
        setStudentCommission(String(config.studentCommissionPercent ?? 0));
        setClientFee(String(config.clientFeePercent ?? 3));
        setMinBudget(String(config.minProjectBudget ?? 500));
        setDisputeDays(String(config.disputeReviewWindowDays ?? 5));
        setMaintenanceMode(!!config.maintenanceMode);
        setMaintenanceMessage(config.maintenanceMessage || 'SkillBridge is currently undergoing scheduled platform maintenance.');
        if (Array.isArray(config.allowedCollegeDomains)) {
          setDomains(config.allowedCollegeDomains);
        }
      }
      setLoading(false);
    });

    return () => { if (unsub) unsub(); };
  }, []);

  const handleAddDomain = () => {
    const clean = newDomain.trim().toLowerCase().replace('@', '');
    if (!clean) return;
    if (domains.includes(clean)) {
      Alert.alert('Notice', 'Domain is already in the campus whitelist.');
      return;
    }
    setDomains([...domains, clean]);
    setNewDomain('');
  };

  const handleRemoveDomain = (domToRemove) => {
    setDomains(domains.filter(d => d !== domToRemove));
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await updatePlatformSettings({
        studentCommissionPercent: parseFloat(studentCommission) || 0,
        clientFeePercent: parseFloat(clientFee) || 0,
        minProjectBudget: parseFloat(minBudget) || 500,
        disputeReviewWindowDays: parseInt(disputeDays, 10) || 5,
        maintenanceMode,
        maintenanceMessage,
        allowedCollegeDomains: domains
      });
      setSaving(false);
      Alert.alert('Settings Saved', 'Platform configuration successfully synced to Firestore.');
    } catch (err) {
      setSaving(false);
      Alert.alert('Error', err.message);
    }
  };

  return (
    <View style={styles.container}>
      <AdminHeader 
        title="Platform Settings" 
        subtitle="Global Policies, Campus Whitelist & System Configuration" 
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Fetching Platform Settings...</Text>
          </View>
        ) : null}

        {/* 1. Commission & Escrow Economics */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.cardTitle}>Marketplace Economics & Fees</Text>
              <Text style={styles.cardSubtitle}>
                Control platform commissions, escrow margins, and minimum job listings
              </Text>
            </View>
            <View style={styles.iconBadge}>
              <Ionicons name="cash" size={20} color={colors.primary} />
            </View>
          </View>

          <View style={styles.fieldsGrid}>
            <View style={styles.fieldCol}>
              <Text style={styles.fieldLabel}>Student Commission (%)</Text>
              <TextInput
                style={styles.input}
                value={studentCommission}
                onChangeText={setStudentCommission}
                keyboardType="numeric"
                placeholder="0"
              />
              <Text style={styles.fieldHint}>
                SkillBridge policy: 0% fee ensures students keep 100% of earnings.
              </Text>
            </View>

            <View style={styles.fieldCol}>
              <Text style={styles.fieldLabel}>Client Escrow Processing Fee (%)</Text>
              <TextInput
                style={styles.input}
                value={clientFee}
                onChangeText={setClientFee}
                keyboardType="numeric"
                placeholder="3"
              />
              <Text style={styles.fieldHint}>
                Fee billed to clients for payment gateway and escrow handling.
              </Text>
            </View>

            <View style={styles.fieldCol}>
              <Text style={styles.fieldLabel}>Minimum Project Budget (₹ INR)</Text>
              <TextInput
                style={styles.input}
                value={minBudget}
                onChangeText={setMinBudget}
                keyboardType="numeric"
                placeholder="500"
              />
              <Text style={styles.fieldHint}>
                Prevents ultra micro-exploitative postings on campus.
              </Text>
            </View>

            <View style={styles.fieldCol}>
              <Text style={styles.fieldLabel}>Dispute Auto-Escalation Window (Days)</Text>
              <TextInput
                style={styles.input}
                value={disputeDays}
                onChangeText={setDisputeDays}
                keyboardType="numeric"
                placeholder="5"
              />
              <Text style={styles.fieldHint}>
                Days allowed before stalled reviews automatically flag to admin.
              </Text>
            </View>
          </View>
        </View>

        {/* 2. Campus & University Domain Whitelist */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.cardTitle}>Verified Campus Whitelist</Text>
              <Text style={styles.cardSubtitle}>
                Institutional email domains eligible for student verification badges
              </Text>
            </View>
            <View style={[styles.iconBadge, { backgroundColor: colors.success + '15' }]}>
              <Ionicons name="school" size={20} color={colors.success} />
            </View>
          </View>

          <View style={styles.domainsWrap}>
            {domains.map((dom, idx) => (
              <View key={idx} style={styles.domainPill}>
                <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                <Text style={styles.domainText}>@{dom}</Text>
                <TouchableOpacity onPress={() => handleRemoveDomain(dom)} style={styles.domainRemove}>
                  <Ionicons name="close" size={14} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <View style={styles.addDomainRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={newDomain}
              onChangeText={setNewDomain}
              placeholder="e.g. polytechnic.edu or amietv.org"
              placeholderTextColor={colors.textMuted}
            />
            <TouchableOpacity style={styles.addDomainBtn} onPress={handleAddDomain}>
              <Ionicons name="add" size={18} color={colors.textWhite} />
              <Text style={styles.addDomainBtnText}>Add Campus</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. Platform Maintenance & Announcements */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.cardTitle}>Maintenance Mode & Outage Alert</Text>
              <Text style={styles.cardSubtitle}>
                Temporarily pause new project bids and contract creation
              </Text>
            </View>
            <Switch
              value={maintenanceMode}
              onValueChange={setMaintenanceMode}
              trackColor={{ false: colors.border, true: colors.warning }}
              thumbColor={colors.surface}
            />
          </View>

          {maintenanceMode ? (
            <View style={styles.maintenanceAlertBox}>
              <Ionicons name="warning" size={20} color={colors.warning} />
              <Text style={styles.maintenanceAlertText}>
                Maintenance mode is active! A broadcast notice will be visible in the mobile app.
              </Text>
            </View>
          ) : null}

          <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Custom Maintenance Notice</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={maintenanceMessage}
            onChangeText={setMaintenanceMessage}
            placeholder="Notice text displayed to users..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* 4. System Health & Infrastructure Diagnostics */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>System Infrastructure Diagnostics</Text>
          <Text style={styles.cardSubtitle}>Cloud infrastructure connection details</Text>

          <View style={styles.diagRow}>
            <View style={styles.diagItem}>
              <Text style={styles.diagLabel}>Firebase Firestore:</Text>
              <View style={styles.diagStatus}>
                <View style={styles.greenDot} />
                <Text style={styles.diagStatusText}>Connected (Live Realtime)</Text>
              </View>
            </View>

            <View style={styles.diagItem}>
              <Text style={styles.diagLabel}>Firebase Authentication:</Text>
              <View style={styles.diagStatus}>
                <View style={styles.greenDot} />
                <Text style={styles.diagStatusText}>Operational</Text>
              </View>
            </View>

            <View style={styles.diagItem}>
              <Text style={styles.diagLabel}>Security Rules:</Text>
              <View style={styles.diagStatus}>
                <View style={styles.greenDot} />
                <Text style={styles.diagStatusText}>Active (Role Isolated)</Text>
              </View>
            </View>

            <View style={styles.diagItem}>
              <Text style={styles.diagLabel}>Admin Console Version:</Text>
              <Text style={styles.diagVal}>SkillBridge v1.0.0-PROD</Text>
            </View>
          </View>
        </View>

        {/* Save Changes Floating / Bottom Button */}
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSaveSettings}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.textWhite} />
          ) : (
            <>
              <Ionicons name="cloud-upload" size={18} color={colors.textWhite} />
              <Text style={styles.saveBtnText}>Save & Sync Configuration</Text>
            </>
          )}
        </TouchableOpacity>
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
    paddingVertical: 16,
  },
  loadingText: {
    marginTop: 8,
    color: colors.textSecondary,
    fontSize: 13,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    maxWidth: 480,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fieldsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  fieldCol: {
    flex: 1,
    minWidth: 260,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  fieldHint: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
  input: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  domainsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  domainPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  domainText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  domainRemove: {
    padding: 2,
  },
  addDomainRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  addDomainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.navy,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 10,
  },
  addDomainBtnText: {
    color: colors.textWhite,
    fontSize: 13,
    fontWeight: '700',
  },
  maintenanceAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.warningLight,
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  maintenanceAlertText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  diagRow: {
    marginTop: 12,
    gap: 10,
  },
  diagItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSubtle,
  },
  diagLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  diagStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  diagStatusText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.success,
  },
  diagVal: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  saveBtnText: {
    color: colors.textWhite,
    fontSize: 14,
    fontWeight: '800',
  },
});
