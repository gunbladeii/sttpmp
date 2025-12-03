import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return new Intl.DateTimeFormat('ms-MY', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d)
}

export function getStatusColor(status: 'belum_selesai' | 'dalam_tindakan' | 'selesai'): string {
  switch (status) {
    case 'belum_selesai':
      return 'text-red-600 bg-red-100'
    case 'dalam_tindakan':
      return 'text-yellow-600 bg-yellow-100'
    case 'selesai':
      return 'text-green-600 bg-green-100'
    default:
      return 'text-gray-600 bg-gray-100'
  }
}

export function getStatusWeight(status: 'belum_selesai' | 'dalam_tindakan' | 'selesai'): number {
  switch (status) {
    case 'belum_selesai':
      return 0
    case 'dalam_tindakan':
      return 0.5
    case 'selesai':
      return 1
    default:
      return 0
  }
}

export function capitalizeWords(str: string): string {
  return str.replace(/\b\w/g, (char) => char.toUpperCase())
}

export function getStatusText(status: 'belum_selesai' | 'dalam_tindakan' | 'selesai'): string {
  const statusMap = {
    'belum_selesai': 'Belum diambil tindakan',
    'dalam_tindakan': 'Dalam Tindakan', 
    'selesai': 'Selesai'
  }
  return statusMap[status] || capitalizeWords(status.replace('_', ' '))
}