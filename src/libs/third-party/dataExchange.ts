import axios from 'axios';
import { dataExchangesResponse } from '../../utils/responses/dataExchange.public.response';
import { IDataExchange } from '../../utils/types/dataExchange';

/**
 * POST Request to another /dataexchanges connector endpoint
 * @param endpoint
 * @param body
 * @return Promise<dataExchangesResponse>
 */
export const postDataExchange = async (
    endpoint: string,
    body: Partial<IDataExchange>
): Promise<dataExchangesResponse> => {
    return await axios.post(endpoint, body);
};
