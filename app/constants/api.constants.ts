export default class ApiConstants {
  static gqlApiEndpoint = (): string => process.env.GRAPHQL_ENDPOINT ?? ''
  static gqlApiKey = (): string => process.env.GRAPHQL_API_KEY ?? ''
}
