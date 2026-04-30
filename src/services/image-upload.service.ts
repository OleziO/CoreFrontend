import apiClient from '@/api/client'

/** Повідомлення для inline / toast (узгоджено з API: image/*, max 10 MB, поле `file`) */
export const UPLOAD_ERROR = {
  notImage: 'Only image files are allowed',
  tooLarge: 'Maximum file size is 10 MB',
  network: 'Upload failed, try again'
} as const

const MAX_BYTES = 10 * 1024 * 1024

export function validateImageFileForUpload (file: File): string | null {
  if (!file.type.startsWith('image/')) return UPLOAD_ERROR.notImage
  if (file.size > MAX_BYTES) return UPLOAD_ERROR.tooLarge
  return null
}

/**
 * POST /teams/:id/logo — multipart field `file`, 201 без тіла (OpenAPI).
 * Після цього отримайте команду GET /teams/:id (оновлений logoUrl на сервері).
 */
export async function postTeamLogoUpload (teamId: string, file: File): Promise<void> {
  const err = validateImageFileForUpload(file)
  if (err != null) {
    throw new Error(err)
  }
  const fd = new FormData()
  fd.append('file', file)
  try {
    await apiClient.post('/teams/{id}/logo', fd as never, {
      dynamicKeys: { id: teamId }
    })
  } catch {
    throw new Error(UPLOAD_ERROR.network)
  }
}
