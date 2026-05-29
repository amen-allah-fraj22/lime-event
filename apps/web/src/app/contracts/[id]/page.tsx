'use client';

import { useParams } from 'next/navigation';
import { SignContractPage } from '@/components/lime/contracts/SignContractPage';

export default function ContractPage() {
  const { id } = useParams<{ id: string }>();
  if (!id) return null;
  return <SignContractPage contractId={id} />;
}
