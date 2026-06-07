import type { FormationKey, DraftMode, DreamTeamResult, BatchResult, DraftResult, FormationSlot } from '../types';

const BASE = '/api';

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json();
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const formations: Record<FormationKey, FormationSlot[]> = {
  '4-3-3': [
    { label: 'GK', position: 'GK', specificPositions: ['GK'] },
    { label: 'LB', position: 'DF', specificPositions: ['CB', 'CM'] },
    { label: 'CB1', position: 'DF', specificPositions: ['CB'] },
    { label: 'CB2', position: 'DF', specificPositions: ['CB'] },
    { label: 'RB', position: 'DF', specificPositions: ['CB', 'CM'] },
    { label: 'CM1', position: 'MF', specificPositions: ['CM', 'CDM', 'CAM'] },
    { label: 'CM2', position: 'MF', specificPositions: ['CM', 'CDM', 'CAM'] },
    { label: 'CM3', position: 'MF', specificPositions: ['CM', 'CDM', 'CAM'] },
    { label: 'LW', position: 'FW', specificPositions: ['LW', 'RW', 'ST'] },
    { label: 'ST', position: 'FW', specificPositions: ['ST', 'LW', 'RW'] },
    { label: 'RW', position: 'FW', specificPositions: ['RW', 'LW', 'ST'] },
  ],
  '4-4-2': [
    { label: 'GK', position: 'GK', specificPositions: ['GK'] },
    { label: 'LB', position: 'DF', specificPositions: ['CB', 'CM'] },
    { label: 'CB1', position: 'DF', specificPositions: ['CB'] },
    { label: 'CB2', position: 'DF', specificPositions: ['CB'] },
    { label: 'RB', position: 'DF', specificPositions: ['CB', 'CM'] },
    { label: 'LM', position: 'MF', specificPositions: ['CM', 'LW', 'CAM'] },
    { label: 'CM1', position: 'MF', specificPositions: ['CM', 'CDM', 'CAM'] },
    { label: 'CM2', position: 'MF', specificPositions: ['CM', 'CDM', 'CAM'] },
    { label: 'RM', position: 'MF', specificPositions: ['CM', 'RW', 'CAM'] },
    { label: 'ST1', position: 'FW', specificPositions: ['ST', 'LW', 'RW'] },
    { label: 'ST2', position: 'FW', specificPositions: ['ST', 'LW', 'RW'] },
  ],
  '3-5-2': [
    { label: 'GK', position: 'GK', specificPositions: ['GK'] },
    { label: 'CB1', position: 'DF', specificPositions: ['CB'] },
    { label: 'CB2', position: 'DF', specificPositions: ['CB'] },
    { label: 'CB3', position: 'DF', specificPositions: ['CB'] },
    { label: 'LM', position: 'MF', specificPositions: ['CM', 'LW', 'CAM'] },
    { label: 'CM1', position: 'MF', specificPositions: ['CM', 'CDM', 'CAM'] },
    { label: 'CM2', position: 'MF', specificPositions: ['CM', 'CDM', 'CAM'] },
    { label: 'CM3', position: 'MF', specificPositions: ['CM', 'CDM', 'CAM'] },
    { label: 'RM', position: 'MF', specificPositions: ['CM', 'RW', 'CAM'] },
    { label: 'ST1', position: 'FW', specificPositions: ['ST', 'LW', 'RW'] },
    { label: 'ST2', position: 'FW', specificPositions: ['ST', 'LW', 'RW'] },
  ],
};

export const formationKeys: FormationKey[] = ['4-3-3', '4-4-2', '3-5-2'];

export async function runDraftSimulation(
  formation: FormationKey,
  nSims: number,
  nRerolls: number,
  mode: DraftMode
): Promise<DraftResult> {
  return post('/draft', { formation, nSims, nRerolls, mode });
}

export async function runBatchSimulation(
  formation: FormationKey,
  nSims: number,
  targetOvr?: number
): Promise<BatchResult> {
  return post('/batch', { formation, nSims, targetOvr: targetOvr ?? 0 });
}

export async function runSingleSimulation(
  formation: FormationKey
): Promise<DreamTeamResult> {
  return post('/simulate', { formation });
}

export async function getPlayerCount(): Promise<{ count: number }> {
  return get('/players/count');
}
