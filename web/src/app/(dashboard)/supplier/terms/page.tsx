import { redirect } from 'next/navigation';

export default function SupplierTermsRedirect() {
  redirect('/terms?type=supplier');
}
