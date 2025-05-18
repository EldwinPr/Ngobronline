// src/lib/chat/uiHelpers.ts
import type { VerificationStatus } from './types';

// Utility functions for UI
export function formatJSON(obj: any): string {
  return JSON.stringify(obj, null, 2);
}

export function getVerificationIcon(status?: VerificationStatus): string {
  switch (status) {
    case 'verified': return '✓';
    case 'failed': return '✗';
    case 'verifying': return '⟳';
    case 'pending': return '⧖';
    default: return '';
  }
}

export function getVerificationColor(status?: VerificationStatus): string {
  switch (status) {
    case 'verified': return 'text-green-500';
    case 'failed': return 'text-red-500';
    case 'verifying': return 'text-blue-500';
    case 'pending': return 'text-gray-500';
    default: return '';
  }
}