class PincodeV1Constants {
  static getPincode: string = '/get/:pincode/:name'
  static getPincodeList: string = '/get-all/'
  static createPincode: string = '/create/:code/:name'
  static updatePincode: string = '/update/:code/:name'
  static deletePincode: string = '/delete/:code/:name'

  static createPincodeGQL: string = `
    mutation createPincode($createpincodeinput: CreatePincodeInput!) {
      createPincode(input: $createpincodeinput) {
        code
        name
        desc
        branchType
        deliveryStatus
        circle
        state
        country
      }
    }
  `

  static listPincodeGQL: string = `
    query listPincodes {
      listPincodes {
        items {
          code
          name
          desc
          branchType
          deliveryStatus
          circle
          state
          country
        }
      }
    }
  `

  static deletePincodeGQL: string = `
    mutation deletePincode($deletepincodeinput: DeletePincodeInput!) {
      deletePincode(input: $deletepincodeinput) {
        code
        name
        desc
        branchType
        deliveryStatus
        circle
        state
        country
      }
    }
  `
}

export default PincodeV1Constants
