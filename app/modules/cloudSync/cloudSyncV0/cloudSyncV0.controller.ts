import express, { Request, Response, Router } from 'express'
import { readFileSync } from 'fs'
import { ResponseV0, StatusCode } from '../../../response/responseV0'
import { S3Client, PutObjectCommand, PutObjectCommandOutput } from '@aws-sdk/client-s3'
import { appendFile } from 'fs/promises'
import CloudSyncV0Constants from './cloudSyncV0.constants'

interface PincodeData {
  Message: string
  Status: string
  PostOffice: PostOffice[] | null
}

interface PostOffice {
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

export class CloudSyncV0 {
  cloudSyncRouterV0: Router = express.Router()

  constructor() {
    this.cloudSyncRouterV0.get(CloudSyncV0Constants.getLogs, this.getLogs)
    this.cloudSyncRouterV0.post(CloudSyncV0Constants.startUpload, this.startUpload)
  }

  s3Bucket = () => process.env.CLOUD_SYNC_S3_BUCKET ?? ''

  uploadToS3 = async ({
    key,
    content
  }: {
    key: string
    content: string
  }): Promise<PutObjectCommandOutput> => {
    return new Promise<PutObjectCommandOutput>(async (resolve, reject) => {
      const s3Client: S3Client = new S3Client({
        region: process.env.AWS_REGION,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? ''
        }
      })
      const putObjCmd = new PutObjectCommand({
        Bucket: this.s3Bucket(),
        Key: key,
        Body: JSON.stringify(content)
      })

      await s3Client
        .send(putObjCmd)
        .then(res => {
          console.log(`S3Client::SEND::${JSON.stringify(res)}`)
          resolve(res)
        })
        .catch(err => {
          reject(err)
        })
    })
  }

  localDataFilePath = (pincode: string): string =>
    `${__dirname}/../../../../pincode_data/data/${pincode}.json`
  localDataHistoryFilePath = (): string =>
    `${__dirname}/../../../../pincode_data/local_data_history.json`
  cloudSyncLogFilePath = (): string => `${__dirname}/../../../../pincode_data/cloud_sync.log`

  readFile = async <T>(path: string) => {
    return new Promise<T>(async resolve => {
      let data: any = await readFileSync(path, { encoding: 'utf8' })
      try {
        data = JSON.parse(data)
      } catch (err) {
      } finally {
        resolve(data as any)
      }
    })
  }

  getLogs = async (req: Request, res: Response) => {
    await this.readFile<any>(this.cloudSyncLogFilePath())
      .then(data => {
        let r: string = (data as string).toString()
        r = r.replaceAll('\t', ' ')
        ResponseV0.successV0(res, StatusCode.success, { logs: r.split('\n') })
      })
      .catch(err => {
        ResponseV0.errorV0(res, StatusCode.internalServerError, { err })
      })
  }

  readAndUpload = async (list: string[], jId: string) => {
    let data: PincodeData[][] = []
    await Promise.all<PincodeData[]>(
      list.map(l => this.readFile<PincodeData[]>(this.localDataFilePath(l)))
    )
      .then(res => {
        // console.log(`READ_LOCAL_RES::${JSON.stringify(res)}`)
        this.writeLog(jId, 'Local files read complete')
        data = res
      })
      .catch(err => {
        // console.log(`READ_LOCAL_ERR::${JSON.stringify(err)}`)
        this.writeLog(jId, `Local files read error ${err}`)
      })

    if (data.length == list.length) {
      this.writeLog(jId, 'Uploading to S3')
      await Promise.all<PutObjectCommandOutput>(
        list.map((l, ind) =>
          this.uploadToS3({ key: `${l}.json`, content: JSON.stringify(data[ind]) })
        )
      )
        .then(res => {
          // console.log(`UPLOAD_RES::${JSON.stringify(res)}`)
          this.writeLog(jId, `Upload complete`)
        })
        .catch(err => {
          // console.log(`UPLOAD_ERR::${JSON.stringify(err)}`)
          this.writeLog(jId, `Upload Error ${err}`)
        })
    } else {
      this.writeLog(
        jId,
        `Upload skipped, uneven pincode list(${list.length}) & data count(${data.length})`
      )
    }
  }

  writeLog = async (jId: string, msg: string) => {
    // `\n${new Date()}\t#${jId}\tJob Created`
    await appendFile(this.cloudSyncLogFilePath(), `${new Date()}\t#${jId}\t${msg}\n`)
  }

  startUpload = async (req: Request, res: Response) => {
    let list: string[] = []
    const jId = `${new Date().getTime()}`
    await this.writeLog(jId, 'Job Created')
    await this.readFile(this.localDataHistoryFilePath())
      .then(data => {
        // console.log(`READ_HISTORY_RES::${JSON.stringify(data)}`)
        list = Object.keys(data as JSON)
        this.writeLog(jId, `${list.length} items found ${list.join(', ')}`)
        ResponseV0.successV0(res, StatusCode.success, {
          result: `[${jId}] Uploading ${list.length} files (${list.join(', ')}).`
        })
      })
      .catch(err => {
        // console.log(`READ_HISTORY_ERR::${JSON.stringify(err)}`)
        this.writeLog(jId, `Reading local file ${this.localDataHistoryFilePath()}, Error ${err}`)
        list = []
        ResponseV0.successV0(res, StatusCode.badRequest, { err })
      })
    await this.readAndUpload(list, jId)
  }
}
