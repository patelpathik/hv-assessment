import express, { Router } from 'express'
import routes from './routes'
import pincodeRouter from '../modules/pincode'

const router: Router = express.Router()

router.use(routes.pincode, pincodeRouter)

export default router
