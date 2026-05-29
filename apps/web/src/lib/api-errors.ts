import axios from 'axios';

export type ApiErrorInfo = {
  message: string;
  status?: number;
  code?: string;
  isNetwork: boolean;
  hint?: string;
};

export function getApiErrorMessage(error: unknown): ApiErrorInfo {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data as { message?: string | string[] } | undefined;
    const serverMsg = Array.isArray(data?.message)
      ? data.message.join(', ')
      : data?.message;

    if (error.code === 'ERR_NETWORK' || !error.response) {
      return {
        message:
          'Cannot reach the API. Start it with: npm run dev:api (port 3001). Check NEXT_PUBLIC_API_URL in apps/web/.env.local.',
        code: error.code,
        isNetwork: true,
      };
    }

    if (status === 503) {
      const hint = (error.response?.data as { hint?: string })?.hint;
      return {
        message:
          serverMsg ??
          'Database unavailable — restore Supabase project and run npm run db:migrate',
        status,
        code: error.code,
        isNetwork: false,
        hint,
      };
    }

    return {
      message: serverMsg ?? error.message ?? `Request failed (${status ?? 'unknown'})`,
      status,
      code: error.code,
      isNetwork: false,
    };
  }

  if (error instanceof Error) {
    return { message: error.message, isNetwork: false };
  }

  return { message: 'Something went wrong', isNetwork: false };
}
