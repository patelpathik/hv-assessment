import express, { Request, Response, Router } from 'express'
import PincodeV0Constants from './pincodeV0.constants'
import { ResponseV0, StatusCode } from '../../../response/responseV0'
import axios from 'axios'
import fs, { appendFile, writeFile } from 'fs/promises'
import { existsSync, readFile, readFileSync } from 'fs'

interface PincodeApiRes {
  Message: string
  Status: 'Success' | 'Error'
  PostOffice: PostOfficeDetails[] | null
}

interface PostOfficeDetails {
  Name: string | null
  Description: string | null
  BranchType: string | null
  DeliveryStatus: string | null
  Circle: string | null
  District: string | null
  Division: string | null
  Region: string | null
  State: string | null
  Country: string | null
  Pincode: string | null
}

type PincodeApi = PincodeApiRes

export class PincodeV0 {
  pincodeRouterV0: Router = express.Router()
  localFileStorageHistory: any = {}
  pincodeListLength: number = 3

  constructor() {
    this.pincodeRouterV0.get(PincodeV0Constants.getPincodeDetails, this.getPincodeDetails)
    this.pincodeRouterV0.get(PincodeV0Constants.getPincodeListDetails, this.getPincodeListDetails)
    this.pincodeRouterV0.get(
      PincodeV0Constants.getPincodeDetailsHistory,
      this.getPincodeFileHistory
    )
    this.fetchHistory()
  }

  fetchHistory = async () => {
    if (await existsSync(this.localDataHistoryPath())) {
      // * read and get details
      const data: any = await readFileSync(this.localDataHistoryPath(), {
        encoding: 'utf8'
      })
      this.localFileStorageHistory = JSON.parse(data)
      console.log('local file read complete')
    } else {
      // * create file
      await appendFile(this.localDataHistoryPath(), JSON.stringify({}))
    }
  }

  updateLocalFileHistory = async (pincode: string, flag: boolean) => {
    const c = this.localFileStorageHistory[pincode]
    this.localFileStorageHistory[pincode] = flag
    if (c != this.localFileStorageHistory[pincode]) {
      try {
        await writeFile(this.localDataHistoryPath(), JSON.stringify(this.localFileStorageHistory))
        console.log('file updated successfully')
      } catch (err) {
        console.log(`Error Saving File::${err}`)
      } finally {
        await this.fetchHistory()
      }
    }
  }

  localDataFilePath = (pincode: string): string =>
    `${__dirname}/../../../../pincode_data/data/${pincode}.json`
  localDataHistoryPath = () => `${__dirname}/../../../../pincode_data/local_data_history.json`

  fileExists = async (pincode: string) => {
    return await existsSync(this.localDataFilePath(pincode))
  }

  readLocalData = async (pincode: string): Promise<PincodeApi> => {
    return new Promise(async resolve => {
      const data: any = await readFileSync(this.localDataFilePath(pincode), {
        encoding: 'utf8'
      })

      this.updateLocalFileHistory(pincode, true)
      resolve(JSON.parse(data)[0])
    })
  }

  saveLocalData = async (pincode: string, data: PincodeApi) => {
    try {
      await appendFile(this.localDataFilePath(pincode), JSON.stringify(data))
      console.log('file saved successfully')
      this.updateLocalFileHistory(pincode, true)
    } catch (err) {
      console.error(`Error Saving File::${err}`)
      this.updateLocalFileHistory(pincode, false)
    }
  }

  getPincodeFileHistory = async (req: Request, res: Response) => {
    ResponseV0.successV0(res, StatusCode.success, this.localFileStorageHistory)
  }

  fetchPincodeDetails = async (pincode: string): Promise<PostOfficeDetails[]> => {
    return new Promise(async (resolve, reject) => {
      console.log(`get pincode details ${pincode}`)
      if (!/^[0-9]{6}/.test(pincode)) {
        reject({
          validationError: `6 digit numeric pincode is required, received ${pincode}`
        })
      } else {
        if (await this.fileExists(pincode)) {
          console.log('local file exists')
          await this.readLocalData(pincode).then(r => resolve(r.PostOffice ?? []))
        } else {
          console.log('fetching from api')
          let response = await axios
            .get<PincodeApi>(PincodeV0Constants.pincodeUrl(parseInt(pincode)))
            .catch(err => {
              reject({ apiError: err })
            })
          if (response) {
            await this.saveLocalData(pincode, response.data)
            resolve(response.data.PostOffice ?? [])
          }
        }
      }
    })
  }

  getPincodeDetails = async (req: Request, res: Response) => {
    const pincode = req.params.pincode
    await this.fetchPincodeDetails(pincode)
      .then(r => ResponseV0.successV0(res, StatusCode.success, r))
      .catch(e => ResponseV0.errorV0(res, StatusCode.badRequest, e))
  }

  getPincodeListDetails = async (req: Request, res: Response) => {
    const pincodeList: string[] = req.query.pincodeList?.toString().split(',') ?? []
    let validPincodeList: string[] = []

    if (pincodeList.length > this.pincodeListLength) {
      console.log(
        `pincodeList items count(${pincodeList.length}) is above the limit ${this.pincodeListLength}`
      )
      pincodeList.length = this.pincodeListLength
    }

    validPincodeList = pincodeList.filter(
      async p => /^[0-9]{6}/.test(p) && !(await this.fileExists(p))
    )

    Promise.all(validPincodeList.map(p => this.fetchPincodeDetails(p)))
      .then(r => {
        const ans: any = {}
        validPincodeList.forEach((p, i) => (ans[p] = r[i]))
        ResponseV0.successV0(res, StatusCode.success, ans)
      })
      .catch(e => ResponseV0.errorV0(res, StatusCode.badRequest, e))
  }
}
