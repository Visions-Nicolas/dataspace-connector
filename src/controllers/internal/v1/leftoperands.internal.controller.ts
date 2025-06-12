import { Request, Response, NextFunction } from 'express';
import { restfulResponse } from '../../../libs/api/RESTfulResponse';
import { LeftOperand } from '../../../utils/types/leftOperand';
import { RestfulResponse } from '../../../utils/types/restfulResponse';

/**
 * Get the left operand count for a defined contract and resource
 * @param req
 * @param res
 * @param next
 * @return Promise<Response<RestfulResponse>>
 */
export const getCount = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<Response<RestfulResponse>> => {
    try {
        const { contractId, resourceId } = req.params;
        const leftOperand = await LeftOperand.findOne({
            name: 'count',
            contractId,
            resourceId,
        });
        if (!leftOperand) {
            return restfulResponse(res, 200, {
                count: 0,
            });
        }
        return restfulResponse(res, 200, { count: leftOperand.value });
    } catch (err) {
        next(err);
    }
};
