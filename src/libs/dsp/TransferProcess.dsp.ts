import { TransferState } from '../../utils/types/dsp/message-types.interface.dsp';

export class TransferProcess {
    '@context': ['https://w3id.org/dspace/2025/1/context.jsonld'];
    '@type': 'TransferProcess';
    'providerPid': string;
    'consumerPid': string;
    'state': TransferState;

    constructor(transferProcessDocument?: any) {
        this['@context'] = ['https://w3id.org/dspace/2025/1/context.jsonld'];
        this['@type'] = 'TransferProcess';

        if (transferProcessDocument) {
            this['providerPid'] = transferProcessDocument.providerPid;
            this['consumerPid'] = transferProcessDocument.consumerPid;
            this['state'] = transferProcessDocument.state;
        }
    }

    toJSON() {
        return {
            '@context': this['@context'],
            '@type': this['@type'],
            providerPid: this['providerPid'],
            consumerPid: this['consumerPid'],
            state: this['state'],
        };
    }
}
