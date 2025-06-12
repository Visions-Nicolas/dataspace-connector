import axios from 'axios';
import {
    getAppKey,
    getCatalogUri,
    getEndpoint,
    getSecretKey,
    getServiceKey,
} from '../loaders/configuration';
import { generateBearerTokenFromSecret } from '../jwt';
import { handle } from '../loaders/handler';
import { urlChecker } from '../../utils/urlChecker';
import { Logger } from '../loggers';
import { checkParticipantResponse } from '../../utils/responses/catalog.private.response';
import { ParticipantResponse } from '../../utils/responses/catalog.public.response';

export const getCatalogData = async (
    endpoint: string,
    options?: { [key: string]: never }
) => {
    return axios.get(endpoint, options);
};

export const getParticipantPublicCatalogData = async (
    selfDescription: string
): Promise<ParticipantResponse> => {
    return axios.get(selfDescription);
};

export const checkParticipantData = async (
    url: string,
    body: Record<string, string>,
    config: Record<string, any>
): Promise<checkParticipantResponse> => {
    return axios.post(url, body, config);
};

/**
 * Register the self description
 * @returns The self description
 */
export const getParticipant = async () => {
    try {
        const catalogURI = await getCatalogUri();
        const endpoint = await getEndpoint();
        const appKey = await getAppKey();

        if (
            (await getServiceKey()) &&
            (await getSecretKey()) &&
            catalogURI &&
            endpoint
        ) {
            const { token } = await generateBearerTokenFromSecret();

            const [checkNeedRegister, checkNeedRegisterError] = await handle(
                checkParticipantData(
                    urlChecker(catalogURI, 'participants/check'),
                    {
                        appKey,
                        endpoint,
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                )
            );

            if (checkNeedRegisterError) {
                Logger.error({
                    message: checkNeedRegisterError.message,
                    location: checkNeedRegisterError.stack,
                });
            }
            return checkNeedRegister.participant;
        }
    } catch (error) {
        Logger.error({
            message: `${error}`,
            location: 'registerSelfDescription',
        });
    }
};
