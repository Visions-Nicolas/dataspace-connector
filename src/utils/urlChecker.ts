/**
 * Ensures a consistent and valid URL by correctly joining a base endpoint and a route path.
 *
 * This utility avoids issues with duplicate or missing slashes when concatenating
 * a base URL (which may or may not end with a slash) and a relative route.
 *
 * @param endpoint - The base URL or endpoint, e.g., "http://example.com/api"
 * @param route - The route to append to the endpoint, e.g., "users/list"
 * @returns A well-formed URL combining the endpoint and route, e.g., "http://example.com/api/users/list"
 */
export const urlChecker = (endpoint: string, route: string): string => {
    if (endpoint?.endsWith('/')) {
        return `${endpoint}${route}`;
    } else {
        return `${endpoint}/${route}`;
    }
};
