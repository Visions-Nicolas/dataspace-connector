export type CustomErrorOptions = {
    location?: string;
    message?: string;
    statusCode: number;
};

export class CustomError extends Error {
    location: string;
    isCustomError: boolean;
    statusCode: number;

    constructor(options: {
        message?: string;
        location?: string;
        statusCode?: number;
    }) {
        super(options.message);
        this.isCustomError = true;
        this.location = options.location || '';
        this.statusCode = options.statusCode || 500;
    }
}
