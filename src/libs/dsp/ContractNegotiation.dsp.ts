import { NegotiationState } from '../../utils/types/dsp/message-types.interface.dsp';

export class ContractNegotiation {
    '@context': ['https://w3id.org/dspace/2025/1/context.jsonld'];
    '@type': 'ContractNegotiation';
    'providerPid': string;
    'consumerPid': string;
    'state': NegotiationState;

    constructor(contractNegotiationDocument?: any) {
        this['@context'] = ['https://w3id.org/dspace/2025/1/context.jsonld'];
        this['@type'] = 'ContractNegotiation';

        if (contractNegotiationDocument) {
            this['providerPid'] = contractNegotiationDocument.providerPid;
            this['consumerPid'] = contractNegotiationDocument.consumerPid;
            this['state'] = contractNegotiationDocument.state;
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
