export const handle = async <T>(
    promise: Promise<{ data: T } | T>
): Promise<[T | null, Error | null]> => {
    try {
        const res = await promise;
        const data = (res as any)?.data ?? res;
        return [data, null];
    } catch (error: any) {
        return [
            null,
            error instanceof Error ? error : new Error(String(error)),
        ];
    }
};
