import express, { Router } from 'express'
import { PincodeV0 } from './pincodeV0/pincodeV0.controller'
import { PincodeV1 } from './pincodeV1/pincodeV1.controller'

const pincodeRouter: Router = express.Router()

pincodeRouter.use('/V0', new PincodeV0().pincodeRouterV0)
pincodeRouter.use('/V1', new PincodeV1().pincodeRouterV1)

export default pincodeRouter
