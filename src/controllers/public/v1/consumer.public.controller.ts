import { Request, Response, NextFunction } from 'express';
import { restfulResponse } from '../../../libs/api/RESTfulResponse';
import { DataExchange, IDataExchange } from '../../../utils/types/dataExchange';
import { postRepresentation } from '../../../libs/loaders/representationFetcher';
import { handle } from '../../../libs/loaders/handler';
import {
    providerExport,
    providerImport,
} from '../../../libs/third-party/provider';
import { getCatalogData } from '../../../libs/third-party/catalog';
import { Logger } from '../../../libs/loggers';
import { DataExchangeStatusEnum } from '../../../utils/enums/dataExchangeStatusEnum';
import {
    consumerImportService,
    triggerBilateralFlow,
    triggerEcosystemFlow,
} from '../../../services/public/v1/consumer.public.service';
import { ProviderExportService } from '../../../services/public/v1/provider.public.service';
import { getEndpoint } from '../../../libs/loaders/configuration';
import { ExchangeError } from '../../../libs/errors/exchangeError';
import axios from 'axios';

/**
 * trigger the data exchange between provider and consumer in a bilateral or ecosystem contract
 * @param req
 * @param res
 * @param next
 */
export const consumerExchange = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        //req.body
        const {
            resources,
            contract,
            resourceId,
            purposeId,
            providerParams,
            dataProcessingId,
            consumerParams,
            purposes,
        } = req.body;

        //Create a data Exchange
        let dataExchange: IDataExchange;
        let providerEndpoint: string;

        // ecosystem contract
        if (contract.includes('contracts')) {
            const {
                dataExchange: ecosystemDataExchange,
                providerEndpoint: endpoint,
            } = await triggerEcosystemFlow({
                purposeId,
                resourceId,
                contract,
                resources,
                purposes,
                providerParams,
                consumerParams,
                dataProcessingId,
            });

            dataExchange = ecosystemDataExchange;
            if (endpoint) providerEndpoint = endpoint;
        } else {
            const {
                dataExchange: bilateralDataExchange,
                providerEndpoint: endpoint,
            } = await triggerBilateralFlow({
                contract,
                resources,
                purposes,
                providerParams,
                consumerParams,
                dataProcessingId,
            });

            dataExchange = bilateralDataExchange;
            if (endpoint) providerEndpoint = endpoint;
        }

        if (!dataExchange) {
            throw new ExchangeError(
                'Error when trying to initiate te exchange.',
                'triggerEcosystemFlow',
                500
            );
        }

        if (
            dataProcessingId &&
            dataExchange.dataProcessing.infrastructureServices.length > 0
        ) {
            for (const infrastructureService of dataExchange.dataProcessing
                .infrastructureServices) {
                // Get the infrastructure service information
                const [participantResponse] = await handle(
                    axios.get(infrastructureService.participant)
                );

                // Find the participant endpoint
                const participantEndpoint =
                    participantResponse.dataspaceEndpoint;

                // Sync the data exchange with the infrastructure
                if (
                    participantEndpoint !== (await getEndpoint()) &&
                    participantEndpoint !== dataExchange?.consumerEndpoint &&
                    participantEndpoint !== dataExchange?.providerEndpoint
                )
                    await dataExchange.syncWithInfrastructure(
                        participantEndpoint
                    );
            }
        }

        //Trigger provider.ts endpoint exchange
        if (dataExchange.consumerEndpoint) {
            const updatedDataExchange = await DataExchange.findById(
                dataExchange._id
            );

            await ProviderExportService(
                updatedDataExchange.consumerDataExchange
            );
        } else {
            if (providerEndpoint === (await getEndpoint())) {
                Logger.error({
                    message: "Can't make request to itself.",
                    location: 'consumerExchange',
                });
                throw new ExchangeError(
                    "Can't make request to itself.",
                    'triggerEcosystemFlow',
                    500
                );
            }
            await handle(
                providerExport(providerEndpoint, dataExchange._id.toString())
            );
        }
        // return code 200 everything is ok
        restfulResponse(res, 200, { success: true });
    } catch (e) {
        Logger.error({
            message: e.message,
            location: e.stack,
        });

        restfulResponse(res, 500, { success: false, message: e.message });
    }
};

/**
 * import the data from the provider into the consumer software representation
 * @param req
 * @param res
 * @param next
 */
export const consumerImport = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { providerDataExchange, data, apiResponseRepresentation } =
            req.body;

        await consumerImportService({
            providerDataExchange,
            data,
            apiResponseRepresentation,
        });

        return restfulResponse(res, 200, { success: true });
    } catch (e) {
        Logger.error({
            message: e.message,
            location: e.stack,
        });

        const dataExchange = await DataExchange.findById(
            req.body.providerDataExchange
        );
        await dataExchange.updateStatus(
            DataExchangeStatusEnum.CONSUMER_IMPORT_ERROR,
            e.message
        );

        return restfulResponse(res, 500, { success: false });
    }
};
