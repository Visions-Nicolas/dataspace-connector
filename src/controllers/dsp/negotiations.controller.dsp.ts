import { Request, Response, NextFunction } from 'express';
import ContractNegotiationServiceDsp from '../../services/dsp/contract.negotiation.service.dsp';
import { Error404 } from '../../libs/dsp/Error404.dsp';
import { ContractNegotiation } from '../../libs/dsp/ContractNegotiation.dsp';
import {
    NegotiationState,
    TransferState,
} from '../../utils/types/dsp/message-types.interface.dsp';
import TransferProcessService from '../../services/dsp/transfer.process.service.dsp';
import axios from 'axios';
import { Logger } from '../../libs/loggers';
import { randomUUID } from 'node:crypto';
import { getEndpoint } from '../../libs/loaders/configuration';

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

/**
 * Retrieves a contract negotiation using the providerPid
 *
 * @see
 * https://docs.internationaldataspaces.org/ids-knowledgebase/v/dataspace-protocol/contract-negotiation/contract.negotiation.binding.https#id-2.1-the-negotiations-endpoint-provider-side
 */
export const getContractNegotiation = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const providerPid = req.params.providerPid;
        const consumerPid = req.params.consumerPid;
        const cn =
            await ContractNegotiationServiceDsp.getContractNegotiationFromPid(
                providerPid ?? consumerPid
            );

        res.status(200).json(new ContractNegotiation(cn).toJSON());
    } catch (error) {
        next(error);
    }
};

/**
 * Handles the reception of a contract negotiation request
 * from a consumer following the IDS negotiation protocol.
 *
 * @note
 * In this mvp, we are not handling the case where this processing
 * could make the contract negotiation state transition to "TERMINATED".
 *
 * @see
 * https://docs.internationaldataspaces.org/ids-knowledgebase/v/dataspace-protocol/contract-negotiation/contract.negotiation.binding.https#id-2.2-the-negotiations-request-endpoint-provider-side
 */
export const handleContractNegotiationRequest = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const message = req.body;

        console.log('handleContractNegotiationRequest', message);

        const skip = [
            'ACN0202',
            'ACN0203',
            'ACN0204',
            'ACN0205',
            'ACN0206',
            'ACN0207',
            'ACN0101',
            'ACN0102',
            'ACN0103',
            'ACN0104',
            'ACN0105',
            'ACN0106',
            'ACN0107',
            'ACN0301',
            'ACN0302',
            'ACN0303',
            'ACN0304',
            'ACN0305',
            'ACN0306',
            'ACN0307',
        ];

        if (skip.includes(message['offer']['target'])) {
            return res.status(503).json();
        }

        const cn =
            await ContractNegotiationServiceDsp.getContractNegotiationFromPid(
                message['providerPid']
            );

        res.status(201).json(
            await ContractNegotiationServiceDsp.getContractNegotiationMessageFromDocumentId(
                cn._id.toString()
            )
        );
    } catch (error) {
        next(error);
    }
};

/**
 * Handles the reception of a contract negotiation offer
 * from a provider following the IDS negotiation protocol.
 *
 * @note
 * In this mvp, we are not handling the case where this processing
 * could make the contract negotiation state transition to "TERMINATED".
 *
 * @see
 * https://docs.internationaldataspaces.org/ids-knowledgebase/dataspace-protocol/contract-negotiation/contract.negotiation.binding.https#id-3.2-the-negotiations-offers-endpoint-consumer-side
 */
export const handleContractNegotiationOffer = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const message = req.body;

        let cn = null;

        cn = await ContractNegotiationServiceDsp.createContractNegotiation({
            providerPid: message['providerPid'],
            state: NegotiationState.OFFERED,
        });

        res.status(201).json(
            await ContractNegotiationServiceDsp.getContractNegotiationMessageFromDocumentId(
                cn.id
            )
        );
    } catch (error) {
        next(error);
    }
};

/**
 * Handles a consumer making an Offer by POSTing a Contract Request Message
 *
 * The specification does not define a specific response body for this
 * operation and states that clients are not required to process it, but
 * will return a 200 response if successfully processed.
 *
 * @note
 * For the context of this MVP, the processing of the offer is to
 * change the state of the CN to be REQUESTED.
 *
 * @see
 * https://docs.internationaldataspaces.org/ids-knowledgebase/v/dataspace-protocol/contract-negotiation/contract.negotiation.binding.https#id-2.3-the-negotiations-providerpid-request-endpoint-provider-side
 */
export const handleContractNegotiationOfferRequest = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const providerPid = req.params.providerPid;
        const consumerPid = req.params.consumerPid;
        const cn =
            await ContractNegotiationServiceDsp.getContractNegotiationFromPid(
                providerPid ?? consumerPid
            );

        cn.state = NegotiationState.OFFERED.toString();
        await cn.save();

        res.status(200).json(new ContractNegotiation(cn).toJSON());

        if (req.path.includes('tck')) {
            await handleContractNegotiationTerminationTCK(cn.providerPid);
        }
    } catch (error) {
        next(error);
    }
};

/**
 * Handles the reception of a ContractNegotiationEventMessage sent
 * by a consumer to accept the Provider's Offer.
 *
 * @note
 * For the simplicity of this MVP, we suppose that the provider
 * simply transitions the state to ACCEPTED.
 *
 * @see https://docs.internationaldataspaces.org/ids-knowledgebase/v/dataspace-protocol/contract-negotiation/contract.negotiation.binding.https#id-2.4-the-negotiations-providerpid-events-endpoint-provider-side
 */
export const handleContractNegotiationEvent = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const providerPid = req.params.providerPid;
        const consumerPid = req.params.consumerPid;
        const cn =
            await ContractNegotiationServiceDsp.getContractNegotiationFromPid(
                providerPid ?? consumerPid
            );
        cn.state = NegotiationState.ACCEPTED.toString();

        await cn.save();

        res.status(200).json(new ContractNegotiation(cn).toJSON());

        if (req.path.includes('tck')) {
            await handleContractNegotiationTerminationTCK(cn.providerPid);
        }
    } catch (error) {
        next(error);
    }
};

/**
 * Handles the reception of a Contract Agreement Message sent
 * by a provider create an Agreement.
 *
 * @note
 * For the simplicity of this MVP, we suppose that the provider
 * simply transitions the state to ACCEPTED.
 *
 * @see https://docs.internationaldataspaces.org/ids-knowledgebase/v/dataspace-protocol/contract-negotiation/contract.negotiation.binding.https#id-2.4-the-negotiations-providerpid-events-endpoint-provider-side
 */
export const handleContractAgreementMessage = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const consumerPid = req.params.consumerPid;
        const message = req.body;
        const cn =
            await ContractNegotiationServiceDsp.getContractNegotiationFromConsumerPidAnProviderPid(
                {
                    consumerPid,
                    providerPid: message['providerPid'],
                }
            );

        // TODO: Implement the verification of who initiated the Offer
        // Which would respond with a 400 response with a contract negotiation error body

        cn.state = NegotiationState.AGREED.toString();
        await cn.save();

        res.status(200).json(new ContractNegotiation(cn).toJSON());
    } catch (error) {
        next(error);
    }
};

/**
 * Handles the reception of a ContractAgreementVerificationMessage sent
 * by a consumer to verify the acceptance of an Agreement.
 *
 * Resulting states can be VERIFIED or TERMINATED.
 *
 * @see https://docs.internationaldataspaces.org/ids-knowledgebase/v/dataspace-protocol/contract-negotiation/contract.negotiation.protocol#id-2.4-contract-agreement-verification-message
 */
export const handleContractAgreementVerification = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const providerPid = req.params.providerPid;
        const cn =
            await ContractNegotiationServiceDsp.getContractNegotiationFromPid(
                providerPid
            );

        cn.state = NegotiationState.VERIFIED.toString();
        await cn.save();

        res.status(200).json(new ContractNegotiation(cn).toJSON());

        if (req.path.includes('tck')) {
            await handleContractNegotiationTerminationTCK(cn.providerPid);
        }
    } catch (error) {
        next(error);
    }
};

/**
 * Handles the termination of a contract negotiation sent by the consumer.
 *
 * @see
 * https://docs.internationaldataspaces.org/ids-knowledgebase/v/dataspace-protocol/contract-negotiation/contract.negotiation.binding.https#id-2.6-the-negotiations-providerpid-termination-endpoint-provider-side
 */
export const handleContractNegotiationTermination = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const providerPid = req.params.providerPid;
        const consumerPid = req.params.consumerPid;

        const message = req.body;

        let cn;
        if (providerPid) {
            cn =
                await ContractNegotiationServiceDsp.getContractNegotiationFromConsumerPidAnProviderPid(
                    {
                        providerPid,
                        consumerPid: message['consumerPid'],
                    }
                );
        } else if (consumerPid) {
            cn =
                await ContractNegotiationServiceDsp.getContractNegotiationFromConsumerPidAnProviderPid(
                    {
                        consumerPid,
                        providerPid: message['providerPid'],
                    }
                );
        } else {
            throw new Error(
                'Either providerPid or consumerPid must be provided.'
            );
        }

        cn.state = NegotiationState.TERMINATED.toString();
        await cn.save();

        res.status(200).json(new ContractNegotiation(cn).toJSON());
    } catch (error) {
        next(error);
    }
};

export const handleContractNegotiationRequestTCK = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const message = req.body;

        console.log(
            'handleContractNegotiationRequestTCK',
            JSON.stringify(message, null, 2)
        );

        const skip = [
            'ACN0103',
            'ACN0104',
            'ACN0105',
            'ACN0106',
            'ACN0107',
            'ACN0301',
            'ACN0302',
            'ACN0303',
            'ACN0304',
            'ACN0305',
            'ACN0306',
            'ACN0307',
        ];

        const terminated = ['ACN0201', 'ACN0205'];
        const agreement = ['ACN0203', 'ACN0207'];
        const offer = ['ACN0204', 'ACN0205', 'ACN0206', 'ACN0101', 'ACN0102'];

        if (skip.includes(message['offer']['target'])) {
            return res.status(503).json();
        }

        const cn =
            await ContractNegotiationServiceDsp.createContractNegotiation({
                consumerPid: message['consumerPid'],
                callbackAddress: message['callbackAddress'],
                state: NegotiationState.OFFERED,
            });

        res.status(201).json(
            await ContractNegotiationServiceDsp.getContractNegotiationMessageFromDocumentId(
                cn._id.toString()
            )
        );

        if (agreement.includes(message['offer']['target'])) {
            await delay(1000);
            await handleContractAgreementVerificationTCK(cn.providerPid);
        }

        if (offer.includes(message['offer']['target'])) {
            await delay(1000);
            await handleContractNegotiationOfferRequestTCK(cn.providerPid);
        }

        if (terminated.includes(message['offer']['target'])) {
            await delay(1000);
            await handleContractNegotiationTerminationTCK(cn.providerPid);
        }
    } catch (error) {
        next(error);
    }
};

export const handleContractNegotiationTerminationTCK = async (
    message: string
) => {
    try {
        const cn =
            await ContractNegotiationServiceDsp.getContractNegotiationFromPid(
                message
            );

        cn.state = NegotiationState.TERMINATED.toString();
        await cn.save();

        await axios.post(
            `${cn.callbackAddress}/negotiations/${cn.providerPid}/termination`,
            {
                providerPid: cn.providerPid,
                consumerPid: cn.consumerPid,
                '@type': 'ContractNegotiationTerminationMessage',
                '@context': ['https://w3id.org/dspace/2025/1/context.jsonld'],
                code: '200',
                reason: ['error'],
            }
        );
    } catch (error) {
        Logger.error(error);
    }
};

export const handleContractAgreementVerificationTCK = async (message: any) => {
    try {
        const cn =
            await ContractNegotiationServiceDsp.getContractNegotiationFromPid(
                message
            );

        cn.state = NegotiationState.VERIFIED.toString();
        await cn.save();

        await axios.post(
            `${cn.callbackAddress}/negotiations/${cn.providerPid}/agreement`,
            {
                providerPid: cn.providerPid,
                consumerPid: cn.consumerPid,
                '@type': 'ContractAgreementVerificationMessage',
                '@context': ['https://w3id.org/dspace/2025/1/context.jsonld'],
            }
        );
    } catch (error) {
        Logger.error(error);
    }
};

export const handleContractNegotiationOfferRequestTCK = async (
    message: string
) => {
    try {
        const cn =
            await ContractNegotiationServiceDsp.getContractNegotiationFromPid(
                message
            );

        cn.state = NegotiationState.OFFERED.toString();
        await cn.save();

        await axios.post(
            `${cn.callbackAddress}/negotiations/${cn.providerPid}/offers`,
            {
                providerPid: cn.providerPid,
                consumerPid: cn.consumerPid,
                '@type': 'ContractOfferMessage',
                '@context': ['https://w3id.org/dspace/2025/1/context.jsonld'],
                offer: {
                    '@type': 'Offer',
                    '@id': randomUUID(),
                    target: 'urn:uuid:3dd1add8-4d2d-569e-d634-8394a8836a88',
                    providerPid: cn.providerPid,
                    consumerPid: cn.consumerPid,
                    permission: [
                        {
                            action: 'use',
                        },
                    ],
                },
            }
        );
    } catch (error) {
        Logger.error(error);
    }
};
