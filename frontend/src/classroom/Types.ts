import { PERSONALITY_TYPES } from '../lib/api'

export interface StudentData {
  id: string
  name: string
  type: string
  label: string
  color: 'emerald' | 'amber' | 'rose'
  deskIndex: number
  isSpeaking: boolean
  isHandRaised: boolean
  isSelected: boolean
  lastResponse?: string
  avatarStyle: {
    skinColor: number
    hairColor: number
    hairStyle: 'short' | 'long' | 'curly' | 'spiky' | 'bob'
    shirtColor: number
    glasses: boolean
    accessory?: 'bow' | 'cap' | 'headband' | 'none'
  }
}

// Student sample names pool matching elementary classroom context
export const STUDENT_NAME_POOL: Record<string, string> = {
  excellent: 'Minh Anh',
  good: 'Gia Hưng',
  average: 'Đức Huy',
  weak: 'Bảo Nam',
  shy: 'Trúc Linh',
  inattentive: 'Tuấn Kiệt',
  understands_cant_express: 'Thành Vinh',
  limited_vocabulary: 'Phương Thảo',
  confidently_wrong: 'Hoàng Long',
  random_guess: 'Quốc Anh',
  creative: 'Khánh An',
  quiet: 'Hà My',
  curious: 'Nhật Minh',
  competitive: 'Đăng Khoa',
  careless: 'Hữu Phước',
  leader: 'Quỳnh Anh',
  visual: 'Bảo Ngọc',
  slow_learner: 'Thế Vinh',
  perfectionist: 'Ngọc Diệp',
  humorous: 'Hải Đăng',
}

const VI_TO_EN: Record<string, string> = {
  'giỏi': 'excellent',
  'khá': 'good',
  'trung bình': 'average',
  'yếu': 'weak',
  'nhút nhát': 'shy',
  'mất tập trung': 'inattentive',
  'hiểu nhưng khó diễn đạt': 'understands_cant_express',
  'vốn từ hạn chế': 'limited_vocabulary',
  'tự tin nhưng sai': 'confidently_wrong',
  'đoán mò': 'random_guess',
  'sáng tạo': 'creative',
  'im lặng': 'quiet',
  'hiệu quả': 'excellent',
  'tò mò': 'curious',
  'cạnh tranh': 'competitive',
  'ẩu': 'careless',
  'nhóm trưởng': 'leader',
  'trực quan': 'visual',
  'chậm hiểu': 'slow_learner',
  'cầu toàn': 'perfectionist',
  'hài hước': 'humorous',
}

export function normalizePersonalityType(type: string): string {
  const lower = type.toLowerCase().trim()
  return VI_TO_EN[lower] || type
}

export function getPersonalityLabel(type: string): string {
  const norm = normalizePersonalityType(type)
  const pt = PERSONALITY_TYPES.find(p => p.type === norm)
  return pt ? pt.label : type
}

export function getStudentDisplayName(type: string, customName?: string): string {
  const normType = normalizePersonalityType(type)
  if (customName && customName.trim() && !customName.startsWith('Học sinh ')) {
    return customName
  }
  const defaultName = STUDENT_NAME_POOL[normType] || 'Học sinh'
  const label = getPersonalityLabel(normType)
  return `${defaultName} (${label})`
}
