import { TransferProcessModel } from '../../utils/types/dsp/TransferProcess.model';
import { TransferProcess } from '../../libs/dsp/TransferProcess.dsp';
import { randomUUID } from 'node:crypto';
import { TransferState } from '../../utils/types/dsp/message-types.interface.dsp';

/**
 * Service that handles the database operations for TransferProcess
 */
class TransferProcessService {
    private static instance: TransferProcessService;

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    constructor() {}

    public static getInstance(): TransferProcessService {
        if (!TransferProcessService.instance) {
            TransferProcessService.instance = new TransferProcessService();
        }

        return TransferProcessService.instance;
    }

    /**
     * Get the mapped property name in the database
     */
    public getMappedIDSToDBProperty(
        idsProperty: 'providerPid' | 'consumerPid' | 'negotiationState'
    ) {
        switch (idsProperty) {
            case 'providerPid':
                return 'providerPid';
            case 'consumerPid':
                return 'consumerPid';
            case 'negotiationState':
                return 'state';
            default:
                throw new Error('Property not found');
        }
    }

    public async getTransferProcessFromProviderPid({
        providerPid,
    }: {
        providerPid: string;
    }) {
        const cn = await TransferProcessModel.findOne({
            providerPid,
        });

        return cn;
    }

    public async getTransferProcessFromConsumerPid({
        consumerPid,
    }: {
        consumerPid: string;
    }) {
        const cn = await TransferProcessModel.findOne({
            consumerPid,
        });

        return cn;
    }

    public async getTransferProcessFromPid(pid: string) {
        return TransferProcessModel.findOne({
            $or: [{ providerPid: pid }, { consumerPid: pid }],
        });
    }

    public async createTransferProcess({
        consumerPid,
        providerPid,
        state,
        format,
        callbackAddress,
        agreementId,
    }: {
        consumerPid?: string;
        providerPid?: string;
        state: TransferState;
        format: string;
        callbackAddress?: string;
        agreementId?: string;
    }) {
        const cn = new TransferProcessModel({
            providerPid: providerPid ?? this.generateTransferProcessPid(),
            consumerPid: consumerPid ?? this.generateTransferProcessPid(),
            state,
            format,
            callbackAddress,
            agreementId,
        });

        await cn.save();
        return cn;
    }

    public async getTransferProcessMessageFromDocumentId(documentId: string) {
        const cn = await TransferProcessModel.findById(documentId);
        return new TransferProcess(cn).toJSON();
    }

    private generateTransferProcessPid() {
        return 'urn:uuid:' + randomUUID();
    }
}

export default TransferProcessService.getInstance();
