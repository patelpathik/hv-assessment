import express, { Router } from 'express'
import { PincodeV0 } from './pincodeV0/pincodeV0.controller'

const pincodeRouter: Router = express.Router()

pincodeRouter.use('/V0', new PincodeV0().pincodeRouterV0)

export default pincodeRouter
