export type ParticipantResponse = {
    '@context': string;
    '@type': 'Participant';
    _id: string;
    did: string | null;
    legalName: string;
    legalPerson: {
        registrationNumber: string;
        headquartersAddress: {
            countryCode: string;
        };
        legalAddress: {
            countryCode: string;
        };
        parentOrganization: any[]; // Can be refined if needed
        subOrganization: any[]; // Can be refined if needed
    };
    termsAndConditions: string;
    associatedOrganisation: string;
    schema_version: string;
    dataspaceConnectorAppKey: string;
    dataspaceEndpoint: string;
    logo: string;
    createdAt: string; // ISO date string
    updatedAt: string; // ISO date string
    __v: number;
};
