import { error } from 'console'
import { Response } from 'express'

export class ResponseV0 {
  static successV0(res: Response, statusCode: StatusCode, data: object) {
    res.status(statusCode).send({
      error: false,
      message: 'SUCCESS',
      data
    })
  }

  static errorV0(res: Response, statusCode: StatusCode, message: object) {
    res.status(statusCode).send({ error: true, message })
  }
}

export enum StatusCode {
  success = 200,
  created = 201,
  accepted = 202,
  noContent = 204,
  badRequest = 400,
  unAuthorized = 401,
  internalServerError = 500
}
