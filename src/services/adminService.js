import { 
  collection, 
  doc, 
  getDoc,
  getDocs, 
  updateDoc, 
  deleteDoc, 
  addDoc, 
  setDoc,
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  where 
} from 'firebase/firestore';
import { db } from '../config/firebase';

// ==========================================
// 1. USERS MANAGEMENT
// ==========================================
export const subscribeUsers = (onData, onError) => {
  try {
    const q = query(collection(db, 'users'));
    return onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      onData(users);
    }, (err) => {
      console.warn('Firestore users subscription notice:', err.message);
      if (onError) onError(err);
    });
  } catch (e) {
    console.error('Error subscribing to users:', e);
  }
};

export const updateUserVerification = async (userId, isVerified) => {
  const ref = doc(db, 'users', userId);
  await setDoc(ref, { 
    isVerified,
    verified: isVerified,
    updatedAt: Date.now() 
  }, { merge: true });

  // In-App Notification for User
  try {
    const notifRef = doc(collection(db, 'notifications'));
    await setDoc(notifRef, {
      notificationId: notifRef.id,
      userId,
      title: isVerified ? 'Verified Student Badge Granted! 🎓' : 'Verification Revoked ⚠️',
      body: isVerified 
        ? 'Congratulations! Your student account has been verified by the administrator. You now have the verified badge.'
        : 'Your verified student badge has been revoked by SkillBridge administration.',
      type: 'SYSTEM',
      relatedId: 'verification_badge',
      isRead: false,
      createdAt: Date.now()
    });
  } catch (err) {
    console.warn('Could not post verification notification:', err);
  }
};

export const updateUserRole = async (userId, userRole) => {
  const ref = doc(db, 'users', userId);
  return await setDoc(ref, { 
    userRole,
    updatedAt: Date.now() 
  }, { merge: true });
};

export const deleteUserDoc = async (userId) => {
  const ref = doc(db, 'users', userId);
  return await deleteDoc(ref);
};

export const updateUserDoc = async (userId, data) => {
  const ref = doc(db, 'users', userId);
  const payload = { ...data };
  if (payload.isVerified !== undefined) {
    payload.verified = payload.isVerified;
  }
  return await setDoc(ref, {
    ...payload,
    updatedAt: Date.now()
  }, { merge: true });
};

export const adjustUserWalletBalance = async (userId, amountDelta, reason = 'Admin Balance Adjustment') => {
  const numDelta = parseFloat(amountDelta) || 0;
  let newBalance = 0;

  // 1. Update user document walletBalance
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    const currentBalance = (snap.exists() && typeof snap.data()?.walletBalance === 'number') 
      ? snap.data().walletBalance 
      : 0;
    newBalance = Math.max(0, currentBalance + numDelta);
    await setDoc(userRef, {
      walletBalance: newBalance,
      updatedAt: Date.now()
    }, { merge: true });
  } catch (err) {
    console.warn('Warning updating user walletBalance field:', err);
  }
  
  // 2. Record ledger transaction
  await addDoc(collection(db, 'transactions'), {
    transactionId: `tx_admin_adj_${Date.now()}`,
    userId,
    amount: numDelta,
    currency: 'INR',
    transactionType: numDelta >= 0 ? 'EARNING' : 'WITHDRAWAL',
    paymentStatus: 'COMPLETED',
    providerReference: `ADMIN-ADJ-${Date.now()}`,
    description: reason,
    createdAt: Date.now()
  });

  // 3. Notify user
  await addDoc(collection(db, 'notifications'), {
    userId,
    title: numDelta >= 0 ? 'Wallet Credited by Admin' : 'Wallet Debited by Admin',
    body: `₹${Math.abs(numDelta)} INR was ${numDelta >= 0 ? 'credited to' : 'debited from'} your wallet. Reason: ${reason}`,
    type: 'PAYMENT',
    relatedId: 'admin_adj',
    isRead: false,
    createdAt: Date.now()
  });

  return { newBalance };
};

export const subscribeUserById = (userId, onData, onError) => {
  try {
    const userRef = doc(db, 'users', userId);
    return onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        onData({ id: snapshot.id, ...snapshot.data() });
      } else {
        onData(null);
      }
    }, (err) => {
      console.warn('Firestore user doc subscription notice:', err.message);
      if (onError) onError(err);
    });
  } catch (e) {
    console.error('Error subscribing to user doc:', e);
  }
};

export const sendNotificationToUser = async ({ userId, title, body, type = 'ADMIN' }) => {
  try {
    return await addDoc(collection(db, 'notifications'), {
      userId,
      title: title || 'Admin Message',
      body: body || 'Official message from SkillBridge Admin.',
      type,
      relatedId: 'admin_direct',
      isRead: false,
      createdAt: Date.now()
    });
  } catch (e) {
    console.error('Error sending user notification:', e);
    throw e;
  }
};

// ==========================================
// 2. PROJECTS MANAGEMENT
// ==========================================
export const subscribeProjects = (onData, onError) => {
  try {
    const q = query(collection(db, 'projects'));
    return onSnapshot(q, (snapshot) => {
      const projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      onData(projects);
    }, (err) => {
      console.warn('Firestore projects subscription notice:', err.message);
      if (onError) onError(err);
    });
  } catch (e) {
    console.error('Error subscribing to projects:', e);
  }
};

export const updateProjectStatus = async (projectId, status) => {
  const ref = doc(db, 'projects', projectId);
  return await updateDoc(ref, { 
    status,
    updatedAt: Date.now() 
  });
};

export const deleteProjectDoc = async (projectId) => {
  const ref = doc(db, 'projects', projectId);
  return await deleteDoc(ref);
};

export const createProjectDoc = async (projectData) => {
  const docRef = await addDoc(collection(db, 'projects'), {
    budgetType: 'Fixed',
    currency: 'INR',
    status: 'OPEN',
    proposalsCount: 0,
    ...projectData,
    createdAt: Date.now(),
    updatedAt: Date.now()
  });
  return docRef.id;
};

export const updateProjectDoc = async (projectId, projectData) => {
  const ref = doc(db, 'projects', projectId);
  return await updateDoc(ref, {
    ...projectData,
    updatedAt: Date.now()
  });
};

export const subscribeProjectById = (projectId, onData, onError) => {
  try {
    const projectRef = doc(db, 'projects', projectId);
    return onSnapshot(projectRef, (snapshot) => {
      if (snapshot.exists()) {
        onData({ id: snapshot.id, ...snapshot.data() });
      } else {
        onData(null);
      }
    }, (err) => {
      console.warn('Firestore project doc subscription notice:', err.message);
      if (onError) onError(err);
    });
  } catch (e) {
    console.error('Error subscribing to project doc:', e);
  }
};

// ==========================================
// 3. CONTRACTS / ASSIGNMENTS
// ==========================================
export const subscribeAssignments = (onData, onError) => {
  try {
    const q = query(collection(db, 'projectAssignments'));
    return onSnapshot(q, (snapshot) => {
      const assignments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      onData(assignments);
    }, (err) => {
      console.warn('Firestore assignments subscription notice:', err.message);
      if (onError) onError(err);
    });
  } catch (e) {
    console.error('Error subscribing to assignments:', e);
  }
};

export const releaseMilestonePayment = async ({
  assignmentId,
  milestoneId,
  amount,
  freelancerId,
  projectId,
  projectTitle
}) => {
  // 1. Record verified platform earning transaction
  await addDoc(collection(db, 'transactions'), {
    transactionId: `tx_admin_rel_${Date.now()}`,
    userId: freelancerId,
    projectId: projectId || '',
    projectTitle: projectTitle || 'Admin Escrow Release',
    amount: parseFloat(amount) || 0,
    currency: 'INR',
    transactionType: 'EARNING',
    paymentStatus: 'COMPLETED',
    providerReference: `ADMIN-ESCROW-${Date.now()}`,
    description: `Admin manual escrow release for ${projectTitle || 'assignment'}`,
    createdAt: Date.now()
  });

  // 2. Notify freelancer
  await addDoc(collection(db, 'notifications'), {
    userId: freelancerId,
    title: 'Milestone Released by Admin',
    body: `₹${amount} INR has been released to your SkillBridge wallet by platform admin.`,
    type: 'PAYMENT',
    relatedId: assignmentId,
    isRead: false,
    createdAt: Date.now()
  });
};

export const updateAssignmentStatus = async (assignmentId, status) => {
  const ref = doc(db, 'projectAssignments', assignmentId);
  return await updateDoc(ref, { 
    status,
    updatedAt: Date.now() 
  });
};

export const updateAssignmentDoc = async (assignmentId, assignmentData) => {
  const ref = doc(db, 'projectAssignments', assignmentId);
  return await updateDoc(ref, {
    ...assignmentData,
    updatedAt: Date.now()
  });
};

// ==========================================
// 4. TRANSACTIONS & PAYOUTS
// ==========================================
export const subscribeTransactions = (onData, onError) => {
  try {
    const q = query(collection(db, 'transactions'));
    return onSnapshot(q, (snapshot) => {
      const txns = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      onData(txns);
    }, (err) => {
      console.warn('Firestore transactions subscription notice:', err.message);
      if (onError) onError(err);
    });
  } catch (e) {
    console.error('Error subscribing to transactions:', e);
  }
};

export const approveWithdrawal = async (transactionId, userId, amount) => {
  const ref = doc(db, 'transactions', transactionId);
  await updateDoc(ref, { 
    paymentStatus: 'COMPLETED',
    description: 'Withdrawal processed and approved by Admin',
    updatedAt: Date.now()
  });

  await addDoc(collection(db, 'notifications'), {
    userId,
    title: 'Withdrawal Approved',
    body: `Your withdrawal of ₹${Math.abs(amount)} INR has been approved and sent to your bank account.`,
    type: 'PAYMENT',
    relatedId: transactionId,
    isRead: false,
    createdAt: Date.now()
  });
};

export const rejectWithdrawal = async (transactionId, userId, amount, reason) => {
  const ref = doc(db, 'transactions', transactionId);
  await updateDoc(ref, { 
    paymentStatus: 'REJECTED',
    description: `Withdrawal rejected: ${reason || 'Details could not be verified'}`,
    updatedAt: Date.now()
  });

  await addDoc(collection(db, 'notifications'), {
    userId,
    title: 'Withdrawal Request Update',
    body: `Your withdrawal request of ₹${Math.abs(amount)} INR was rejected. Reason: ${reason || 'Please verify your bank details.'}`,
    type: 'ALERT',
    relatedId: transactionId,
    isRead: false,
    createdAt: Date.now()
  });
};

export const createTransactionDoc = async (transactionData) => {
  const docRef = await addDoc(collection(db, 'transactions'), {
    transactionId: `tx_${Date.now()}`,
    currency: 'INR',
    paymentStatus: 'COMPLETED',
    transactionType: 'EARNING',
    amount: 0,
    ...transactionData,
    createdAt: Date.now()
  });
  return docRef.id;
};

export const updateTransactionDoc = async (transactionId, transactionData) => {
  const ref = doc(db, 'transactions', transactionId);
  return await updateDoc(ref, {
    ...transactionData,
    updatedAt: Date.now()
  });
};

export const deleteTransactionDoc = async (transactionId) => {
  const ref = doc(db, 'transactions', transactionId);
  return await deleteDoc(ref);
};

// ==========================================
// 5. PROPOSALS MANAGEMENT
// ==========================================
export const subscribeProposals = (onData, onError) => {
  try {
    const q = query(collection(db, 'proposals'));
    return onSnapshot(q, (snapshot) => {
      const proposals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      onData(proposals);
    }, (err) => {
      console.warn('Firestore proposals subscription notice:', err.message);
      if (onError) onError(err);
    });
  } catch (e) {
    console.error('Error subscribing to proposals:', e);
  }
};

export const updateProposalStatus = async (proposalId, status) => {
  const ref = doc(db, 'proposals', proposalId);
  return await updateDoc(ref, { 
    status,
    updatedAt: Date.now() 
  });
};

export const updateProposalDoc = async (proposalId, proposalData) => {
  const ref = doc(db, 'proposals', proposalId);
  return await updateDoc(ref, {
    ...proposalData,
    updatedAt: Date.now()
  });
};

export const deleteProposalDoc = async (proposalId) => {
  const ref = doc(db, 'proposals', proposalId);
  return await deleteDoc(ref);
};

export const subscribeProposalsByProject = (projectId, onData, onError) => {
  try {
    const q = query(collection(db, 'proposals'), where('projectId', '==', projectId));
    return onSnapshot(q, (snapshot) => {
      const proposals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      onData(proposals);
    }, (err) => {
      console.warn('Firestore proposals by project notice:', err.message);
      if (onError) onError(err);
    });
  } catch (e) {
    console.error('Error subscribing to project proposals:', e);
  }
};

// ==========================================
// 6. SYSTEM BROADCAST NOTIFICATIONS
// ==========================================
export const sendBroadcastNotification = async ({ title, body, targetRole = 'ALL' }) => {
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    const allUsers = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    const targets = allUsers.filter(u => {
      if (targetRole === 'ALL') return true;
      return u.userRole === targetRole;
    });

    const promises = targets.map(u => 
      addDoc(collection(db, 'notifications'), {
        userId: u.id,
        title: title || 'Admin Announcement',
        body: body || 'Official platform update from SkillBridge Admin.',
        type: 'SYSTEM',
        relatedId: 'admin_broadcast',
        isRead: false,
        createdAt: Date.now()
      })
    );

    await Promise.all(promises);
    return targets.length;
  } catch (e) {
    console.error('Error sending broadcast:', e);
    throw e;
  }
};

// ==========================================
// 7. REVIEWS MODERATION
// ==========================================
export const subscribeReviews = (onData, onError) => {
  try {
    const q = query(collection(db, 'reviews'));
    return onSnapshot(q, (snapshot) => {
      const reviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      onData(reviews);
    }, (err) => {
      console.warn('Firestore reviews subscription notice:', err.message);
      if (onError) onError(err);
    });
  } catch (e) {
    console.error('Error subscribing to reviews:', e);
  }
};

export const updateReviewDoc = async (reviewId, reviewData) => {
  const ref = doc(db, 'reviews', reviewId);
  return await updateDoc(ref, {
    ...reviewData,
    updatedAt: Date.now()
  });
};

export const deleteReviewDoc = async (reviewId) => {
  const ref = doc(db, 'reviews', reviewId);
  return await deleteDoc(ref);
};

// ==========================================
// 8. DISPUTES & ESCROW MEDIATION
// ==========================================
export const resolveDisputeRefundClient = async ({
  assignmentId,
  projectId,
  projectTitle = 'Disputed Contract',
  clientId,
  freelancerId,
  amount,
  reason
}) => {
  try {
    const numAmount = parseFloat(amount) || 0;
    
    // 1. Mark assignment as CANCELLED with dispute resolution notes
    const assignRef = doc(db, 'projectAssignments', assignmentId);
    await updateDoc(assignRef, {
      status: 'CANCELLED',
      disputeStatus: 'RESOLVED_REFUNDED',
      disputeResolutionNote: reason || 'Admin resolved dispute in favor of client refund.',
      updatedAt: Date.now()
    });

    // 2. If project exists, reset or cancel status
    if (projectId) {
      try {
        const projRef = doc(db, 'projects', projectId);
        await updateDoc(projRef, {
          status: 'CANCELLED',
          updatedAt: Date.now()
        });
      } catch (err) {
        console.warn('Project update notice during dispute resolution:', err);
      }
    }

    // 3. Record REFUND transaction for client
    await addDoc(collection(db, 'transactions'), {
      transactionId: `tx_dispute_ref_${Date.now()}`,
      userId: clientId,
      projectId: projectId || '',
      projectTitle,
      amount: numAmount,
      currency: 'INR',
      transactionType: 'REFUND',
      paymentStatus: 'COMPLETED',
      providerReference: `DISPUTE-REFUND-${Date.now()}`,
      description: `Escrow refund issued by Admin: ${reason || 'Project dispute resolved'}`,
      createdAt: Date.now()
    });

    // 4. Notify Client
    await addDoc(collection(db, 'notifications'), {
      userId: clientId,
      title: 'Dispute Resolved: Escrow Refunded',
      body: `₹${numAmount} INR escrow funds have been refunded to your account for "${projectTitle}". Reason: ${reason || 'Admin arbitration resolution'}`,
      type: 'PAYMENT',
      relatedId: assignmentId,
      isRead: false,
      createdAt: Date.now()
    });

    // 5. Notify Freelancer
    if (freelancerId) {
      await addDoc(collection(db, 'notifications'), {
        userId: freelancerId,
        title: 'Dispute Resolution Notice',
        body: `Contract for "${projectTitle}" has been cancelled by Admin arbitration. Escrow refunded to client. Note: ${reason || 'Deliverables did not satisfy requirements.'}`,
        type: 'ALERT',
        relatedId: assignmentId,
        isRead: false,
        createdAt: Date.now()
      });
    }

    return true;
  } catch (e) {
    console.error('Error resolving dispute with refund:', e);
    throw e;
  }
};

export const resolveDisputeReleaseFreelancer = async ({
  assignmentId,
  projectId,
  projectTitle = 'Disputed Contract',
  freelancerId,
  clientId,
  amount,
  reason
}) => {
  try {
    const numAmount = parseFloat(amount) || 0;

    // 1. Mark assignment as COMPLETED with dispute resolution notes
    const assignRef = doc(db, 'projectAssignments', assignmentId);
    await updateDoc(assignRef, {
      status: 'COMPLETED',
      disputeStatus: 'RESOLVED_RELEASED',
      disputeResolutionNote: reason || 'Admin resolved dispute in favor of student freelancer delivery.',
      completedAt: Date.now(),
      updatedAt: Date.now()
    });

    // 2. Record EARNING transaction for student freelancer
    await addDoc(collection(db, 'transactions'), {
      transactionId: `tx_dispute_rel_${Date.now()}`,
      userId: freelancerId,
      projectId: projectId || '',
      projectTitle,
      amount: numAmount,
      currency: 'INR',
      transactionType: 'EARNING',
      paymentStatus: 'COMPLETED',
      providerReference: `DISPUTE-RELEASE-${Date.now()}`,
      description: `Escrow released by Admin arbitration: ${reason || 'Verified milestone deliverable satisfaction'}`,
      createdAt: Date.now()
    });

    // 3. Notify Freelancer
    await addDoc(collection(db, 'notifications'), {
      userId: freelancerId,
      title: 'Dispute Resolved: Escrow Released! 🎉',
      body: `₹${numAmount} INR has been credited to your SkillBridge wallet by Admin arbitration for "${projectTitle}".`,
      type: 'PAYMENT',
      relatedId: assignmentId,
      isRead: false,
      createdAt: Date.now()
    });

    // 4. Notify Client
    if (clientId) {
      await addDoc(collection(db, 'notifications'), {
        userId: clientId,
        title: 'Dispute Resolution Notice',
        body: `Contract for "${projectTitle}" was verified by Admin and escrow released to freelancer. Resolution Note: ${reason || 'Milestone deliverables verified.'}`,
        type: 'PROJECT',
        relatedId: assignmentId,
        isRead: false,
        createdAt: Date.now()
      });
    }

    return true;
  } catch (e) {
    console.error('Error resolving dispute with release:', e);
    throw e;
  }
};

export const submitDisputeMediationNote = async (assignmentId, note, targetUserId) => {
  const assignRef = doc(db, 'projectAssignments', assignmentId);
  await updateDoc(assignRef, {
    adminMediationNote: note,
    updatedAt: Date.now()
  });

  if (targetUserId) {
    await addDoc(collection(db, 'notifications'), {
      userId: targetUserId,
      title: 'Official Admin Mediation Message',
      body: note,
      type: 'ALERT',
      relatedId: assignmentId,
      isRead: false,
      createdAt: Date.now()
    });
  }
};

// ==========================================
// 9. PLATFORM CONFIGURATION & SETTINGS
// ==========================================
export const subscribePlatformSettings = (onData, onError) => {
  try {
    const configRef = doc(db, 'settings', 'platformConfig');
    return onSnapshot(configRef, (snapshot) => {
      if (snapshot.exists()) {
        onData(snapshot.data());
      } else {
        // Return defaults
        onData({
          studentCommissionPercent: 0,
          clientFeePercent: 3,
          minProjectBudget: 500,
          disputeReviewWindowDays: 5,
          maintenanceMode: false,
          maintenanceMessage: 'SkillBridge is undergoing scheduled infrastructure maintenance.',
          allowedCollegeDomains: ['amietv.org', 'unipune.ac.in', 'iitb.ac.in', 'coep.ac.in', 'vjti.ac.in'],
          updatedAt: Date.now()
        });
      }
    }, (err) => {
      console.warn('Firestore settings subscription notice:', err.message);
      if (onError) onError(err);
    });
  } catch (e) {
    console.error('Error subscribing to platform settings:', e);
  }
};

export const updatePlatformSettings = async (settings) => {
  const configRef = doc(db, 'settings', 'platformConfig');
  return await setDoc(configRef, {
    ...settings,
    updatedAt: Date.now()
  }, { merge: true });
};

// ==========================================
// 10. CUSTOMER SUPPORT & TICKETS MANAGEMENT
// ==========================================
export const subscribeSupportTickets = (onData, onError) => {
  try {
    const q = query(collection(db, 'support_tickets'));
    return onSnapshot(q, (snapshot) => {
      const tickets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      tickets.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      onData(tickets);
    }, (err) => {
      console.warn('Firestore support_tickets subscription notice:', err.message);
      if (onError) onError(err);
    });
  } catch (e) {
    console.error('Error subscribing to support tickets:', e);
  }
};

export const updateSupportTicketStatus = async (ticketId, status, resolutionNote = '') => {
  const ref = doc(db, 'support_tickets', ticketId);
  const updateData = {
    status,
    updatedAt: Date.now()
  };
  if (resolutionNote) {
    updateData.resolutionNote = resolutionNote;
  }
  if (status === 'RESOLVED' || status === 'CLOSED') {
    updateData.resolvedAt = Date.now();
  }
  return await updateDoc(ref, updateData);
};

export const replyToSupportTicket = async (ticketId, { replyMessage, adminName = 'SkillBridge Support Team', newStatus = 'IN_PROGRESS', ticketData = null }) => {
  const ref = doc(db, 'support_tickets', ticketId);
  const currentSnap = await getDoc(ref);
  const currentData = currentSnap.exists() ? currentSnap.data() : (ticketData || {});
  
  const existingReplies = Array.isArray(currentData.replies) ? currentData.replies : [];
  const newReply = {
    id: `rep_${Date.now()}`,
    sender: 'ADMIN',
    authorName: adminName,
    message: replyMessage,
    createdAt: Date.now()
  };

  const updatedReplies = [...existingReplies, newReply];

  await updateDoc(ref, {
    replies: updatedReplies,
    status: newStatus,
    lastRepliedAt: Date.now(),
    lastReplyBy: adminName,
    updatedAt: Date.now()
  });

  const targetUserId = currentData.userId;
  if (targetUserId) {
    try {
      await addDoc(collection(db, 'notifications'), {
        userId: targetUserId,
        title: 'Customer Support Response',
        body: `Support team replied to "${currentData.subject || 'your ticket'}": ${replyMessage.slice(0, 100)}${replyMessage.length > 100 ? '...' : ''}`,
        type: 'SUPPORT',
        relatedId: ticketId,
        isRead: false,
        createdAt: Date.now()
      });
    } catch (notifErr) {
      console.warn('Failed to send support notification:', notifErr.message);
    }
  }

  return { success: true, reply: newReply };
};

export const createSupportTicketDoc = async (ticketData) => {
  const docRef = await addDoc(collection(db, 'support_tickets'), {
    status: ticketData.status || 'OPEN',
    priority: ticketData.priority || 'NORMAL',
    subject: ticketData.subject || 'Customer Inquiry',
    message: ticketData.message || '',
    userId: ticketData.userId || '',
    userEmail: ticketData.userEmail || '',
    userName: ticketData.userName || '',
    category: ticketData.category || 'General',
    isSuspensionAppeal: !!ticketData.isSuspensionAppeal,
    replies: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  });
  return docRef.id;
};

export const deleteSupportTicketDoc = async (ticketId) => {
  const ref = doc(db, 'support_tickets', ticketId);
  return await deleteDoc(ref);
};

export const handleTicketUserReactivate = async (ticketId, userId, note = 'Account reinstated via customer support appeal review', userEmail = null) => {
  let targetUid = userId;

  // Fallback: If userId is missing, search user by email
  if (!targetUid && userEmail) {
    try {
      const q = query(collection(db, 'users'), where('email', '==', userEmail.trim()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        targetUid = snap.docs[0].id;
      }
    } catch (e) {
      console.warn('Could not query user by email in handleTicketUserReactivate:', e.message);
    }
  }

  if (targetUid) {
    const userRef = doc(db, 'users', targetUid);
    await setDoc(userRef, {
      isSuspended: false,
      status: 'ACTIVE',
      suspensionReason: '',
      updatedAt: Date.now()
    }, { merge: true });

    try {
      await addDoc(collection(db, 'notifications'), {
        userId: targetUid,
        title: 'Account Reinstated Successfully',
        body: 'Your suspension appeal was accepted. Your account is now fully active on SkillBridge.',
        type: 'ACCOUNT',
        relatedId: ticketId,
        isRead: false,
        createdAt: Date.now()
      });
    } catch (err) {
      console.warn('Notification error on reactivation:', err.message);
    }
  }

  try {
    const ticketRef = doc(db, 'support_tickets', ticketId);
    await updateDoc(ticketRef, {
      status: 'RESOLVED',
      resolutionNote: note,
      resolvedAt: Date.now(),
      updatedAt: Date.now()
    });
  } catch (err) {
    console.warn('Could not update ticket resolution metadata:', err.message);
  }

  await replyToSupportTicket(ticketId, {
    replyMessage: `Account Reinstated: Your account has been reviewed by customer support and reactivated. ${note}`,
    newStatus: 'RESOLVED'
  });
};


