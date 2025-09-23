import { IAgreement, IMessageOffer } from './policy.interface.dsp';

interface INegotiationMessageContext {
    '@context': ['https://w3id.org/dspace/2025/1/context.json'];
    providerPid: string;
    consumerPid: string;
}
export enum NegotiationState {
    REQUESTED = 'REQUESTED',
    OFFERED = 'OFFERED',
    ACCEPTED = 'ACCEPTED',
    AGREED = 'AGREED',
    VERIFIED = 'VERIFIED',
    FINALIZED = 'FINALIZED',
    TERMINATED = 'TERMINATED',
}

export enum TransferState {
    REQUESTED = 'REQUESTED',
    STARTED = 'STARTED',
    COMPLETED = 'COMPLETED',
    SUSPENDED = 'SUSPENDED',
    TERMINATED = 'TERMINATED',
}

// ref: https://github.com/International-Data-Spaces-Association/ids-specification/blob/main/negotiation/message/schema/contract-agreement-message-schema.json
export interface IContractAgreementMessage extends INegotiationMessageContext {
    '@type': 'ContractAgreementMessage';
    agreement: IAgreement;
    callback: string;
}

// ref: https://github.com/International-Data-Spaces-Association/ids-specification/blob/main/negotiation/message/schema/contract-agreement-verification-message-schema.json
export interface IContractAgreementVerificationMessage
    extends INegotiationMessageContext {
    '@type': 'ContractAgreementVerificationMessage';
}

// ref: https://github.com/International-Data-Spaces-Association/ids-specification/blob/main/negotiation/message/schema/contract-negotiation-event-message-schema.json
export interface IContractNegotiationEventMessage
    extends INegotiationMessageContext {
    '@type': 'ContractNegotiationEventMessage';
    eventType: ('ACCEPTED' | 'FINALIZED')[];
}

// ref: https://github.com/International-Data-Spaces-Association/ids-specification/blob/main/negotiation/message/schema/contract-negotiation-error-schema.json
export interface IContractNegotiationError extends INegotiationMessageContext {
    '@type': 'ContractNegotiationError';
    code?: string;
    reason?: any[];
    'description'?: MultilanguageProperty[];
}

// ref: https://github.com/International-Data-Spaces-Association/ids-specification/blob/main/negotiation/message/schema/contract-negotiation-schema.json
export interface IContractNegotiation extends INegotiationMessageContext {
    '@type': 'ContractNegotiation';
    state: NegotiationState;
}

// ref: https://github.com/International-Data-Spaces-Association/ids-specification/blob/main/negotiation/message/schema/contract-negotiation-termination-message-schema.json
export interface IContractNegotiationTerminationMessage
    extends INegotiationMessageContext {
    '@type': 'ContractNegotiationTerminationMessage';
    code?: string;
    reason?: object[];
}

// ref: https://github.com/International-Data-Spaces-Association/ids-specification/blob/main/negotiation/message/schema/contract-offer-message-schema.json
export interface IContractOfferMessage
    extends Omit<INegotiationMessageContext, 'consumerPid'> {
    '@type': 'ContractOfferMessage';
    consumerPid?: string;
    offer: IMessageOffer;
    callbackAddress: string;
}

// ref: https://github.com/International-Data-Spaces-Association/ids-specification/blob/main/negotiation/message/schema/contract-request-message-schema.json
// This is the same schema as IContractOfferMessage
export type IContractRequestMessage = IContractOfferMessage;

export interface MultilanguageProperty {
    '@language': string;
    '@value': string;
}
