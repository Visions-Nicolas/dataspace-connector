import { connection, Schema } from 'mongoose';

const ContractNegotiationSchema = new Schema(
    {
        providerPid: {
            type: String,
        },
        consumerPid: {
            type: String,
        },
        state: {
            type: String,
        },
        callbackAddress: {
            type: String,
        },
        target: {
            type: String,
        },
    },
    { timestamps: true }
);

export const ContractNegotiationModel = connection.model(
    'ContractNegotiation',
    ContractNegotiationSchema
);
