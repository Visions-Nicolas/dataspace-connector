// Class for the contract negotiation error as per defined
// by the IDS Information Model https://docs.internationaldataspaces.org/ids-knowledgebase/v/dataspace-protocol/contract-negotiation/contract.negotiation.protocol#id-3.2-error-contract-negotiation-error

export class ContractNegotiationError
    extends Error
    implements IDSA.IContractNegotiationError
{
    '@context' = ['https://w3id.org/dspace/2025/1/context.jsonld'] as const;
    '@type' = 'ContractNegotiationError' as const;

    /**
     * The Contract negotiation Unique ID on Provider side
     */
    'providerPid': string;

    /**
     * The Contract negotiation Unique ID on Consumer side
     */
    'consumerPid': string;
    'code'?: string;
    'reason'?: any[];
    'description'?: IDSA.MultilanguageProperty[];

    constructor(message?: string) {
        super(message);
        this['code'] = '';
        this['reason'] = [];
        this['description'] = [];
    }

    getJSONResponse() {
        return {
            '@context': this['@context'],
            '@type': this['@type'],
            providerPid: this['providerPid'],
            consumerPid: this['consumerPid'],
            'code': this['code'],
            'reason': this['reason'],
            description: this['description'],
        };
    }
}

const n = new ContractNegotiationError();
