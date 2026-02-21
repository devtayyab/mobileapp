import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, TextInput, Modal, ScrollView, Alert, RefreshControl
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeft, Search, CheckCircle, XCircle, Clock, Eye,
  FileText, Mail, Phone, Building2, Calendar, Percent, RefreshCw
} from 'lucide-react-native';

type Supplier = {
  id: string;
  user_id: string;
  business_name: string;
  business_registration_number: string | null;
  business_type: string | null;
  business_description: string | null;
  business_email: string | null;
  business_phone: string | null;
  business_address: string | null;
  kyc_status: string;
  commission_rate: number;
  created_at: string;
  rejection_reason: string | null;
  reviewed_at: string | null;
  profiles: { full_name: string; email: string; phone: string | null } | null;
  kyc_documents: Array<{ id: string; document_type: string; document_url: string; status: string }>;
};

const STATUS_COLORS: Record<string, string> = {
  approved: '#059669',
  rejected: '#DC2626',
  pending: '#D97706',
  under_review: '#2563EB',
};

const STATUS_BG: Record<string, string> = {
  approved: '#ECFDF5',
  rejected: '#FEF2F2',
  pending: '#FFFBEB',
  under_review: '#EFF6FF',
};

const STATUS_LABELS: Record<string, string> = {
  approved: 'Approved',
  rejected: 'Rejected',
  pending: 'Pending',
  under_review: 'Under Review',
};

export default function AdminSuppliersScreen() {
  const insets = useSafeAreaInsets();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [editingCommission, setEditingCommission] = useState(false);
  const [commissionValue, setCommissionValue] = useState('');

  const fetchSuppliers = useCallback(async () => {
    let query = supabase
      .from('suppliers')
      .select(`
        id, user_id, business_name, business_registration_number, business_type,
        business_description, business_email, business_phone, business_address,
        kyc_status, commission_rate, created_at, rejection_reason, reviewed_at,
        profiles!suppliers_user_id_fkey (full_name, email, phone),
        kyc_documents (id, document_type, document_url, status)
      `)
      .order('created_at', { ascending: false });

    if (filter !== 'all') query = query.eq('kyc_status', filter);

    const { data, error } = await query;
    if (!error) setSuppliers((data as any) || []);
    setLoading(false);
    setRefreshing(false);
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    fetchSuppliers();
  }, [fetchSuppliers]);

  const onRefresh = () => { setRefreshing(true); fetchSuppliers(); };

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
      setSelectedSupplier(null);
      fetchSuppliers();
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
      setSelectedSupplier(null);
      setRejectionReason('');
      setShowRejectInput(false);
      fetchSuppliers();
    } else {
      Alert.alert('Error', error.message);
    }
    setActionLoading(false);
  };

  const handleSetUnderReview = async (supplier: Supplier) => {
    setActionLoading(true);
    await supabase.from('suppliers').update({ kyc_status: 'under_review' }).eq('id', supplier.id);
    fetchSuppliers();
    setActionLoading(false);
    if (selectedSupplier?.id === supplier.id) {
      setSelectedSupplier({ ...supplier, kyc_status: 'under_review' });
    }
  };

  const handleSaveCommission = async (supplier: Supplier) => {
    const rate = parseFloat(commissionValue);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      Alert.alert('Invalid', 'Commission rate must be between 0 and 100');
      return;
    }
    setActionLoading(true);
    const { error } = await supabase
      .from('suppliers')
      .update({ commission_rate: rate })
      .eq('id', supplier.id);

    if (!error) {
      setEditingCommission(false);
      fetchSuppliers();
      if (selectedSupplier) setSelectedSupplier({ ...selectedSupplier, commission_rate: rate });
    } else {
      Alert.alert('Error', error.message);
    }
    setActionLoading(false);
  };

  const closeModal = () => {
    setSelectedSupplier(null);
    setShowRejectInput(false);
    setRejectionReason('');
    setEditingCommission(false);
    setCommissionValue('');
  };

  const filtered = suppliers.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.business_name?.toLowerCase().includes(q) ||
      (s.profiles as any)?.email?.toLowerCase().includes(q) ||
      (s.profiles as any)?.full_name?.toLowerCase().includes(q)
    );
  });

  const filterTabs = [
    { key: 'all', label: 'All', count: suppliers.length },
    { key: 'pending', label: 'Pending', count: suppliers.filter(s => s.kyc_status === 'pending').length },
    { key: 'under_review', label: 'Under Review', count: suppliers.filter(s => s.kyc_status === 'under_review').length },
    { key: 'approved', label: 'Approved', count: suppliers.filter(s => s.kyc_status === 'approved').length },
    { key: 'rejected', label: 'Rejected', count: suppliers.filter(s => s.kyc_status === 'rejected').length },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Supplier Management</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <RefreshCw size={18} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Search size={18} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or email..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
        {filterTabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.filterTab, filter === tab.key && styles.filterTabActive]}
            onPress={() => setFilter(tab.key)}
          >
            <Text style={[styles.filterTabText, filter === tab.key && styles.filterTabTextActive]}>
              {tab.label}
            </Text>
            {tab.count > 0 && (
              <View style={[styles.tabCount, filter === tab.key && styles.tabCountActive]}>
                <Text style={[styles.tabCountText, filter === tab.key && styles.tabCountTextActive]}>{tab.count}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.centerLoader}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Building2 size={40} color="#D1D5DB" />
              <Text style={styles.emptyText}>No suppliers found</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => setSelectedSupplier(item)} activeOpacity={0.7}>
              <View style={styles.cardTop}>
                <View style={[styles.cardAvatar, { backgroundColor: STATUS_BG[item.kyc_status] || '#F3F4F6' }]}>
                  <Text style={[styles.cardAvatarText, { color: STATUS_COLORS[item.kyc_status] || '#6B7280' }]}>
                    {item.business_name?.charAt(0)?.toUpperCase() || 'S'}
                  </Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{item.business_name}</Text>
                  <Text style={styles.cardEmail}>{(item.profiles as any)?.email}</Text>
                  <View style={styles.cardMeta}>
                    <Calendar size={11} color="#9CA3AF" />
                    <Text style={styles.cardDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
                  </View>
                </View>
                <View style={styles.cardRight}>
                  <View style={[styles.statusBadge, { backgroundColor: STATUS_BG[item.kyc_status] || '#F3F4F6' }]}>
                    <Text style={[styles.statusText, { color: STATUS_COLORS[item.kyc_status] || '#6B7280' }]}>
                      {STATUS_LABELS[item.kyc_status] || item.kyc_status}
                    </Text>
                  </View>
                  <Text style={styles.commissionBadge}>{item.commission_rate}% comm.</Text>
                </View>
              </View>
              <View style={styles.cardFooter}>
                <View style={styles.docCount}>
                  <FileText size={12} color="#6B7280" />
                  <Text style={styles.docCountText}>{item.kyc_documents?.length || 0} docs</Text>
                </View>
                <View style={styles.viewDetailRow}>
                  <Eye size={13} color="#2563EB" />
                  <Text style={styles.viewDetailText}>Review Details</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      <Modal visible={!!selectedSupplier} animationType="slide" onRequestClose={closeModal}>
        {selectedSupplier && (
          <View style={styles.modalContainer}>
            <View style={[styles.modalHeader, { paddingTop: insets.top + 8 }]}>
              <TouchableOpacity onPress={closeModal} style={styles.backBtn}>
                <ArrowLeft size={22} color="#111827" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Supplier Details</Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.supplierHero}>
                <View style={[styles.heroAvatar, { backgroundColor: STATUS_BG[selectedSupplier.kyc_status] }]}>
                  <Text style={[styles.heroAvatarText, { color: STATUS_COLORS[selectedSupplier.kyc_status] }]}>
                    {selectedSupplier.business_name?.charAt(0)?.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.heroName}>{selectedSupplier.business_name}</Text>
                <View style={[styles.heroStatus, { backgroundColor: STATUS_BG[selectedSupplier.kyc_status] }]}>
                  <Text style={[styles.heroStatusText, { color: STATUS_COLORS[selectedSupplier.kyc_status] }]}>
                    {STATUS_LABELS[selectedSupplier.kyc_status]?.toUpperCase()}
                  </Text>
                </View>
                {selectedSupplier.reviewed_at && (
                  <Text style={styles.reviewedAt}>Reviewed {new Date(selectedSupplier.reviewed_at).toLocaleDateString()}</Text>
                )}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Contact Information</Text>
                <DetailRow icon={<Mail size={14} color="#6B7280" />} label="Contact Name" value={(selectedSupplier.profiles as any)?.full_name || 'N/A'} />
                <DetailRow icon={<Mail size={14} color="#6B7280" />} label="Email" value={(selectedSupplier.profiles as any)?.email || 'N/A'} />
                <DetailRow icon={<Phone size={14} color="#6B7280" />} label="Phone" value={(selectedSupplier.profiles as any)?.phone || 'N/A'} />
                {selectedSupplier.business_email && (
                  <DetailRow icon={<Mail size={14} color="#6B7280" />} label="Business Email" value={selectedSupplier.business_email} />
                )}
                {selectedSupplier.business_phone && (
                  <DetailRow icon={<Phone size={14} color="#6B7280" />} label="Business Phone" value={selectedSupplier.business_phone} />
                )}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Business Information</Text>
                {selectedSupplier.business_type && (
                  <DetailRow icon={<Building2 size={14} color="#6B7280" />} label="Business Type" value={selectedSupplier.business_type} />
                )}
                {selectedSupplier.business_registration_number && (
                  <DetailRow icon={<FileText size={14} color="#6B7280" />} label="Reg. Number" value={selectedSupplier.business_registration_number} />
                )}
                {selectedSupplier.business_address && (
                  <DetailRow icon={<Building2 size={14} color="#6B7280" />} label="Address" value={selectedSupplier.business_address} />
                )}
                {selectedSupplier.business_description && (
                  <View style={styles.descriptionBox}>
                    <Text style={styles.descriptionLabel}>About Business</Text>
                    <Text style={styles.descriptionText}>{selectedSupplier.business_description}</Text>
                  </View>
                )}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Commission Rate</Text>
                {editingCommission ? (
                  <View style={styles.commissionEdit}>
                    <View style={styles.commissionInputRow}>
                      <TextInput
                        style={styles.commissionInput}
                        value={commissionValue}
                        onChangeText={setCommissionValue}
                        keyboardType="decimal-pad"
                        placeholder="e.g. 10"
                        placeholderTextColor="#9CA3AF"
                        autoFocus
                      />
                      <Text style={styles.commissionPercent}>%</Text>
                    </View>
                    <View style={styles.commissionActions}>
                      <TouchableOpacity
                        style={styles.commissionSaveBtn}
                        onPress={() => handleSaveCommission(selectedSupplier)}
                        disabled={actionLoading}
                      >
                        <Text style={styles.commissionSaveBtnText}>Save</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.commissionCancelBtn}
                        onPress={() => { setEditingCommission(false); setCommissionValue(''); }}
                      >
                        <Text style={styles.commissionCancelBtnText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.commissionRow}
                    onPress={() => { setEditingCommission(true); setCommissionValue(String(selectedSupplier.commission_rate)); }}
                  >
                    <View style={styles.commissionDisplay}>
                      <Percent size={18} color="#059669" />
                      <Text style={styles.commissionValue}>{selectedSupplier.commission_rate}%</Text>
                      <Text style={styles.commissionDesc}>Platform takes {selectedSupplier.commission_rate}% of each sale</Text>
                    </View>
                    <Text style={styles.editLink}>Edit</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>KYC Documents ({selectedSupplier.kyc_documents?.length || 0})</Text>
                {selectedSupplier.kyc_documents?.length > 0 ? (
                  selectedSupplier.kyc_documents.map((doc) => (
                    <View key={doc.id} style={styles.docRow}>
                      <View style={styles.docIconWrap}>
                        <FileText size={16} color="#6B7280" />
                      </View>
                      <View style={styles.docInfo}>
                        <Text style={styles.docType}>{doc.document_type.replace(/_/g, ' ')}</Text>
                        <View style={[styles.docStatusBadge, { backgroundColor: STATUS_BG[doc.status] || '#F3F4F6' }]}>
                          <Text style={[styles.docStatus, { color: STATUS_COLORS[doc.status] || '#6B7280' }]}>{doc.status}</Text>
                        </View>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.noDocsContainer}>
                    <FileText size={28} color="#D1D5DB" />
                    <Text style={styles.noDocsText}>No documents uploaded</Text>
                  </View>
                )}
              </View>

              {selectedSupplier.rejection_reason && (
                <View style={styles.rejectionBox}>
                  <Text style={styles.rejectionLabel}>Rejection Reason</Text>
                  <Text style={styles.rejectionText}>{selectedSupplier.rejection_reason}</Text>
                </View>
              )}

              {showRejectInput && (
                <View style={styles.rejectInputSection}>
                  <Text style={styles.rejectInputLabel}>Rejection Reason *</Text>
                  <TextInput
                    style={styles.rejectInput}
                    placeholder="Explain why the KYC is rejected..."
                    placeholderTextColor="#9CA3AF"
                    value={rejectionReason}
                    onChangeText={setRejectionReason}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
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
                    <Clock size={17} color="#1E40AF" />
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
                      {actionLoading ? <ActivityIndicator color="#FFF" size="small" /> : <CheckCircle size={17} color="#FFF" />}
                      <Text style={styles.approveBtnText}>Approve Supplier</Text>
                    </TouchableOpacity>

                    {!showRejectInput ? (
                      <TouchableOpacity
                        style={styles.rejectBtn}
                        onPress={() => setShowRejectInput(true)}
                        disabled={actionLoading}
                      >
                        <XCircle size={17} color="#DC2626" />
                        <Text style={styles.rejectBtnText}>Reject Application</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.rejectBtnFilled}
                        onPress={() => handleReject(selectedSupplier)}
                        disabled={actionLoading}
                      >
                        {actionLoading ? <ActivityIndicator color="#FFF" size="small" /> : <XCircle size={17} color="#FFF" />}
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
                    {actionLoading ? <ActivityIndicator color="#FFF" size="small" /> : <CheckCircle size={17} color="#FFF" />}
                    <Text style={styles.approveBtnText}>Approve Anyway</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={{ height: insets.bottom + 40 }} />
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}

function DetailRow({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIconLabel}>
        {icon}
        <Text style={styles.detailLabel}>{label}</Text>
      </View>
      <Text style={styles.detailValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centerLoader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  refreshBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFF', marginHorizontal: 16, marginTop: 12, marginBottom: 4,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  searchInput: { flex: 1, fontSize: 15, color: '#111827' },
  filterRow: { maxHeight: 52 },
  filterContent: { paddingHorizontal: 16, gap: 8, paddingBottom: 8, paddingTop: 4 },
  filterTab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB',
  },
  filterTabActive: { backgroundColor: '#1E40AF', borderColor: '#1E40AF' },
  filterTabText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  filterTabTextActive: { color: '#FFF' },
  tabCount: { backgroundColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 },
  tabCountActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  tabCountText: { fontSize: 11, fontWeight: '700', color: '#6B7280' },
  tabCountTextActive: { color: '#FFF' },
  list: { padding: 16, gap: 12 },
  emptyContainer: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { color: '#9CA3AF', fontSize: 15 },
  card: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  cardAvatar: {
    width: 46, height: 46, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  cardAvatarText: { fontSize: 20, fontWeight: '800' },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  cardEmail: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  cardDate: { fontSize: 11, color: '#9CA3AF' },
  cardRight: { alignItems: 'flex-end', gap: 6 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '700' },
  commissionBadge: { fontSize: 11, color: '#059669', fontWeight: '600' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  docCount: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  docCountText: { fontSize: 13, color: '#9CA3AF' },
  viewDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewDetailText: { fontSize: 13, fontWeight: '600', color: '#2563EB' },
  modalContainer: { flex: 1, backgroundColor: '#F9FAFB' },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  modalContent: { flex: 1, padding: 16 },
  supplierHero: {
    alignItems: 'center', backgroundColor: '#FFF', borderRadius: 16,
    padding: 20, marginBottom: 16, gap: 8,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  heroAvatar: {
    width: 64, height: 64, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center', marginBottom: 4,
  },
  heroAvatarText: { fontSize: 28, fontWeight: '800' },
  heroName: { fontSize: 18, fontWeight: '800', color: '#111827', textAlign: 'center' },
  heroStatus: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
  heroStatusText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  reviewedAt: { fontSize: 12, color: '#9CA3AF' },
  section: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  detailIconLabel: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailLabel: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  detailValue: { fontSize: 13, color: '#111827', fontWeight: '600', flex: 1, textAlign: 'right', paddingLeft: 8 },
  descriptionBox: { marginTop: 10, backgroundColor: '#F9FAFB', borderRadius: 10, padding: 12 },
  descriptionLabel: { fontSize: 12, fontWeight: '700', color: '#6B7280', marginBottom: 6 },
  descriptionText: { fontSize: 14, color: '#374151', lineHeight: 20 },
  commissionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  commissionDisplay: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  commissionValue: { fontSize: 24, fontWeight: '800', color: '#059669' },
  commissionDesc: { fontSize: 13, color: '#6B7280' },
  editLink: { fontSize: 14, fontWeight: '700', color: '#2563EB' },
  commissionEdit: { gap: 12 },
  commissionInputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F9FAFB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1.5, borderColor: '#059669',
  },
  commissionInput: { flex: 1, fontSize: 20, fontWeight: '700', color: '#111827' },
  commissionPercent: { fontSize: 20, fontWeight: '700', color: '#059669' },
  commissionActions: { flexDirection: 'row', gap: 10 },
  commissionSaveBtn: {
    flex: 1, backgroundColor: '#059669', borderRadius: 10, paddingVertical: 12,
    alignItems: 'center',
  },
  commissionSaveBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  commissionCancelBtn: {
    flex: 1, backgroundColor: '#F3F4F6', borderRadius: 10, paddingVertical: 12,
    alignItems: 'center',
  },
  commissionCancelBtnText: { fontSize: 15, fontWeight: '600', color: '#374151' },
  docRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F9FAFB',
  },
  docIconWrap: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: '#F3F4F6',
    justifyContent: 'center', alignItems: 'center',
  },
  docInfo: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  docType: { fontSize: 14, fontWeight: '600', color: '#374151', textTransform: 'capitalize' },
  docStatusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  docStatus: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  noDocsContainer: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  noDocsText: { fontSize: 14, color: '#9CA3AF' },
  rejectionBox: {
    backgroundColor: '#FEF2F2', borderRadius: 14, padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: '#FECACA',
  },
  rejectionLabel: { fontSize: 12, fontWeight: '700', color: '#991B1B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  rejectionText: { fontSize: 14, color: '#7F1D1D', lineHeight: 20 },
  rejectInputSection: {
    backgroundColor: '#FFF', borderRadius: 14, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  rejectInputLabel: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 10 },
  rejectInput: {
    backgroundColor: '#F9FAFB', borderWidth: 1.5, borderColor: '#E5E7EB',
    borderRadius: 10, padding: 12, fontSize: 14, color: '#111827', minHeight: 90,
  },
  actionButtons: { gap: 10, marginBottom: 16 },
  reviewBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#EFF6FF', borderRadius: 14, padding: 15,
    borderWidth: 1.5, borderColor: '#BFDBFE',
  },
  reviewBtnText: { fontSize: 15, fontWeight: '700', color: '#1E40AF' },
  approveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#059669', borderRadius: 14, padding: 15,
  },
  approveBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  rejectBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#FFF', borderRadius: 14, padding: 15,
    borderWidth: 1.5, borderColor: '#DC2626',
  },
  rejectBtnText: { fontSize: 15, fontWeight: '700', color: '#DC2626' },
  rejectBtnFilled: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#DC2626', borderRadius: 14, padding: 15,
  },
  rejectBtnFilledText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
});
