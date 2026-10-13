import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert,
  Modal,
  ScrollView,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import AdminHeader from '../components/AdminHeader';
import SearchBar from '../components/SearchBar';
import { 
  subscribeReviews, 
  deleteReviewDoc,
  updateReviewDoc 
} from '../services/adminService';

export default function ReviewsScreen() {
  const [reviews, setReviews] = useState([]);
  const [search, setSearch] = useState('');

  // Edit Review State
  const [editingReview, setEditingReview] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');
  const [savingReview, setSavingReview] = useState(false);

  useEffect(() => {
    const unsub = subscribeReviews(data => setReviews(data));
    return () => { if (unsub) unsub(); };
  }, []);

  const filteredReviews = reviews.filter(r => {
    return (r.comment || '').toLowerCase().includes(search.toLowerCase()) ||
           (r.reviewerName || '').toLowerCase().includes(search.toLowerCase()) ||
           (r.projectTitle || '').toLowerCase().includes(search.toLowerCase());
  });

  const handleOpenEditReview = (rev) => {
    setEditingReview(rev);
    setEditRating(rev.rating || 5);
    setEditComment(rev.comment || '');
  };

  const handleSaveEditReview = async () => {
    if (!editComment.trim()) {
      Alert.alert('Required', 'Review comment cannot be empty.');
      return;
    }
    setSavingReview(true);
    try {
      await updateReviewDoc(editingReview.id, {
        rating: editRating,
        comment: editComment.trim()
      });
      setSavingReview(false);
      setEditingReview(null);
      Alert.alert('Success', 'Review updated successfully.');
    } catch (e) {
      setSavingReview(false);
      Alert.alert('Error', e.message);
    }
  };

  const handleDeleteReview = (rev) => {
    Alert.alert(
      'Moderate Review',
      'Are you sure you want to delete this review from the public profile?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteReviewDoc(rev.id);
              Alert.alert('Review Removed', 'The review was removed successfully.');
            } catch (e) {
              Alert.alert('Error', e.message);
            }
          }
        }
      ]
    );
  };

  const renderReviewItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.authorInfo}>
          <Text style={styles.authorName}>{item.reviewerName || 'Client / Freelancer'}</Text>
          <Text style={styles.projectTitle}>{item.projectTitle || 'Assignment Review'}</Text>
        </View>

        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={14} color="#F59E0B" />
          <Text style={styles.ratingText}>{item.rating || 5}.0</Text>
        </View>
      </View>

      <Text style={styles.comment}>{item.comment || 'No review comment text.'}</Text>

      <View style={styles.cardFooter}>
        <Text style={styles.dateText}>
          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent'}
        </Text>

        <View style={styles.cardActions}>
          <TouchableOpacity 
            style={styles.editBtn}
            onPress={() => handleOpenEditReview(item)}
          >
            <Ionicons name="create-outline" size={14} color={colors.primary} />
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.deleteBtn}
            onPress={() => handleDeleteReview(item)}
          >
            <Ionicons name="trash-outline" size={14} color={colors.danger} />
            <Text style={styles.deleteBtnText}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <AdminHeader title="Reviews Moderation" subtitle={`${filteredReviews.length} User Reviews`} />

      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder="Search reviews by comment, author, project..."
      />

      <FlatList
        data={filteredReviews}
        keyExtractor={item => item.id}
        renderItem={renderReviewItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="star-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No reviews found</Text>
            <Text style={styles.emptySub}>All reviews are compliant or no records exist.</Text>
          </View>
        }
      />

      {/* Edit Review Modal */}
      <Modal visible={!!editingReview} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 500 }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Edit Review</Text>
                <Text style={styles.modalSub}>ID: {editingReview?.id}</Text>
              </View>
              <TouchableOpacity onPress={() => setEditingReview(null)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {editingReview ? (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <Text style={styles.formLabel}>Rating Score</Text>
                <View style={styles.ratingPickerRow}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <TouchableOpacity
                      key={star}
                      style={[styles.starBtn, editRating >= star && styles.starBtnActive]}
                      onPress={() => setEditRating(star)}
                    >
                      <Ionicons 
                        name={editRating >= star ? "star" : "star-outline"} 
                        size={22} 
                        color={editRating >= star ? "#F59E0B" : colors.textMuted} 
                      />
                      <Text style={[styles.starText, editRating >= star && styles.starTextActive]}>
                        {star}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.formLabel}>Review Comment *</Text>
                <TextInput
                  style={[styles.formInput, { height: 100, textAlignVertical: 'top' }]}
                  value={editComment}
                  onChangeText={setEditComment}
                  placeholder="Review feedback text..."
                  multiline
                />

                <View style={styles.editModalActions}>
                  <TouchableOpacity 
                    style={styles.cancelBtn} 
                    onPress={() => setEditingReview(null)}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.saveBtn, savingReview && { opacity: 0.7 }]} 
                    onPress={handleSaveEditReview}
                    disabled={savingReview}
                  >
                    {savingReview ? (
                      <ActivityIndicator size="small" color={colors.textWhite} />
                    ) : (
                      <>
                        <Ionicons name="save-outline" size={16} color={colors.textWhite} />
                        <Text style={styles.saveBtnText}>Save Review</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    maxWidth: 1400,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 48,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  authorInfo: {
    flex: 1,
    marginRight: 8,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  projectTitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D97706',
  },
  comment: {
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 18,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.surfaceSubtle,
    paddingTop: 10,
  },
  dateText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deleteBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.danger,
  },
  emptyWrap: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    maxHeight: '85%',
    padding: 20,
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modalSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  modalBody: {
    marginBottom: 10,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
    marginTop: 10,
  },
  ratingPickerRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  starBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  starBtnActive: {
    borderColor: '#F59E0B',
    backgroundColor: '#FEF3C7',
  },
  starText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
  },
  starTextActive: {
    color: '#D97706',
  },
  formInput: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.textPrimary,
  },
  editModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
    marginBottom: 10,
  },
  cancelBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSubtle,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.primary,
    gap: 6,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textWhite,
  },
});

