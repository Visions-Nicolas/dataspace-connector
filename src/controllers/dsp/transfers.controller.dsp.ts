import { Request, Response, NextFunction } from 'express';
import TransferProcessService from '../../services/dsp/transfer.process.service.dsp';
import { Error404 } from '../../libs/dsp/Error404.dsp';
import { TransferProcess } from '../../libs/dsp/TransferProcess.dsp';
import {
    NegotiationState,
    TransferState,
} from '../../utils/types/dsp/message-types.interface.dsp';
import axios from 'axios';
import { Error400 } from '../../libs/dsp/Error400.dsp';
import { Logger } from '../../libs/loggers';
import { getEndpoint } from '../../libs/loaders/configuration';
import { randomUUID } from 'node:crypto';

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

/**
 * Retrieves a transfer process using the providerPid
 * A TP can be accessed by a Consumer or Provider
 *
 * @see
 * https://docs.internationaldataspaces.org/ids-knowledgebase/dataspace-protocol/transfer-process/transfer.process.binding.https#id-2.1-the-transfers-endpoint-provider-side
 */
export const getTransferProcess = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const providerPid = req.params.providerPid;
        const tp = await TransferProcessService.getTransferProcessFromPid(
            providerPid
        );

        if (!tp) {
            throw new Error404({ req, res });
        }

        return res.status(200).json(new TransferProcess(tp).toJSON());
    } catch (error) {
        next(error);
    }
};

/**
 * Handles the reception of a transfer process request
 * from a consumer.
 *
 *
 * @see
 * https://docs.internationaldataspaces.org/ids-knowledgebase/dataspace-protocol/transfer-process/transfer.process.binding.https#id-2.2-the-transfers-request-endpoint-provider-side
 */
export const handleTransferProcessRequest = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const message = req.body;

        let tp = null;

        if (message['providerPid']) {
            tp = await TransferProcessService.getTransferProcessFromPid(
                message['providerPid']
            );
            if (!tp) throw new Error404({ req, res });
        } else {
            tp = await TransferProcessService.createTransferProcess({
                consumerPid: message['consumerPid'],
                state: TransferState.REQUESTED,
                callbackAddress: message['callbackAddress'],
                format: message['format'],
                agreementId: message['agreementId'],
            });
        }

        const response =
            await TransferProcessService.getTransferProcessMessageFromDocumentId(
                tp.id
            );

        Logger.info({
            message: JSON.stringify(
                {
                    '@context': [
                        'https://w3id.org/dspace/2025/1/context.jsonld',
                    ],
                    '@type': 'TransferStartMessage',
                    providerPid: tp.providerPid,
                    consumerPid: tp.consumerPid,
                },
                null,
                2
            ),
        });

        res.status(201).json(response);

        if (req.baseUrl.includes('tck')) {
            req.body = {
                '@context': ['https://w3id.org/dspace/2025/1/context.jsonld'],
                '@type': 'TransferStartMessage',
                providerPid: tp.providerPid,
                consumerPid: tp.consumerPid,
            };

            req.params.providerId = tp.providerPid;

            await handleTransferProcessStarted(req, res, next);
        }
    } catch (error) {
        next(error);
    }
};

/**
 * Handles a consumer or provider attempting to start a TP after it has been suspended by POSTing a Transfer Start Message
 *
 * The specification does not define a specific response body for this
 * operation and states that clients are not required to process it, but
 * will return a 200 response if successfully processed.
 *
 * @see
 * https://docs.internationaldataspaces.org/ids-knowledgebase/dataspace-protocol/transfer-process/transfer.process.binding.https#id-2.3-the-transfers-providerpid-start-endpoint-provider-side
 */
export const handleTransferProcessStarted = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const pid = req.params.providerPid;

        let tp = await TransferProcessService.getTransferProcessFromPid(pid);

        if (!tp) {
            tp = await TransferProcessService.getTransferProcessFromConsumerPid(
                {
                    consumerPid: pid,
                }
            );
        }

        if (tp.state === TransferState.TERMINATED.toString()) {
            return res.status(400).json({
                '@context': ['https://w3id.org/dspace/2025/1/context.jsonld'],
                '@type': 'TransferError',
                providerPid: tp.providerPid,
                consumerPid: tp.consumerPid,
                code: 400,
                reason: 'transfer already terminated yet.',
            });
        }

        tp.state = TransferState.STARTED.toString();
        await tp.save();

        res.status(200).json(new TransferProcess(tp).toJSON());

        switch (tp['agreementId']) {
            case 'ATPC0201': {
                axios
                    .post(
                        `${tp['callbackAddress']}/transfers/${tp.providerPid}/termination`,
                        {
                            providerPid: tp.providerPid,
                            consumerPid: tp.consumerPid,
                            '@type': 'TransferTerminationMessage',
                            '@context': [
                                'https://w3id.org/dspace/2025/1/context.jsonld',
                            ],
                            code: '200',
                            reason: [],
                        }
                    )
                    .then(async (res) => {
                        if (res.status === 200) {
                            tp.state = TransferState.TERMINATED.toString();
                            await tp.save();
                        }
                    });
                break;
            }
            case 'ATPC0202': {
                axios
                    .post(
                        `${tp['callbackAddress']}/transfers/${tp.providerPid}/completion`,
                        {
                            providerPid: tp.providerPid,
                            consumerPid: tp.consumerPid,
                            '@type': 'TransferCompletionMessage',
                            '@context': [
                                'https://w3id.org/dspace/2025/1/context.jsonld',
                            ],
                        }
                    )
                    .then(async (res) => {
                        if (res.status === 200) {
                            tp.state = TransferState.COMPLETED.toString();
                            await tp.save();
                        }
                    });
                break;
            }
            case 'ATPC0203': {
                axios
                    .post(
                        `${tp['callbackAddress']}/transfers/${tp.providerPid}/suspension`,
                        {
                            providerPid: tp.providerPid,
                            consumerPid: tp.consumerPid,
                            '@type': 'TransferSuspensionMessage',
                            '@context': [
                                'https://w3id.org/dspace/2025/1/context.jsonld',
                            ],
                            code: '200',
                            reason: [],
                        }
                    )
                    .then(async (res) => {
                        await delay(2000);
                        if (res.status === 200) {
                            axios
                                .post(
                                    `${tp['callbackAddress']}/transfers/${tp.providerPid}/termination`,
                                    {
                                        providerPid: tp.providerPid,
                                        consumerPid: tp.consumerPid,
                                        '@type': 'TransferTerminationMessage',
                                        '@context': [
                                            'https://w3id.org/dspace/2025/1/context.jsonld',
                                        ],
                                        code: '200',
                                        reason: [],
                                    }
                                )
                                .then(async (res) => {
                                    if (res.status === 200) {
                                        tp.state =
                                            TransferState.TERMINATED.toString();
                                        await tp.save();
                                    }
                                });
                        }
                    });
                break;
            }
        }
    } catch (error) {
        next(error);
    }
};

/**
 * Handles the reception of a Transfer Completion Message sent
 * by a consumer or provider to complete a TP.
 *
 * @note
 * For the simplicity of this MVP, we suppose that the provider
 * simply transitions the state to COMPLETED.
 *
 * @see
 * https://docs.internationaldataspaces.org/ids-knowledgebase/dataspace-protocol/transfer-process/transfer.process.binding.https#id-2.4-the-transfers-providerpid-completion-endpoint-provider-side
 */
export const handleTransferProcessCompleted = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const providerPid = req.params.providerPid;
        const consumerPid = req.params.consumerPid;

        let tp;
        if (providerPid) {
            tp = await TransferProcessService.getTransferProcessFromPid(
                providerPid
            );
        } else if (consumerPid) {
            tp = await TransferProcessService.getTransferProcessFromPid(
                consumerPid
            );
        } else {
            throw new Error(
                'Either providerPid or consumerPid must be provided.'
            );
        }

        // TODO: Implement the verification of who initiated the Offer
        // Which would respond with a 400 response with a transfer process error body

        if (tp.state !== TransferState.STARTED.toString()) {
            return res.status(400).json({
                '@context': ['https://w3id.org/dspace/2025/1/context.jsonld'],
                '@type': 'TransferError',
                providerPid: providerPid,
                consumerPid: consumerPid,
                code: 400,
                reason: 'transfer not started yet.',
            });
        }

        tp.state = TransferState.COMPLETED.toString();
        await tp.save();

        return res.status(200).json(new TransferProcess(tp).toJSON());
    } catch (error) {
        next(error);
    }
};

/**
 * Handles the reception of a Transfer Suspension Message sent
 * by a consumer or provider to suspend a TP.
 *
 * Resulting states can be VERIFIED or TERMINATED.
 *
 * @see
 * https://docs.internationaldataspaces.org/ids-knowledgebase/dataspace-protocol/transfer-process/transfer.process.binding.https#id-2.6-the-transfers-providerpid-suspension-endpoint-provider-side
 */
export const handleTransferProcessSuspension = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const providerPid = req.params.providerPid;
        const consumerPid = req.params.consumerPid;
        let tp;
        if (providerPid) {
            tp = await TransferProcessService.getTransferProcessFromPid(
                providerPid
            );
        } else if (consumerPid) {
            tp = await TransferProcessService.getTransferProcessFromPid(
                consumerPid
            );
        } else {
            throw new Error(
                'Either providerPid or consumerPid must be provided.'
            );
        }

        if (tp.state !== TransferState.STARTED.toString()) {
            return res.status(400).json({
                '@context': ['https://w3id.org/dspace/2025/1/context.jsonld'],
                '@type': 'TransferError',
                providerPid: providerPid,
                consumerPid: consumerPid,
                code: 400,
                reason: 'transfer not started yet.',
            });
        }

        tp.state = TransferState.SUSPENDED.toString();
        await tp.save();

        return res.status(200).json(new TransferProcess(tp).toJSON());
    } catch (error) {
        next(error);
    }
};

/**
 * Handles the reception of a Transfer Termination Message sent
 * by a consumer or provider to terminate a TP.
 *
 * @see
 * https://docs.internationaldataspaces.org/ids-knowledgebase/dataspace-protocol/transfer-process/transfer.process.binding.https#id-3.4-the-transfers-consumerpid-termination-endpoint-consumer-side
 * https://docs.internationaldataspaces.org/ids-knowledgebase/dataspace-protocol/transfer-process/transfer.process.binding.https#id-2.5-the-transfers-providerpid-termination-endpoint-provider-side
 */
export const handleTransferProcessTermination = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const providerPid = req.params.providerPid;
        const consumerPid = req.params.consumerPid;
        let tp;
        if (providerPid) {
            tp = await TransferProcessService.getTransferProcessFromPid(
                providerPid
            );
        } else if (consumerPid) {
            tp = await TransferProcessService.getTransferProcessFromPid(
                consumerPid
            );
        } else {
            throw new Error(
                'Either providerPid or consumerPid must be provided.'
            );
        }

        tp.state = TransferState.TERMINATED.toString();
        await tp.save();

        return res.status(200).json(new TransferProcess(tp).toJSON());
    } catch (error) {
        next(error);
    }
};

/**
 * Handles the reception of a demand of transfer
 * from a consumer.
 *
 *
 * @see
 * ?
 */
export const handleAskStartTransfer = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const message = req.body;

        const endpoint = await getEndpoint();

        let tp = null;

        if (req.path.includes('tck')) {
            const response = {
                '@context': ['https://w3id.org/dspace/2025/1/context.jsonld'],
                '@type': 'TransferRequestMessage',
                '@id': randomUUID(),
                consumerPid: 'tck-' + randomUUID(),
                agreementId: message['agreementId'],
                format: message['agreementId'],
                callbackAddress: endpoint.slice(0, -1),
            };

            res.status(200).json('ok');

            axios
                .post(
                    `${message['connectorAddress']}/transfers/request`,
                    response
                )
                .then(async (re) => {
                    tp = await TransferProcessService.createTransferProcess({
                        providerPid: re.data['providerPid'],
                        consumerPid: response['consumerPid'],
                        state: TransferState.REQUESTED,
                        callbackAddress: message['connectorAddress'],
                        format: message['format'],
                        agreementId: message['agreementId'],
                    });

                    if (
                        message['agreementId'] === 'ATPC0205' &&
                        tp &&
                        re.status === 200
                    ) {
                        tp.state = TransferState.TERMINATED.toString();
                        await tp.save();

                        await delay(2000);
                        await axios.post(
                            `${message['connectorAddress']}/transfers/${tp.providerPid}/termination`,
                            {
                                providerPid: tp.providerPid,
                                consumerPid: tp.consumerPid,
                                '@type': 'TransferTerminationMessage',
                                '@context': [
                                    'https://w3id.org/dspace/2025/1/context.jsonld',
                                ],
                                code: '200',
                                reason: [],
                            }
                        );
                    }
                });
        }
    } catch (error) {
        next(error);
    }
};

/**
 * Handles the reception of a transfer process request
 * from a consumer for TCK.
 *
 *
 * @see
 * https://docs.internationaldataspaces.org/ids-knowledgebase/dataspace-protocol/transfer-process/transfer.process.binding.https#id-2.2-the-transfers-request-endpoint-provider-side
 */
export const handleTransferProcessRequestTCK = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const start = [
            'ATP0303',
            'ATP0304',
            'ATP0305',
            'ATP0306',
            'ATP0201',
            'ATP0202',
            'ATP0203',
            'ATP0101',
            'ATP0102',
            'ATP0103',
            'ATP0104',
        ];

        const termination = ['ATP0101', 'ATP0103', 'ATP0105'];
        const completion = ['ATP0102', 'ATP0104'];
        const suspension = ['ATP0103', 'ATP0104'];
        const startAgain = ['ATP0104'];
        const message = req.body;

        let tp = null;

        if (message['providerPid']) {
            tp = await TransferProcessService.getTransferProcessFromPid(
                message['providerPid']
            );
            if (!tp) throw new Error404({ req, res });
        } else {
            tp = await TransferProcessService.createTransferProcess({
                consumerPid: message['consumerPid'],
                state: TransferState.REQUESTED,
                callbackAddress: message['callbackAddress'],
                format: message['format'],
                agreementId: message['agreementId'],
            });
        }

        const response =
            await TransferProcessService.getTransferProcessMessageFromDocumentId(
                tp.id
            );

        res.status(201).json(response);

        if (req.path.includes('tck')) {
            if (start.includes(message['agreementId'])) {
                await handleTransferProcessStartedTCK({
                    '@context': [
                        'https://w3id.org/dspace/2025/1/context.jsonld',
                    ],
                    providerPid: tp.providerPid,
                    consumerPid: tp.consumerPid,
                });

                if (suspension.includes(message['agreementId'])) {
                    await delay(2000);
                    await handleTransferProcessSuspensionTCK(tp.providerPid);
                }

                if (startAgain.includes(message['agreementId'])) {
                    await delay(2000);
                    await handleTransferProcessStartedTCK({
                        '@context': [
                            'https://w3id.org/dspace/2025/1/context.jsonld',
                        ],
                        providerPid: tp.providerPid,
                        consumerPid: tp.consumerPid,
                    });
                }

                if (termination.includes(message['agreementId'])) {
                    await delay(2000);
                    await handleTransferProcessTerminationTCK({
                        providerPid: tp.providerPid,
                        consumerPid: tp.consumerPid,
                    });
                }

                if (completion.includes(message['agreementId'])) {
                    await delay(2000);
                    await handleTransferProcessCompletedTCK(tp.providerPid);
                }
            }

            if (termination.includes(message['agreementId'])) {
                await delay(2000);
                await handleTransferProcessTerminationTCK({
                    providerPid: tp.providerPid,
                    consumerPid: tp.consumerPid,
                });
            }
        }
    } catch (error) {
        next(error);
    }
};

/**
 * Handles a consumer or provider attempting to start a TP after it has been suspended by POSTing a Transfer Start Message
 *
 * The specification does not define a specific response body for this
 * operation and states that clients are not required to process it, but
 * will return a 200 response if successfully processed.
 *
 * TCK
 *
 * @see
 * https://docs.internationaldataspaces.org/ids-knowledgebase/dataspace-protocol/transfer-process/transfer.process.binding.https#id-2.3-the-transfers-providerpid-start-endpoint-provider-side
 */
export const handleTransferProcessStartedTCK = async (message: any) => {
    try {
        const providerPid = message.providerPid;

        const tp = await TransferProcessService.getTransferProcessFromPid(
            providerPid
        );

        const response = await axios.post(
            `${tp.callbackAddress}/transfers/${tp.consumerPid}/start`,
            {
                providerPid,
                consumerPid: tp.consumerPid,
                '@type': 'TransferStartMessage',
                '@context': ['https://w3id.org/dspace/2025/1/context.jsonld'],
            }
        );

        tp.state = TransferState.STARTED.toString();
        await tp.save();
    } catch (error) {
        Logger.error(error);
    }
};

/**
 * TCK
 */
export const handleTransferProcessTerminationTCK = async (message: any) => {
    try {
        const providerPid = message.providerPid;
        const tp = await TransferProcessService.getTransferProcessFromPid(
            providerPid
        );

        tp.state = TransferState.TERMINATED.toString();
        await tp.save();

        await axios.post(
            `${tp.callbackAddress}/transfers/${tp.providerPid}/termination`,
            {
                providerPid: tp.providerPid,
                consumerPid: tp.consumerPid,
                '@type': 'TransferTerminationMessage',
                '@context': ['https://w3id.org/dspace/2025/1/context.jsonld'],
                code: '200',
                reason: [],
            }
        );
    } catch (error) {
        Logger.error(error);
    }
};

/**
 * TCK
 */
export const handleTransferProcessCompletedTCK = async (message: any) => {
    try {
        const tp = await TransferProcessService.getTransferProcessFromPid(
            message
        );

        tp.state = TransferState.COMPLETED.toString();
        await tp.save();

        await axios.post(
            `${tp.callbackAddress}/transfers/${tp.providerPid}/completion`,
            {
                providerPid: tp.providerPid,
                consumerPid: tp.consumerPid,
                '@type': 'TransferCompletionMessage',
                '@context': ['https://w3id.org/dspace/2025/1/context.jsonld'],
            }
        );
    } catch (error) {
        Logger.error(error);
    }
};

/**
 * TCK
 */
export const handleTransferProcessSuspensionTCK = async (message: any) => {
    try {
        const tp = await TransferProcessService.getTransferProcessFromPid(
            message
        );

        tp.state = TransferState.SUSPENDED.toString();
        await tp.save();

        await axios.post(
            `${tp.callbackAddress}/transfers/${tp.providerPid}/suspension`,
            {
                providerPid: tp.providerPid,
                consumerPid: tp.consumerPid,
                '@type': 'TransferSuspensionMessage',
                '@context': ['https://w3id.org/dspace/2025/1/context.jsonld'],
            }
        );
    } catch (error) {
        Logger.error(error);
    }
};
