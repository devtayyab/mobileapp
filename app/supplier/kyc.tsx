import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeft, FileText, CheckCircle, Clock, XCircle, Upload,
  Building2, User, CreditCard, AlertCircle, ChevronRight
} from 'lucide-react-native';

type KycDocument = {
  id: string;
  document_type: string;
  document_url: string;
  status: string;
  rejection_reason: string | null;
  created_at: string;
};

type SupplierInfo = {
  id: string;
  kyc_status: string;
  rejection_reason: string | null;
  business_name: string;
  business_registration_number: string | null;
};

const DOC_TYPES = [
  { key: 'business_registration', label: 'Business Registration', icon: Building2, description: 'Certificate of incorporation or business license' },
  { key: 'identity', label: 'Identity Verification', icon: User, description: 'Government-issued photo ID (passport, national ID)' },
  { key: 'bank_account', label: 'Bank Account Verification', icon: CreditCard, description: 'Bank statement or voided check (last 3 months)' },
];

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: any; label: string }> = {
  pending: { color: '#92400E', bg: '#FEF3C7', icon: Clock, label: 'Pending Review' },
  under_review: { color: '#1E40AF', bg: '#DBEAFE', icon: Clock, label: 'Under Review' },
  approved: { color: '#065F46', bg: '#D1FAE5', icon: CheckCircle, label: 'Approved' },
  rejected: { color: '#991B1B', bg: '#FEE2E2', icon: XCircle, label: 'Rejected' },
};

export default function SupplierKycScreen() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [supplier, setSupplier] = useState<SupplierInfo | null>(null);
  const [documents, setDocuments] = useState<KycDocument[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const [urlInputs, setUrlInputs] = useState<Record<string, string>>({});
  const [showUrlInput, setShowUrlInput] = useState<string | null>(null);

  useEffect(() => {
    loadKycData();
  }, [user?.id]);

  const loadKycData = async () => {
    if (!user?.id) return;
    setLoading(true);

    let { data: supplierData } = await supabase
      .from('suppliers')
      .select('id, kyc_status, rejection_reason, business_name, business_registration_number')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!supplierData) {
      const businessName = profile?.company_name || profile?.full_name || profile?.email?.split('@')[0] || 'My Business';
      const { data: newSupplier } = await supabase
        .from('suppliers')
        .insert({
          user_id: user.id,
          business_name: businessName,
          kyc_status: 'pending',
          is_active: true,
          commission_rate: 10,
        })
        .select('id, kyc_status, rejection_reason, business_name, business_registration_number')
        .single();

      if (!newSupplier) {
        setLoading(false);
        return;
      }
      supplierData = newSupplier;
    }

    setSupplier(supplierData);

    const { data: docs } = await supabase
      .from('kyc_documents')
      .select('*')
      .eq('supplier_id', supplierData.id)
      .order('created_at', { ascending: false });

    setDocuments(docs || []);
    setLoading(false);
  };

  const getDocumentForType = (type: string) => {
    return documents.find((d) => d.document_type === type);
  };

  const submitDocument = async (docType: string) => {
    const url = urlInputs[docType]?.trim();
    if (!url) {
      Alert.alert('Required', 'Please enter a document URL');
      return;
    }

    if (!supplier?.id) return;
    setUploading(docType);

    const existingDoc = getDocumentForType(docType);

    if (existingDoc) {
      const { error } = await supabase
        .from('kyc_documents')
        .update({ document_url: url, status: 'pending', rejection_reason: null })
        .eq('id', existingDoc.id);

      if (error) {
        Alert.alert('Error', error.message);
        setUploading(null);
        return;
      }
    } else {
      const { error } = await supabase
        .from('kyc_documents')
        .insert({
          supplier_id: supplier.id,
          document_type: docType,
          document_url: url,
          status: 'pending',
        });

      if (error) {
        Alert.alert('Error', error.message);
        setUploading(null);
        return;
      }
    }

    const allTypes = DOC_TYPES.map((d) => d.key);
    const existingTypes = documents.map((d) => d.document_type);
    const uploadedTypes = [...new Set([...existingTypes, docType])];
    const allUploaded = allTypes.every((t) => uploadedTypes.includes(t));

    if (allUploaded && supplier.kyc_status === 'rejected') {
      await supabase
        .from('suppliers')
        .update({ kyc_status: 'pending', rejection_reason: null })
        .eq('id', supplier.id);
    } else if (supplier.kyc_status !== 'pending' && supplier.kyc_status !== 'under_review' && supplier.kyc_status !== 'approved') {
      await supabase
        .from('suppliers')
        .update({ kyc_status: 'pending' })
        .eq('id', supplier.id);
    }

    setUrlInputs((prev) => ({ ...prev, [docType]: '' }));
    setShowUrlInput(null);
    loadKycData();
    setUploading(null);
  };

  const submitForReview = async () => {
    if (!supplier?.id) return;
    const allDocsUploaded = DOC_TYPES.every((dt) => getDocumentForType(dt.key));
    if (!allDocsUploaded) {
      Alert.alert('Incomplete', 'Please upload all required documents before submitting for review');
      return;
    }

    await supabase
      .from('suppliers')
      .update({ kyc_status: 'pending' })
      .eq('id', supplier.id);

    loadKycData();
    Alert.alert('Submitted', 'Your KYC documents have been submitted for review. We will notify you of the outcome.');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E40AF" />
      </View>
    );
  }

  if (!supplier) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>KYC Verification</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyState}>
          <AlertCircle size={48} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>Supplier profile not found</Text>
        </View>
      </View>
    );
  }

  const kycConfig = STATUS_CONFIG[supplier.kyc_status] || STATUS_CONFIG.pending;
  const KycIcon = kycConfig.icon;
  const allDocsUploaded = DOC_TYPES.every((dt) => getDocumentForType(dt.key));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>KYC Verification</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.statusBanner, { backgroundColor: kycConfig.bg }]}>
          <KycIcon size={24} color={kycConfig.color} />
          <View style={styles.statusInfo}>
            <Text style={[styles.statusTitle, { color: kycConfig.color }]}>{kycConfig.label}</Text>
            <Text style={[styles.statusSub, { color: kycConfig.color + 'CC' }]}>
              {supplier.kyc_status === 'approved'
                ? 'Your account is verified. You can list products.'
                : supplier.kyc_status === 'under_review'
                ? 'Your documents are being reviewed by our team.'
                : supplier.kyc_status === 'rejected'
                ? 'Some documents were rejected. Please resubmit.'
                : 'Please upload all required documents.'}
            </Text>
          </View>
        </View>

        {supplier.rejection_reason && (
          <View style={styles.rejectionBox}>
            <XCircle size={18} color="#991B1B" />
            <View style={styles.rejectionInfo}>
              <Text style={styles.rejectionTitle}>Rejection Reason</Text>
              <Text style={styles.rejectionText}>{supplier.rejection_reason}</Text>
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>Required Documents</Text>
        <Text style={styles.sectionSubtitle}>All three documents must be submitted for approval</Text>

        {DOC_TYPES.map((docType) => {
          const existing = getDocumentForType(docType.key);
          const DocIcon = docType.icon;
          const docStatus = existing ? STATUS_CONFIG[existing.status] || STATUS_CONFIG.pending : null;
          const DocStatusIcon = docStatus?.icon;
          const isShowingInput = showUrlInput === docType.key;

          return (
            <View key={docType.key} style={styles.docCard}>
              <View style={styles.docHeader}>
                <View style={styles.docIconWrap}>
                  <DocIcon size={22} color="#1E40AF" />
                </View>
                <View style={styles.docInfo}>
                  <Text style={styles.docTitle}>{docType.label}</Text>
                  <Text style={styles.docDesc}>{docType.description}</Text>
                </View>
                {existing && DocStatusIcon && (
                  <View style={[styles.docStatusBadge, { backgroundColor: docStatus.bg }]}>
                    <DocStatusIcon size={14} color={docStatus.color} />
                    <Text style={[styles.docStatusText, { color: docStatus.color }]}>{existing.status}</Text>
                  </View>
                )}
              </View>

              {existing?.rejection_reason && (
                <View style={styles.docRejection}>
                  <Text style={styles.docRejectionText}>{existing.rejection_reason}</Text>
                </View>
              )}

              {!isShowingInput ? (
                <TouchableOpacity
                  style={[styles.uploadBtn, existing && styles.uploadBtnSecondary]}
                  onPress={() => {
                    setShowUrlInput(docType.key);
                    setUrlInputs((prev) => ({ ...prev, [docType.key]: existing?.document_url || '' }));
                  }}
                  disabled={supplier.kyc_status === 'approved' || supplier.kyc_status === 'under_review'}
                >
                  <Upload size={16} color={existing ? '#374151' : '#FFF'} />
                  <Text style={[styles.uploadBtnText, existing && styles.uploadBtnTextSecondary]}>
                    {existing ? 'Replace Document' : 'Upload Document'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.urlInputContainer}>
                  <Text style={styles.urlInputLabel}>Document URL</Text>
                  <TextInput
                    style={styles.urlInput}
                    placeholder="https://drive.google.com/... or any public URL"
                    value={urlInputs[docType.key] || ''}
                    onChangeText={(t) => setUrlInputs((prev) => ({ ...prev, [docType.key]: t }))}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <View style={styles.urlInputActions}>
                    <TouchableOpacity
                      style={styles.cancelUrlBtn}
                      onPress={() => { setShowUrlInput(null); }}
                    >
                      <Text style={styles.cancelUrlBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.confirmUrlBtn}
                      onPress={() => submitDocument(docType.key)}
                      disabled={uploading === docType.key}
                    >
                      {uploading === docType.key ? (
                        <ActivityIndicator color="#FFF" size="small" />
                      ) : (
                        <Text style={styles.confirmUrlBtnText}>Submit</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          );
        })}

        {supplier.kyc_status !== 'approved' && supplier.kyc_status !== 'under_review' && (
          <TouchableOpacity
            style={[styles.submitAllBtn, !allDocsUploaded && styles.submitAllBtnDisabled]}
            onPress={submitForReview}
            disabled={!allDocsUploaded}
          >
            <FileText size={20} color={allDocsUploaded ? '#FFF' : '#9CA3AF'} />
            <Text style={[styles.submitAllBtnText, !allDocsUploaded && styles.submitAllBtnTextDisabled]}>
              Submit All for Review
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.infoBox}>
          <AlertCircle size={16} color="#1E40AF" />
          <Text style={styles.infoText}>
            Documents should be publicly accessible. You can use Google Drive, Dropbox, or any cloud storage with a public link. Review typically takes 1-3 business days.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
    backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  backBtn: { width: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  content: { flex: 1, padding: 20 },
  statusBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 14, padding: 16, marginBottom: 16,
  },
  statusInfo: { flex: 1 },
  statusTitle: { fontSize: 15, fontWeight: '700' },
  statusSub: { fontSize: 13, marginTop: 2 },
  rejectionBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#FEE2E2', borderRadius: 12, padding: 14, marginBottom: 16,
  },
  rejectionInfo: { flex: 1 },
  rejectionTitle: { fontSize: 13, fontWeight: '700', color: '#991B1B', marginBottom: 2 },
  rejectionText: { fontSize: 13, color: '#7F1D1D' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  sectionSubtitle: { fontSize: 13, color: '#6B7280', marginBottom: 16 },
  docCard: {
    backgroundColor: '#FFF', borderRadius: 14, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  docHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  docIconWrap: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: '#DBEAFE',
    justifyContent: 'center', alignItems: 'center',
  },
  docInfo: { flex: 1 },
  docTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  docDesc: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  docStatusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  docStatusText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  docRejection: { backgroundColor: '#FEF2F2', borderRadius: 8, padding: 10, marginBottom: 10 },
  docRejectionText: { fontSize: 12, color: '#991B1B' },
  uploadBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#1E40AF', borderRadius: 10, padding: 12,
  },
  uploadBtnSecondary: { backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#D1D5DB' },
  uploadBtnText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  uploadBtnTextSecondary: { color: '#374151' },
  urlInputContainer: { gap: 8 },
  urlInputLabel: { fontSize: 13, fontWeight: '600', color: '#374151' },
  urlInput: {
    backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#D1D5DB',
    borderRadius: 8, padding: 11, fontSize: 13, color: '#111827',
  },
  urlInputActions: { flexDirection: 'row', gap: 10 },
  cancelUrlBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#D1D5DB',
  },
  cancelUrlBtnText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  confirmUrlBtn: {
    flex: 2, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: 8, backgroundColor: '#1E40AF',
  },
  confirmUrlBtnText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  submitAllBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#10B981', borderRadius: 14, padding: 16, marginTop: 8, marginBottom: 16,
  },
  submitAllBtnDisabled: { backgroundColor: '#F3F4F6' },
  submitAllBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  submitAllBtnTextDisabled: { color: '#9CA3AF' },
  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#EFF6FF', borderRadius: 12, padding: 14, marginBottom: 8,
  },
  infoText: { flex: 1, fontSize: 13, color: '#1E40AF', lineHeight: 20 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyTitle: { fontSize: 16, color: '#6B7280' },
});
