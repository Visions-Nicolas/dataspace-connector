import { Request, Response, NextFunction } from 'express';
import {
    getCatalogService,
    getServiceOfferingByIdService,
} from '../../services/private/v1/catalog.private.service';
import { mapCatalog, mapServiceOffering } from '../../libs/dcat';
import axios from 'axios';

/**
 * Request the catalog
 *
 * @see
 * https://docs.internationaldataspaces.org/ids-knowledgebase/dataspace-protocol/catalog/catalog.binding.https#id-2.1-the-catalog-request-endpoint-provider-side
 */
export const handleCatalogRequest = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const catalog = await getCatalogService();

        const dcatCatalog = await mapCatalog(catalog);

        if (req.path.includes('tck')) {
            // @ts-ignore
            dcatCatalog['dataset'] = [
                // @ts-ignore
                {
                    '@id': 'CAT0101',
                    '@type': 'Dataset',
                    hasPolicy: [
                        {
                            '@id': 'CAT0101',
                            '@type': 'Offer',
                            permission: [
                                {
                                    action: 'use',
                                    constraint: [
                                        {
                                            leftOperand: 'spatial',
                                            operator: 'eq',
                                            rightOperand:
                                                'http://example.org/EU',
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                    distribution: [
                        {
                            '@type': 'Distribution',
                            format: 'HttpData-PULL',
                            accessService:
                                'urn:uuid:4aa2dcc8-4d2d-569e-d634-8394a8834d77',
                        },
                    ],
                },
            ];
        }

        res.status(200).json(dcatCatalog);
    } catch (error) {
        next(error);
    }
};

/**
 * Get a dataset
 *
 * @see
 * https://docs.internationaldataspaces.org/ids-knowledgebase/dataspace-protocol/catalog/catalog.binding.https#id-2.2-the-catalog-datasets-id-endpoint-provider-side
 */
export const getDataset = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        if (req.path.includes('tck')) {
            if (req.params.id === 'CAT0102') {
                return res.status(200).json({
                    '@context': [
                        'https://w3id.org/dspace/2025/1/context.jsonld',
                    ],
                    '@id': req.params.id,
                    '@type': 'Dataset',
                    hasPolicy: [
                        {
                            '@type': 'Offer',
                            '@id': 'urn:uuid:2828282:3dd1add8-4d2d-569e-d634-8394a8836a88',
                            permission: [
                                {
                                    action: 'use',
                                    constraint: [
                                        {
                                            leftOperand: 'spatial',
                                            rightOperand: '_:EU',
                                            operator: 'eq',
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                    distribution: [
                        {
                            '@type': 'Distribution',
                            format: 'HttpData-PULL',
                            accessService: {
                                '@id': 'urn:uuid:4aa2dcc8-4d2d-569e-d634-8394a8834d77',
                                '@type': 'DataService',
                                endpointURL: 'https://provider-a.com/connector',
                            },
                        },
                    ],
                });
            } else {
                return res.status(200).json({
                    '@context': [
                        'https://w3id.org/dspace/2025/1/context.jsonld',
                    ],
                    '@id': req.params.id,
                    '@type': 'CatalogError',
                });
            }
        }

        const dataset = await getServiceOfferingByIdService(req.params.id);

        if (!dataset) {
            return res.status(200).json({
                '@context': ['https://w3id.org/dspace/2025/1/context.jsonld'],
                '@id': req.params.id,
                '@type': 'CatalogError',
            });
        }

        const response = await axios.get(dataset.endpoint);

        if (
            response.status !== 200 ||
            response.data.statusCode === 500 ||
            !response.data
        ) {
            return res.status(500).json({ message: 'Dependency error' });
        }

        res.status(200).json(await mapServiceOffering(response.data));
    } catch (error) {
        next(error);
    }
};
