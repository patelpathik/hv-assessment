import express, { Router } from 'express'
import { CloudSyncV0 } from './cloudSyncV0/cloudSyncV0.controller'

const cloudSyncRouter: Router = express.Router()

cloudSyncRouter.use('/V0', new CloudSyncV0().cloudSyncRouterV0)

export default cloudSyncRouter
