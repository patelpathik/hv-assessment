import express, { Request, Response, Router } from 'express'
import PincodeV1Constants from './pincodeV1.constants'
import { ResponseV0, StatusCode } from '../../../response/responseV0'
import { axios } from '../../../services/axios'
import ApiConstants from '../../../constants/api.constants'
import Joi from 'joi'

interface PincodeApiRes {
  data: PincodeListRes | CreatePincodeRes | DeletePincodeRes | null
}

interface PincodeListRes {
  listPincodes: {
    items: PincodeDetails[]
  }
}

interface CreatePincodeRes {
  createPincode: PincodeDetails
}

interface DeletePincodeRes {
  deletePincode: PincodeDetails
}

interface PincodeDetails {
  code: string
  name: string
  desc: string | null
  branchType: string | null
  deliveryStatus: string | null
  circle: string | null
  state: string | null
  country: string | null
}

export class PincodeV1 {
  pincodeRouterV1: Router = express.Router()
  private readonly newPincodeSchema = Joi.object({
    desc: Joi.string(),
    branchType: Joi.string(),
    deliveryStatus: Joi.string(),
    circle: Joi.string(),
    state: Joi.string(),
    country: Joi.string()
  })

  constructor() {
    // this.pincodeRouterV1.post(PincodeV1Constants.getPincode, this.getPincode)
    this.pincodeRouterV1.get(PincodeV1Constants.getPincodeList, this.getPincodeList)
    this.pincodeRouterV1.post(PincodeV1Constants.createPincode, this.createPincode)
    // this.pincodeRouterV1.post(PincodeV1Constants.updatePincode, this.updatePincode)
    this.pincodeRouterV1.delete(PincodeV1Constants.deletePincode, this.deletePincode)
  }

  gqlRequest = async <T>({
    query,
    variables
  }: {
    query: string
    variables?: object
  }): Promise<T> => {
    return new Promise(async (resolve, reject) => {
      const endpoint = ApiConstants.gqlApiEndpoint()
      const body = JSON.stringify({
        query,
        variables
      })
      console.log(endpoint)
      await axios()
        .post<T>(endpoint, body)
        .then(res => {
          resolve((res as any)['data']['data'] as T)
        })
        .catch(err => {
          console.log(`Error::${err}`)
          reject({ apiError: err })
        })
    })
  }

  getPincodeList = async (req: Request, res: Response) => {
    await this.gqlRequest<PincodeListRes>({
      query: PincodeV1Constants.listPincodeGQL
    })
      .then(data => {
        ResponseV0.successV0(res, StatusCode.success, {
          listPincodes: data.listPincodes.items
        })
      })
      .catch(err => {
        ResponseV0.errorV0(res, StatusCode.badRequest, err)
      })
  }

  createPincode = async (req: Request, res: Response) => {
    const { error, value } = this.newPincodeSchema.validate(req.body)
    if (error) {
      ResponseV0.successV0(res, StatusCode.success, {
        err: error.details
          .map(d => `invalid '${d.context?.key}': ${d.message.toString()}`)
          .join(', ')
      })
    } else {
      const variables = { createpincodeinput: { ...value, ...req.params } }
      await this.gqlRequest<CreatePincodeRes>({
        query: PincodeV1Constants.createPincodeGQL,
        variables
      })
        .then(data => {
          ResponseV0.successV0(res, StatusCode.success, {
            listPincodes: data.createPincode
          })
        })
        .catch(err => {
          ResponseV0.errorV0(res, StatusCode.badRequest, err)
        })
    }
  }

  deletePincode = async (req: Request, res: Response) => {
    const variables = { deletepincodeinput: { ...req.params } }
    await this.gqlRequest<DeletePincodeRes>({
      query: PincodeV1Constants.deletePincodeGQL,
      variables
    })
      .then(data => {
        ResponseV0.successV0(res, StatusCode.success, {
          listPincodes: data.deletePincode
        })
      })
      .catch(err => {
        ResponseV0.errorV0(res, StatusCode.badRequest, err)
      })
  }
}
