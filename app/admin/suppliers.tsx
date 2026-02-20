import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, TextInput, Modal, ScrollView, Alert
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Search, CheckCircle, XCircle, Clock, Eye, ChevronDown } from 'lucide-react-native';

type Supplier = {
  id: string;
  user_id: string;
  business_name: string;
  registration_number: string | null;
  kyc_status: string;
  commission_rate: number;
  created_at: string;
  rejection_reason: string | null;
  profiles: { full_name: string; email: string; phone: string | null } | null;
  kyc_documents: Array<{ id: string; document_type: string; document_url: string; status: string }>;
};

const STATUS_COLORS: Record<string, string> = {
  approved: '#10B981',
  rejected: '#EF4444',
  pending: '#F59E0B',
  under_review: '#3B82F6',
};

const STATUS_BG: Record<string, string> = {
  approved: '#ECFDF5',
  rejected: '#FEF2F2',
  pending: '#FFFBEB',
  under_review: '#EFF6FF',
};

export default function AdminSuppliersScreen() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  useEffect(() => {
    fetchSuppliers();
  }, [filter]);

  const fetchSuppliers = async () => {
    setLoading(true);
    let query = supabase
      .from('suppliers')
      .select(`
        id, user_id, business_name, registration_number, kyc_status,
        commission_rate, created_at, rejection_reason,
        profiles!suppliers_user_id_fkey (full_name, email, phone),
        kyc_documents (id, document_type, document_url, status)
      `)
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('kyc_status', filter);
    }

    const { data } = await query;
    setSuppliers((data as any) || []);
    setLoading(false);
  };

  const handleApprove = async (supplier: Supplier) => {
    setActionLoading(true);
    const { error } = await supabase
      .from('suppliers')
      .update({ kyc_status: 'approved', reviewed_at: new Date().toISOString(), rejection_reason: null })
      .eq('id', supplier.id);

    if (!error) {
      await supabase.from('notifications').insert({
        user_id: supplier.user_id,
        title: 'KYC Approved',
        message: 'Your supplier account has been approved. You can now list products.',
        type: 'success',
        related_type: 'kyc',
      });
      fetchSuppliers();
      setSelectedSupplier(null);
    } else {
      Alert.alert('Error', error.message);
    }
    setActionLoading(false);
  };

  const handleReject = async (supplier: Supplier) => {
    if (!rejectionReason.trim()) {
      Alert.alert('Required', 'Please provide a rejection reason');
      return;
    }
    setActionLoading(true);
    const { error } = await supabase
      .from('suppliers')
      .update({
        kyc_status: 'rejected',
        rejection_reason: rejectionReason.trim(),
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', supplier.id);

    if (!error) {
      await supabase.from('notifications').insert({
        user_id: supplier.user_id,
        title: 'KYC Review Update',
        message: `Your KYC application was not approved. Reason: ${rejectionReason.trim()}`,
        type: 'error',
        related_type: 'kyc',
      });
      fetchSuppliers();
      setSelectedSupplier(null);
      setRejectionReason('');
      setShowRejectInput(false);
    } else {
      Alert.alert('Error', error.message);
    }
    setActionLoading(false);
  };

  const handleSetUnderReview = async (supplier: Supplier) => {
    setActionLoading(true);
    await supabase
      .from('suppliers')
      .update({ kyc_status: 'under_review' })
      .eq('id', supplier.id);
    fetchSuppliers();
    setActionLoading(false);
  };

  const filtered = suppliers.filter((s) => {
    const name = s.business_name?.toLowerCase() || '';
    const email = (s.profiles as any)?.email?.toLowerCase() || '';
    const q = search.toLowerCase();
    return name.includes(q) || email.includes(q);
  });

  const filterTabs = ['all', 'pending', 'under_review', 'approved', 'rejected'];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Supplier Management</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchBar}>
        <Search size={18} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search suppliers..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
        {filterTabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterTab, filter === tab && styles.filterTabActive]}
            onPress={() => setFilter(tab)}
          >
            <Text style={[styles.filterTabText, filter === tab && styles.filterTabTextActive]}>
              {tab === 'under_review' ? 'Under Review' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#1E40AF" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.emptyText}>No suppliers found</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => setSelectedSupplier(item)}>
              <View style={styles.cardTop}>
                <View style={styles.cardAvatar}>
                  <Text style={styles.cardAvatarText}>{item.business_name?.charAt(0) || 'S'}</Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{item.business_name}</Text>
                  <Text style={styles.cardEmail}>{(item.profiles as any)?.email}</Text>
                  <Text style={styles.cardDate}>Joined {new Date(item.created_at).toLocaleDateString()}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: STATUS_BG[item.kyc_status] || '#F3F4F6' }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLORS[item.kyc_status] || '#6B7280' }]}>
                    {item.kyc_status === 'under_review' ? 'Review' : item.kyc_status}
                  </Text>
                </View>
              </View>
              <View style={styles.cardDocs}>
                <Text style={styles.cardDocsText}>{item.kyc_documents?.length || 0} documents</Text>
                <View style={styles.viewDetailRow}>
                  <Eye size={14} color="#3B82F6" />
                  <Text style={styles.viewDetailText}>View Details</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      <Modal visible={!!selectedSupplier} animationType="slide" onRequestClose={() => { setSelectedSupplier(null); setShowRejectInput(false); setRejectionReason(''); }}>
        {selectedSupplier && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => { setSelectedSupplier(null); setShowRejectInput(false); setRejectionReason(''); }}>
                <ArrowLeft size={24} color="#111827" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Supplier Details</Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Business Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Business Name</Text>
                  <Text style={styles.detailValue}>{selectedSupplier.business_name}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Contact Name</Text>
                  <Text style={styles.detailValue}>{(selectedSupplier.profiles as any)?.full_name}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email</Text>
                  <Text style={styles.detailValue}>{(selectedSupplier.profiles as any)?.email}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Phone</Text>
                  <Text style={styles.detailValue}>{(selectedSupplier.profiles as any)?.phone || 'N/A'}</Text>
                </View>
                {selectedSupplier.registration_number && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Reg. Number</Text>
                    <Text style={styles.detailValue}>{selectedSupplier.registration_number}</Text>
                  </View>
                )}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Commission Rate</Text>
                  <Text style={styles.detailValue}>{selectedSupplier.commission_rate}%</Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>KYC Status</Text>
                <View style={[styles.kycStatusBadge, { backgroundColor: STATUS_BG[selectedSupplier.kyc_status] }]}>
                  <Text style={[styles.kycStatusText, { color: STATUS_COLORS[selectedSupplier.kyc_status] }]}>
                    {selectedSupplier.kyc_status.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
                {selectedSupplier.rejection_reason && (
                  <View style={styles.rejectionBox}>
                    <Text style={styles.rejectionLabel}>Previous Rejection Reason:</Text>
                    <Text style={styles.rejectionText}>{selectedSupplier.rejection_reason}</Text>
                  </View>
                )}
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Documents ({selectedSupplier.kyc_documents?.length || 0})</Text>
                {selectedSupplier.kyc_documents?.length > 0 ? (
                  selectedSupplier.kyc_documents.map((doc) => (
                    <View key={doc.id} style={styles.docRow}>
                      <View style={styles.docInfo}>
                        <Text style={styles.docType}>{doc.document_type.replace(/_/g, ' ')}</Text>
                        <Text style={styles.docStatus}>{doc.status}</Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noDocsText}>No documents uploaded yet</Text>
                )}
              </View>

              {showRejectInput && (
                <View style={styles.rejectInputSection}>
                  <Text style={styles.rejectInputLabel}>Rejection Reason *</Text>
                  <TextInput
                    style={styles.rejectInput}
                    placeholder="Explain why the KYC is rejected..."
                    value={rejectionReason}
                    onChangeText={setRejectionReason}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              )}

              <View style={styles.actionButtons}>
                {selectedSupplier.kyc_status === 'pending' && (
                  <TouchableOpacity
                    style={styles.reviewBtn}
                    onPress={() => handleSetUnderReview(selectedSupplier)}
                    disabled={actionLoading}
                  >
                    <Clock size={18} color="#1E40AF" />
                    <Text style={styles.reviewBtnText}>Mark Under Review</Text>
                  </TouchableOpacity>
                )}

                {(selectedSupplier.kyc_status === 'pending' || selectedSupplier.kyc_status === 'under_review') && (
                  <>
                    <TouchableOpacity
                      style={styles.approveBtn}
                      onPress={() => handleApprove(selectedSupplier)}
                      disabled={actionLoading}
                    >
                      {actionLoading ? <ActivityIndicator color="#FFF" size="small" /> : <CheckCircle size={18} color="#FFF" />}
                      <Text style={styles.approveBtnText}>Approve</Text>
                    </TouchableOpacity>

                    {!showRejectInput ? (
                      <TouchableOpacity
                        style={styles.rejectBtn}
                        onPress={() => setShowRejectInput(true)}
                        disabled={actionLoading}
                      >
                        <XCircle size={18} color="#EF4444" />
                        <Text style={styles.rejectBtnText}>Reject</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.rejectBtnFilled}
                        onPress={() => handleReject(selectedSupplier)}
                        disabled={actionLoading}
                      >
                        {actionLoading ? <ActivityIndicator color="#FFF" size="small" /> : <XCircle size={18} color="#FFF" />}
                        <Text style={styles.rejectBtnFilledText}>Confirm Rejection</Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}

                {selectedSupplier.kyc_status === 'rejected' && (
                  <TouchableOpacity
                    style={styles.approveBtn}
                    onPress={() => handleApprove(selectedSupplier)}
                    disabled={actionLoading}
                  >
                    <CheckCircle size={18} color="#FFF" />
                    <Text style={styles.approveBtnText}>Approve Anyway</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
    backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  backBtn: { width: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFF', marginHorizontal: 20, marginVertical: 12,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  searchInput: { flex: 1, fontSize: 15, color: '#111827' },
  filterRow: { maxHeight: 48 },
  filterContent: { paddingHorizontal: 20, gap: 8, paddingBottom: 8 },
  filterTab: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB',
  },
  filterTabActive: { backgroundColor: '#1E40AF', borderColor: '#1E40AF' },
  filterTabText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  filterTabTextActive: { color: '#FFF' },
  list: { padding: 20, gap: 12 },
  emptyText: { textAlign: 'center', color: '#9CA3AF', marginTop: 40 },
  card: {
    backgroundColor: '#FFF', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  cardAvatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#DBEAFE',
    justifyContent: 'center', alignItems: 'center',
  },
  cardAvatarText: { fontSize: 18, fontWeight: '700', color: '#1E40AF' },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  cardEmail: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  cardDate: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  cardDocs: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  cardDocsText: { fontSize: 13, color: '#9CA3AF' },
  viewDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewDetailText: { fontSize: 13, fontWeight: '600', color: '#3B82F6' },
  modalContainer: { flex: 1, backgroundColor: '#F9FAFB' },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
    backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  modalContent: { flex: 1, padding: 20 },
  detailSection: {
    backgroundColor: '#FFF', borderRadius: 14, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  detailSectionTitle: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.5 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  detailLabel: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  detailValue: { fontSize: 14, color: '#111827', fontWeight: '600', flex: 1, textAlign: 'right' },
  kycStatusBadge: { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  kycStatusText: { fontSize: 13, fontWeight: '700' },
  rejectionBox: { backgroundColor: '#FEF2F2', borderRadius: 10, padding: 12, marginTop: 12 },
  rejectionLabel: { fontSize: 12, fontWeight: '600', color: '#991B1B', marginBottom: 4 },
  rejectionText: { fontSize: 14, color: '#7F1D1D' },
  docRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  docInfo: { flexDirection: 'row', justifyContent: 'space-between' },
  docType: { fontSize: 14, fontWeight: '600', color: '#374151', textTransform: 'capitalize' },
  docStatus: { fontSize: 13, color: '#6B7280', textTransform: 'capitalize' },
  noDocsText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', paddingVertical: 10 },
  rejectInputSection: { marginBottom: 16 },
  rejectInputLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  rejectInput: {
    backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D1D5DB',
    borderRadius: 10, padding: 12, fontSize: 14, minHeight: 80,
    textAlignVertical: 'top',
  },
  actionButtons: { gap: 12 },
  reviewBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#EFF6FF', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  reviewBtnText: { fontSize: 15, fontWeight: '600', color: '#1E40AF' },
  approveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#10B981', borderRadius: 12, padding: 14,
  },
  approveBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  rejectBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#FFF', borderRadius: 12, padding: 14,
    borderWidth: 1.5, borderColor: '#EF4444',
  },
  rejectBtnText: { fontSize: 15, fontWeight: '700', color: '#EF4444' },
  rejectBtnFilled: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#EF4444', borderRadius: 12, padding: 14,
  },
  rejectBtnFilledText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
});
