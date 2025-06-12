import { getModalOrigins } from '../libs/loaders/configuration';
import cors from 'cors';

/**
 * Custom cors
 */
export const customCorsOptions: cors.CorsOptions = {
    origin: async (origin, callback) => {
        const modalOrigins = await getModalOrigins();
        const origins = modalOrigins.map((element) => element.origin);

        if (!origin) {
            callback(new Error('Missing origin'));
        } else if (origin && origins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};
