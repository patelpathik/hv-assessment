class PincodeV0Constants {
  static getPincodeDetails: string = '/get/:pincode'
  static getPincodeListDetails: string = '/get-all/'
  static getPincodeDetailsHistory: string = '/history'
  static pincodeUrl = (pincode: number) => `https://api.postalpincode.in/pincode/${pincode}`
}

export default PincodeV0Constants
