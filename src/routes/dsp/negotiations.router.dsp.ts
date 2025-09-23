import { Router } from 'express';
import {
    getContractNegotiation,
    handleContractAgreementMessage,
    handleContractAgreementVerification,
    handleContractNegotiationEvent,
    handleContractNegotiationOffer,
    handleContractNegotiationOfferRequest,
    handleContractNegotiationRequest,
    handleContractNegotiationRequestTCK,
    handleContractNegotiationTermination,
} from '../../controllers/dsp/negotiations.controller.dsp';
import {
    verifyConsumerPid,
    verifyProviderPid,
} from '../middlewares/dsp/dsp.middleware.dsp';
import { body } from 'express-validator';
import { validate } from '../middlewares/validator.middleware';
const r: Router = Router();

const ContractOfferMessageValidation = [
    body('@context')
        .exists()
        .isArray()
        .contains('https://w3id.org/dspace/2025/1/context.jsonld'),
    body('@type').exists().isString().equals('ContractOfferMessage'),
    body('providerPid').exists().isString(),
    body('consumerPid').optional().isString(),
    body('offer').exists(),
    body('callbackAddress').exists().isString(),
];

const ContractRequestMessageValidation = [
    body('@context')
        .exists()
        .isArray()
        .contains('https://w3id.org/dspace/2025/1/context.jsonld'),
    body('@type').exists().isString().equals('ContractRequestMessage'),
    body('providerPid').optional().isString(),
    body('consumerPid').exists().isString(),
    body('offer').exists(),
    body('callbackAddress').optional().isString(),
];

const ContractAgreementMessageValidation = [
    body('@context')
        .exists()
        .isArray()
        .contains('https://w3id.org/dspace/2025/1/context.jsonld'),
    body('@type').exists().isString().equals('ContractAgreementMessage'),
    body('providerPid').exists().isString(),
    body('consumerPid').exists().isString(),
    body('agreement').exists(),
    body('callbackAddress').exists().isString(),
];

const ContractAgreementVerificationMessageValidation = [
    body('@context')
        .exists()
        .isArray()
        .contains('https://w3id.org/dspace/2025/1/context.jsonld'),
    body('@type')
        .exists()
        .isString()
        .equals('ContractAgreementVerificationMessage'),
    body('providerPid').exists().isString(),
    body('consumerPid').exists().isString(),
];

const ContractEventMessageAcceptedValidation = [
    body('@context')
        .exists()
        .isArray()
        .contains('https://w3id.org/dspace/2025/1/context.jsonld'),
    body('@type').exists().isString().equals('ContractNegotiationEventMessage'),
    body('providerPid').exists().isString(),
    body('consumerPid').exists().isString(),
    body('eventType').exists().isString().equals('ACCEPTED'),
];

const ContractEventMessageFinalizedValidation = [
    body('@context')
        .exists()
        .isArray()
        .contains('https://w3id.org/dspace/2025/1/context.jsonld'),
    body('@type').exists().isString().equals('ContractNegotiationEventMessage'),
    body('providerPid').exists().isString(),
    body('consumerPid').exists().isString(),
    body('eventType').exists().isString().equals('FINALIZED'),
];

const ContractNegotiationTerminationMessageValidation = [
    body('@context')
        .exists()
        .isArray()
        .contains('https://w3id.org/dspace/2025/1/context.jsonld'),
    body('@type')
        .exists()
        .isString()
        .equals('ContractNegotiationTerminationMessage'),
    body('providerPid').exists().isString(),
    body('consumerPid').exists().isString(),
    body('code').optional().isString(),
    body('reason').optional().isArray(),
];

/**
 * @swagger
 * tags:
 *   name: DSP Contract Negotiation
 *   description: IDSA Contract Negotiation Protocol
 */

//#region Provider Path Bindings
/**
 * @swagger
 * /negotiations/{providerPid}:
 *   get:
 *     summary: Retrieve contract negotiation details
 *     tags: [DSP Contract Negotiation]
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: path
 *         name: providerPid
 *         description: Provider's PID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Contract negotiation details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 "@context":
 *                   description: The context of the message
 *                   type: string
 *                   example: "https://w3id.org/dspace/2024/1/context.json"
 *                 "@type":
 *                   description: The type of the message
 *                   type: string
 *                   example: "ContractNegotiation"
 *                 "providerPid":
 *                   description: The PID of the provider
 *                   type: string
 *                   example: "urn:uuid:dcbf434c-eacf-4582-9a02-f8dd50120fd3"
 *                 "consumerPid":
 *                   description: The PID of the consumer
 *                   type: string
 *                   example: "urn:uuid:32541fe6-c580-409e-85a8-8a9a32fbe833"
 *                 "state":
 *                   description: The state of the contract negotiation
 *                   type: string
 *                   example: "REQUESTED"
 */
r.get(
    '/negotiations/:providerPid',
    verifyProviderPid,
    validate,
    getContractNegotiation
);

/**
 * @swagger
 * /negotiations/request:
 *   post:
 *     summary: Handle contract negotiation request
 *     tags: [DSP Contract Negotiation]
 *     consumes:
 *       - application/json
 *     requestBody:
 *       description: Contract negotiation request body
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               '@context':
 *                 description: The context of the message
 *                 type: string
 *               '@type':
 *                 description: The type of the message
 *                 type: string
 *               offer:
 *                 description: The offer being made
 *                 type: object
 *               callbackAddress:
 *                 description: The callback address for the consumer
 *                 type: string
 *               consumerPid:
 *                 description: The PID of the consumer
 *                 type: string
 *               providerPid:
 *                 description: The PID of the provider
 *                 type: string
 *     responses:
 *       '201':
 *         description: Contract negotiation request successfully handled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 "@context":
 *                   description: The context of the message
 *                   type: string
 *                   example: "https://w3id.org/dspace/2024/1/context.json"
 *                 "@type":
 *                   description: The type of the message
 *                   type: string
 *                   example: "ContractNegotiation"
 *                 "providerPid":
 *                   description: The PID of the provider
 *                   type: string
 *                   example: "urn:uuid:dcbf434c-eacf-4582-9a02-f8dd50120fd3"
 *                 "consumerPid":
 *                   description: The PID of the consumer
 *                   type: string
 *                   example: "urn:uuid:32541fe6-c580-409e-85a8-8a9a32fbe833"
 *                 "state":
 *                   description: The state of the contract negotiation
 *                   type: string
 *                   example: "REQUESTED"
 *       '400':
 *         description: Invalid contract negotiation request format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   description: Error message
 *                   type: string
 *                 payload:
 *                   description: The invalid payload
 *                   type: object
 */
r.post(
    '/negotiations/request',
    ContractRequestMessageValidation,
    validate,
    handleContractNegotiationRequest
);

/**
 * @swagger
 * /negotiations/{providerPid}/request:
 *   post:
 *     summary: Initiates a contract negotiation with a consumer.
 *     description: This endpoint is used by a provider to initiate a contract negotiation with a consumer.
 *     tags: [DSP Contract Negotiation]
 *     consumes:
 *       - application/json
 *     parameters:
 *       - in: path
 *         name: providerPid
 *         description: The PID of the provider.
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       description: Contract negotiation request body
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               '@context':
 *                 description: The context of the message
 *                 type: string
 *               '@type':
 *                 description: The type of the message
 *                 type: string
 *               offer:
 *                 description: The offer being made
 *                 type: object
 *               dspace:callbackAddress:
 *                 description: The callback address for the consumer
 *                 type: string
 *               dspace:consumerPid:
 *                 description: The PID of the consumer
 *                 type: string
 *               dspace:providerPid:
 *                 description: The PID of the provider
 *                 type: string
 *     responses:
 *       '200':
 *         description: Contract negotiation request successfully handled.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   description: Success message.
 *                   type: string
 *       '400':
 *         description: Invalid contract negotiation request format.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   description: Error message.
 *                   type: string
 *                 payload:
 *                   description: The invalid payload.
 *                   type: object
 */
r.post(
    '/negotiations/:providerPid/request',
    ContractRequestMessageValidation,
    verifyProviderPid,
    validate,
    handleContractNegotiationOfferRequest
);

/**
 * @swagger
 * /negotiations/{providerPid}/events:
 *   post:
 *     summary: Handles a ContractNegotiationEventMessage from a consumer.
 *     description: This endpoint processes a ContractNegotiationEventMessage sent by a consumer to accept the Provider's Offer.
 *     tags: [DSP Contract Negotiation]
 *     parameters:
 *       - in: path
 *         name: providerPid
 *         description: The PID of the provider.
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       description: The ContractNegotiationEventMessage body.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               '@context':
 *                 description: The context of the message
 *                 type: string
 *               '@type':
 *                 description: The type of the message
 *                 type: string
 *               dspace:callbackAddress:
 *                 description: The callback address for the consumer
 *                 type: string
 *               dspace:consumerPid:
 *                 description: The PID of the consumer
 *                 type: string
 *               dspace:providerPid:
 *                 description: The PID of the provider
 *                 type: string
 *               dspace:eventType:
 *                 description: The type of event.
 *                 type: string
 *                 enum: ['dspace:ACCEPTED', 'dspace:FINALIZED']
 *     responses:
 *       '200':
 *         description: Contract negotiation event successfully handled.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   description: Success message.
 *                   type: string
 *       '400':
 *         description: Invalid contract negotiation event format.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   description: Error message.
 *                   type: string
 *                 payload:
 *                   description: The invalid payload.
 *                   type: object
 */
r.post(
    '/negotiations/:providerPid/events',
    ContractEventMessageAcceptedValidation,
    verifyProviderPid,
    validate,
    handleContractNegotiationEvent
);

/**
 * @swagger
 * /negotiations/{providerPid}/agreement/verification:
 *   post:
 *     summary: Verify contract agreement
 *     description: Handles the reception of a ContractAgreementVerificationMessage sent by a consumer to verify the acceptance of an Agreement.
 *     tags: [DSP Contract Negotiation]
 *     parameters:
 *       - in: path
 *         name: providerPid
 *         description: The PID of the provider.
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       description: The ContractAgreementVerificationMessage body.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               '@context':
 *                 description: The context of the message.
 *                 type: string
 *               '@type':
 *                 description: The type of the message.
 *                 type: string
 *               dspace:providerPid:
 *                 description: The PID of the provider.
 *                 type: string
 *               dspace:consumerPid:
 *                 description: The PID of the consumer.
 *                 type: string
 *     responses:
 *       '200':
 *         description: Contract agreement verification successfully handled.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   description: Success message.
 *                   type: string
 *       '400':
 *         description: Invalid contract agreement verification format.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   description: Error message.
 *                   type: string
 *                 payload:
 *                   description: The invalid payload.
 *                   type: object
 */
r.post(
    '/negotiations/:providerPid/agreement/verification',
    ContractAgreementVerificationMessageValidation,
    verifyProviderPid,
    validate,
    handleContractAgreementVerification
);

/**
 * @swagger
 * /negotiations/{providerPid}/termination:
 *   post:
 *     summary: Terminates a contract negotiation.
 *     description: This endpoint is used to terminate a contract negotiation. It requires the providerPid as a path parameter.
 *     tags: [DSP Contract Negotiation]
 *     parameters:
 *       - in: path
 *         name: providerPid
 *         description: The PID of the provider.
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       description: The termination request body.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               '@context':
 *                 description: The context of the message.
 *                 type: string
 *                 example: ['https://w3id.org/dspace/2025/1/context.jsonld']
 *               '@type':
 *                 description: The type of the message.
 *                 type: string
 *                 example: 'dspace:ContractNegotiationTerminationMessage'
 *               'dspace:providerPid':
 *                 description: The PID of the provider.
 *                 type: string
 *               'dspace:consumerPid':
 *                 description: The PID of the consumer.
 *                 type: string
 *               'dspace:code':
 *                 description: The code for the termination.
 *                 type: string
 *                 example: 'TERMINATION_CODE'
 *               'dspace:reason':
 *                 description: The reason for the termination.
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ['REASON_1', 'REASON_2']
 *     responses:
 *       '200':
 *         description: Contract negotiation termination successfully handled.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   description: Success message.
 *                   type: string
 *       '400':
 *         description: Invalid termination request format.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   description: Error message.
 *                   type: string
 *                 payload:
 *                   description: The invalid payload.
 *                   type: object
 */
r.post(
    '/negotiations/:providerPid/termination',
    ContractNegotiationTerminationMessageValidation,
    verifyProviderPid,
    validate,
    handleContractNegotiationTermination
);
//#endregion

/**
 * @swagger
 * /negotiations/offers:
 *   post:
 *     summary: Handle contract negotiation offer
 *     tags: [DSP Contract Negotiation]
 *     consumes:
 *       - application/json
 *     requestBody:
 *       description: Contract negotiation offer body
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               '@context':
 *                 description: The context of the message
 *                 type: string
 *               '@type':
 *                 description: The type of the message
 *                 type: string
 *               'dspace:providerPid':
 *                 description: The PID of the provider
 *                 type: string
 *               'dspace:consumerPid':
 *                 description: The PID of the consumer
 *                 type: string
 *               'dspace:offer':
 *                 description: The offer being made
 *                 type: object
 *               'dspace:callbackAddress':
 *                 description: The callback address for the consumer
 *                 type: string
 *     responses:
 *       '201':
 *         description: Contract negotiation offer successfully handled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 "@context":
 *                   description: The context of the message
 *                   type: string
 *                   example: "https://w3id.org/dspace/2024/1/context.json"
 *                 "@type":
 *                   description: The type of the message
 *                   type: string
 *                   example: "dspace:ContractNegotiation"
 *                 "dspace:providerPid":
 *                   description: The PID of the provider
 *                   type: string
 *                   example: "urn:uuid:dcbf434c-eacf-4582-9a02-f8dd50120fd3"
 *                 "dspace:consumerPid":
 *                   description: The PID of the consumer
 *                   type: string
 *                   example: "urn:uuid:32541fe6-c580-409e-85a8-8a9a32fbe833"
 *                 "dspace:state":
 *                   description: The state of the contract negotiation
 *                   type: string
 *                   example: "OFFERED"
 *       '400':
 *         description: Invalid contract negotiation offer format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   description: Error message
 *                   type: string
 *                 payload:
 *                   description: The invalid payload
 *                   type: object
 */
r.post(
    '/negotiations/offers',
    ContractOfferMessageValidation,
    validate,
    handleContractNegotiationOffer
);

/**
 * @swagger
 * /callback/negotiations/{consumerPid}/offers:
 *   post:
 *     summary: Handles a consumer making an Offer by POSTing a Contract Request Message
 *     description: This endpoint processes a Contract Request Message sent by a consumer to make an Offer.
 *     tags: [DSP Contract Negotiation]
 *     parameters:
 *       - in: path
 *         name: consumerPid
 *         description: The PID of the consumer.
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       description: The Contract Request Message body.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               '@context':
 *                 description: The context of the message
 *                 type: string
 *               '@type':
 *                 description: The type of the message
 *                 type: string
 *               'dspace:providerPid':
 *                 description: The PID of the provider
 *                 type: string
 *               'dspace:consumerPid':
 *                 description: The PID of the consumer
 *                 type: string
 *               'dspace:offer':
 *                 description: The offer being made
 *                 type: object
 *               'dspace:callbackAddress':
 *                 description: The callback address for the consumer
 *                 type: string
 *     responses:
 *       '200':
 *         description: Contract negotiation offer successfully handled.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   description: Success message.
 *                   type: string
 *       '400':
 *         description: Invalid contract negotiation offer format.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   description: Error message.
 *                   type: string
 *                 payload:
 *                   description: The invalid payload.
 *                   type: object
 */
r.post(
    '/callback/negotiations/:consumerPid/offers',
    verifyConsumerPid,
    ContractOfferMessageValidation,
    validate,
    handleContractNegotiationOfferRequest
);

/**
 * @swagger
 * /callback/negotiations/{consumerPid}/agreement:
 *   post:
 *     summary: Handles a ContractAgreementVerificationMessage from a consumer.
 *     description: This endpoint processes a ContractAgreementVerificationMessage sent by a consumer to verify the acceptance of an Agreement.
 *     tags: [DSP Contract Negotiation]
 *     parameters:
 *       - in: path
 *         name: consumerPid
 *         description: The PID of the consumer.
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       description: The ContractAgreementVerificationMessage body.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               '@context':
 *                 description: The context of the message
 *                 type: string
 *               '@type':
 *                 description: The type of the message
 *                 type: string
 *               'dspace:providerPid':
 *                 description: The PID of the provider.
 *                 type: string
 *               'dspace:consumerPid':
 *                 description: The PID of the consumer.
 *                 type: string
 *               'dspace:offer':
 *                 description: The offer being verified.
 *                 type: object
 *               'dspace:callbackAddress':
 *                 description: The callback address for the consumer.
 *                 type: string
 *     responses:
 *       '200':
 *         description: Contract agreement verification successfully handled.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   description: Success message.
 *                   type: string
 *       '400':
 *         description: Invalid contract agreement verification format.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   description: Error message.
 *                   type: string
 *                 payload:
 *                   description: The invalid payload.
 *                   type: object
 */
r.post(
    '/callback/negotiations/:consumerPid/agreement',
    ContractAgreementMessageValidation,
    verifyConsumerPid,
    validate,
    handleContractAgreementMessage
);

/**
 * @swagger
 * /callback/negotiations/{consumerPid}/events:
 *   post:
 *     summary: Handles a ContractNegotiationEventMessage for agreement verification.
 *     description: This endpoint processes a ContractNegotiationEventMessage sent by a consumer to verify the acceptance of an Agreement.
 *     tags: [DSP Contract Negotiation]
 *     parameters:
 *       - in: path
 *         name: consumerPid
 *         description: The PID of the consumer.
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       description: The ContractNegotiationEventMessage body.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               '@context':
 *                 description: The context of the message.
 *                 type: string
 *               '@type':
 *                 description: The type of the message.
 *                 type: string
 *               'dspace:providerPid':
 *                 description: The PID of the provider.
 *                 type: string
 *               'dspace:consumerPid':
 *                 description: The PID of the consumer.
 *                 type: string
 *               'dspace:eventType':
 *                 description: The type of event.
 *                 type: string
 *     responses:
 *       '200':
 *         description: Contract agreement verification event successfully handled.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   description: Success message.
 *                   type: string
 *       '400':
 *         description: Invalid contract negotiation event format.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   description: Error message.
 *                   type: string
 *                 payload:
 *                   description: The invalid payload.
 *                   type: object
 */
r.post(
    '/callback/negotiations/:consumerPid/events',
    ContractEventMessageFinalizedValidation,
    verifyConsumerPid,
    validate,
    handleContractNegotiationEvent
);

/**
 * @swagger
 * /callback/negotiations/{consumerPid}/termination:
 *   post:
 *     summary: Handles the termination of a contract negotiation.
 *     description: This endpoint processes the termination of a contract negotiation initiated by the consumer.
 *     tags: [DSP Contract Negotiation]
 *     parameters:
 *       - in: path
 *         name: consumerPid
 *         description: The PID of the consumer.
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       description: The termination request body.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               '@context':
 *                 description: The context of the message.
 *                 type: string
 *               '@type':
 *                 description: The type of the message.
 *                 type: string
 *               'dspace:consumerPid':
 *                 description: The PID of the consumer.
 *                 type: string
 *               'dspace:code':
 *                 description: The code for termination.
 *                 required: false
 *                 type: string
 *               'dspace:reason':
 *                 description: The reason for termination.
 *                 required: false
 *                 type: array
 *     responses:
 *       '200':
 *         description: Contract negotiation termination successfully handled.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   description: Success message.
 *                   type: string
 *       '400':
 *         description: Invalid contract negotiation termination format.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   description: Error message.
 *                   type: string
 *                 payload:
 *                   description: The invalid payload.
 *                   type: object
 */
r.post(
    '/callback/negotiations/:consumerPid/termination',
    ContractNegotiationTerminationMessageValidation,
    verifyConsumerPid,
    validate,
    handleContractNegotiationTermination
);
//#endregion

r.get(
    '/tck/negotiations/:providerPid',
    verifyProviderPid,
    validate,
    getContractNegotiation
);

r.post(
    '/tck/negotiations/request',
    ContractRequestMessageValidation,
    validate,
    handleContractNegotiationRequestTCK
);

r.post(
    '/tck/negotiations/:providerPid/termination',
    ContractNegotiationTerminationMessageValidation,
    verifyProviderPid,
    validate,
    handleContractNegotiationTermination
);

r.post(
    '/tck/negotiations/:providerPid/events',
    ContractEventMessageAcceptedValidation,
    verifyProviderPid,
    validate,
    handleContractNegotiationEvent
);

r.post(
    '/tck/negotiations/:providerPid/agreement/verification',
    ContractAgreementVerificationMessageValidation,
    verifyProviderPid,
    validate,
    handleContractAgreementVerification
);

r.post(
    '/tck/negotiations/:providerPid/request',
    ContractRequestMessageValidation,
    verifyProviderPid,
    validate,
    handleContractNegotiationOfferRequest
);

export default r;
