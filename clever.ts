import { axiod, Base64, IAxiodResponse } from "./deps.ts";
import { ICleverConfig, ICleverProfile, ICleverUserInfo } from "./types.ts";

/**
 * A Clever SSO API Client for use with version 2.1 of their API. This client does not handle
 * features like rostering, but rather just the SSO flow for users who want to "Log In With Clever"
 * on your application.
 */
export default class CleverClient {
  constructor({ apiVersion = "v2.1", ...config }: ICleverConfig) {
    this.api = `https://api.clever.com/${apiVersion}`;
    this.basic = "Basic " +
      Base64.fromString(`${config.clientId}:${config.clientSecret}`);
    this.redirectURI = config.redirectURI;

    this.buttonURI = `https://clever.com/oauth/authorize?redirect_uri=${
      encodeURI(
        config.redirectURI,
      )
    }&response_type=code&client_id=${encodeURI(config.clientId)}`;
  }

  /** The Clever API URL */
  private api: string;
  /** The URI of your frontend Clever Redirect Page */
  private redirectURI: string;
  /** The basic auth that uses your client's config to get your user's token */
  private basic: string;
  /** This is the link that should open then a user clicks "Log in With Clever" */
  private buttonURI: string;

  /**
   * Returns the URL to redirect to when pressing "Log In With Clever" on your frontend client
   */
  public getLoginButtonURI() {
    return this.buttonURI;
  }

  /**
   * Uses the `code` query parameter passed when redirected to a Clever
   * redirect URI to get an access token for subsequent requests.
   *
   * @param code The `code` query param from a Clever redirect link
   * @returns the user's access token
   */
  public async getToken(
    code: string,
  ): Promise<IAxiodResponse & { data: { access_token: string } }> {
    try {
      return axiod.post(
        "https://clever.com/oauth/tokens",
        {
          code,
          grant_type: "authorization_code",
          redirect_uri: this.redirectURI,
        },
        { headers: { Authorization: this.basic } },
      );
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  /**
   * After using the redirect code to authenticate, pass the returned token into
   * this function to get information about the current authorized user, including
   * their type and unique Clever ID.
   *
   * @param token the token returned from `this.getToken()`
   * @returns information about the current authorized user
   */
  public async getUserInfo(
    token: string,
  ): Promise<IAxiodResponse & { data: ICleverUserInfo }> {
    try {
      return axiod.get(`${this.api}/me`, this.bearer(token));
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  /**
   * After getting the user's information with their authorization token,
   * we can get information about their profile from this function, including
   * their name and email address
   *
   * @param user the user from `this.getUserInfo()`
   * @param token the token returned from `this.getToken()`
   * @returns the user's profile including name and email address
   */
  public async getUserProfile(
    user: ICleverUserInfo,
    token: string,
  ): Promise<IAxiodResponse & { data: ICleverProfile }> {
    try {
      return axiod.get(
        `${this.api}/${user.type}/${user.data.id}`,
        this.bearer(token),
      );
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  private bearer(token: string) {
    return { headers: { Authorization: `Bearer ${token}` } };
  }
}
