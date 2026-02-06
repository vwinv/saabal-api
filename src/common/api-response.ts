/**
 * Format standard de réponse API : { success, data, message }
 */
export type ApiResponse<T = unknown> = {
  success: boolean;
  data: T;
  message: string;
};

export function apiSuccess<T>(data: T, message = ''): ApiResponse<T> {
  return { success: true, data, message };
}
