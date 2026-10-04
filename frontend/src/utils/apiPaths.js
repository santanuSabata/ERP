export const API_PATHS = {
    AUTH: {
        REGISTER: '/auth/register',
        LOGIN: '/auth/login',
        ME: '/auth/me',
    },
    SETTINGSCOMPNAY: {
        GET: '/company',      // Make sure there is NO leading '/api' here
        UPDATE: '/company',   // Make sure there is NO leading '/api' here
    },
    CUSTOMERS: {
        LIST: '/customers',
        CREATE: '/api/customers',
        GET_BY_ID: (id) => `/api/customers/${id}`,
        UPDATE: (id) => `/api/customers/${id}`,
        DELETE: (id) => `/api/customers/${id}`,
    },
    
    DASHBOARD: {
        SUMMARY: '/dashboard/summary',
        CATEGORY_BREAKDOWN: '/dashboard/category-breakdown',
        MONTHLY_TREND: '/dashboard/monthly-trend',
    },
    INSIGHTS: {
        LIST: '/insights',
        GENERATE: '/insights/generate',
    },
};

export default API_PATHS;
