import axios from 'axios';
import { BilateralResponseType } from '../../utils/responses/bilateral.response';
import { ContractResponseType } from '../../utils/responses/contract.response';

export const getBilateralContract = async (
    contractUri: string
): Promise<BilateralResponseType> => {
    return await axios.get(contractUri);
};

export const getProjectContract = async (
    contractUri: string
): Promise<ContractResponseType> => {
    return await axios.get(contractUri);
};
