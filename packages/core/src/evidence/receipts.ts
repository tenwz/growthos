import type { Claim } from "../markdown/citations.js";
import type { SignalRecord } from "../repo/load.js";

export interface ClaimReceipts {
  claim: Claim;
  signalIds: string[];
  missing: string[];
  receipts: SignalRecord[];
}

export function resolveClaimReceipts(
  claims: Claim[],
  signalById: Map<string, SignalRecord>,
): ClaimReceipts[] {
  return claims.map((claim) => {
    const missing: string[] = [];
    const receipts: SignalRecord[] = [];
    for (const id of claim.citations) {
      const record = signalById.get(id);
      if (record) {
        receipts.push(record);
      } else {
        missing.push(id);
      }
    }
    return { claim, signalIds: claim.citations, missing, receipts };
  });
}

export function uniqueReceiptIds(resolutions: ClaimReceipts[]): string[] {
  const ids = new Set<string>();
  for (const resolution of resolutions) {
    for (const id of resolution.signalIds) ids.add(id);
  }
  return [...ids];
}

export function sourceDiversity(receipts: SignalRecord[]): number {
  return new Set(receipts.map((record) => record.data.source.kind)).size;
}
