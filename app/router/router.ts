import express, { Router } from 'express'
import routes from './routes'
import pincodeRouter from '../modules/pincode'
import cloudSyncRouter from '../modules/cloudSync'

const router: Router = express.Router()

router.use(routes.pincode, pincodeRouter)
router.use(routes.cloudSync, cloudSyncRouter)

export default router
