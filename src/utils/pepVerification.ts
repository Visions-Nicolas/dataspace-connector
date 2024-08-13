import { AccessRequest, PEP } from '../access-control/PolicyEnforcementPoint';
import axios from 'axios';
import { Regexes } from './regexes';
import { Logger } from '../libs/loggers';
import { FetchConfig } from '../access-control/PolicyFetcher';
import { config } from '../config/environment';
import jwt from 'jsonwebtoken';
import { getEndpoint } from '../libs/loaders/configuration';
import { urlChecker } from './urlChecker';

export type PEPResult = {
    success: boolean;
    contractID: string;
    resourceID: string;
};
/**
 * PEP verification with the decrypted consent
 * @param params
 */
export const pepVerification = async (params: {
    targetResource: string;
    referenceURL: string;
}): Promise<PEPResult> => {
    const contractSD = params.referenceURL;
    let resourceID;

    const accessRequest = new AccessRequest(params.targetResource, contractSD);

    try {
        const contract = await axios.get(contractSD);

        if (
            contractSD.includes('contracts') &&
            contract.data.serviceOfferings?.length > 0
        ) {
            accessRequest.setDataPath('serviceOfferings.policies');
            const target = params.targetResource;

            if (target.match(Regexes.http)) {
                // Split the string by backslash and get the last element
                const pathElements = params.targetResource.split('/');
                resourceID = pathElements[pathElements.length - 1];
            } else {
                resourceID = params.targetResource;
            }
        } else {
            accessRequest.setDataPath('policy');
            const target = params.targetResource;

            if (target.match(Regexes.http)) {
                // Split the string by backslash and get the last element
                const pathElements = params.targetResource.split('/');
                resourceID = pathElements[pathElements.length - 1];
            } else {
                resourceID = params.targetResource;
            }
        }
        const contractID = Buffer.from(contractSD).toString('base64');
        const token = jwt.sign({ internal: true }, config.jwtInternalSecretKey);

        accessRequest.setFetcherConfig({
            count: {
                url: urlChecker(
                    await getEndpoint(),
                    `internal/leftoperands/count/${contractID}/${resourceID}`
                ),
                remoteValue: 'content.count',
                token,
            },
        } as { [key: string]: FetchConfig });

        const success = await PEP.requestAction(accessRequest);
        // // Note: In a generic scenario, and in some cases, this processing
        // // should be handled by the provider supplying the target resource.
        // if (success) {
        //     // Assuming the resource will indeed be accessed.
        //     await processLeftOperands(['count'], contractID, resourceID);
        // }
        return { success, contractID, resourceID };
    } catch (e) {
        Logger.error({
            message: e.message,
            location: e.stack,
        });
        throw e;
    }
};

export const pepLeftOperandsVerification = async (params: {
    targetResource: string;
}): Promise<string[]> => {
    try {
        return await PEP.listResourceLeftOperands({
            targetResource: params.targetResource,
        });
    } catch (e) {
        Logger.error({
            message: e.message,
            location: e.stack,
        });
        throw e;
    }
};
