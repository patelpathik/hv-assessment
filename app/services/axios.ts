import axios, { Axios, AxiosStatic } from 'axios'
import ApiConstants from '../constants/api.constants'

const axiosInstance = (): Axios => {
  return axios.create({
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ApiConstants.gqlApiKey()
    }
  })
}

export { axiosInstance as axios }
