import type { TagId } from '../types';

export interface Tag {
  id: TagId;
  label: string;
  description: string;
}

export const TAGS: readonly Tag[] = [
  { id: 'rules', label: '경기 규칙', description: '서비스 코트, 득점, 코트 체인지, 인터벌' },
  { id: 'refereeing', label: '심판 운영', description: '심판 구성, 콜과 수신호, 진행 문구' },
  { id: 'faults', label: '반칙과 벌칙', description: '서비스 폴트, 렛, 미스컨덕트 카드' },
  { id: 'equipment', label: '용어와 장비', description: '셔틀콕, 라켓, 네트와 코트 규격' },
  { id: 'tournament', label: '대회 운영', description: '토스, 기권과 실격, 기록지' },
] as const;

export const TAG_IDS: readonly TagId[] = TAGS.map((tag) => tag.id);

export function tagLabel(id: TagId): string {
  const tag = TAGS.find((candidate) => candidate.id === id);
  if (!tag) throw new Error(`Unknown tag id: ${id}`);
  return tag.label;
}
