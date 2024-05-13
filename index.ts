import express, { Express, Request, Response } from 'express'
import router from './app/router/router'

import { configDotenv } from 'dotenv'

configDotenv()

const app: Express = express()

const PORT = process.env.PORT

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/', (req: Request, res: Response) => {
  res.send({ msg: 'Express + TypeScript Server' })
})

app.listen(PORT, () => {
  console.log(`Server is running at port ${PORT} ${new Date().getTime()}`)
})

app.use('/', router)
