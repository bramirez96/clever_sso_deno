import { axiod, Base64 } from "./cleverDeps.ts";
import {
  IAuthorizationConfig,
  IAuthorizationResponse,
  ICleverConfig,
  ICleverProfile,
  ICleverUserInfo,
} from "./types.ts";

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
   * This method exists to give you the option to autmoate the SSO flow. It requires
   * passing in two functions that query your database. Both functions:
   * 
   * 1. Should asynchronously access your database
   * 2. Should return a complete `User` object, however that looks in your application
   * 
   * `getUserByCleverId` should return a complete user object from your database, and should
   * be retrieved by their Clever SSO string ID.
   * 
   * `getUserByEmail` should return a complete user object from your database, and should
   * be retrieved by their email address.
   * 
   * `code` should be the code passed to your Clever Redirect URI on your frontend by the
   * Clever API.
   */
  public async ssoAuthWithCode<
    UserType = {},
  >({
    code,
    getUserByCleverId,
    getUserByEmail,
  }: IAuthorizationConfig<UserType>): Promise<
    IAuthorizationResponse<UserType>
  > {
    try {
      console.log("Acquiring token");
      const token = await this.getToken(code);

      console.log("Acquiring user information");
      const userInfo = await this.getUserInfo(token);

      console.log("Checking if clever user exists in your database");
      const existingUser = await getUserByCleverId(userInfo.data.id);

      if (existingUser) {
        // The user exists! Sign them in to your application
        console.log("User successfully authenticated with Clever.");
        return {
          status: "SUCCESS",
          body: existingUser,
          cleverId: userInfo.data.id,
        };
      } else {
        // The user has not connected an account to Clever yet. Check if they have
        // an existing, non-linked account with your service.
        console.log(
          "User could be be authenticated with ID. Fetching more information.",
        );
        const userProfile = await this.getUserProfile(userInfo, token);

        if (userProfile.email) {
          const userToMerge = await getUserByEmail(userProfile.email);
          if (userToMerge) {
            console.log(
              "User found with matching ID. Have them log in and merge their accounts.",
            );
            return {
              status: "MERGE",
              body: userToMerge,
              cleverId: userInfo.data.id,
            };
          }
        }

        // With no email address we can't automatically verify if the user has an account
        // with your service, so we return a NEW status. You can either take them to a
        // new account creation, or give them the option to sign in and merge accounts.
        console.log(
          "User could not be authenticated.",
          "Give them the option to sign in, or have them create a new account with your service.",
        );
        return {
          status: "NEW",
          body: userProfile,
          cleverId: userInfo.data.id,
          userType: userInfo.type,
        };
      }
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  /**
   * Uses the `code` query parameter passed when redirected to a Clever
   * redirect URI to get an access token for subsequent requests.
   *
   * @param code The `code` query param from a Clever redirect link
   * @returns the user's access token
   */
  public async getToken(code: string): Promise<string> {
    try {
      const { data } = await axiod.post(
        "https://clever.com/oauth/tokens",
        {
          code,
          grant_type: "authorization_code",
          redirect_uri: this.redirectURI,
        },
        { headers: { Authorization: this.basic } },
      );

      return data.access_token;
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
  public async getUserInfo(token: string): Promise<ICleverUserInfo> {
    try {
      const { data } = await axiod.get(`${this.api}/me`, this.bearer(token));
      return data;
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
  ): Promise<ICleverProfile> {
    try {
      const { data } = await axiod.get(
        `${this.api}/${user.type}/${user.data.id}`,
        this.bearer(token),
      );
      return data;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  private bearer(token: string) {
    return { headers: { Authorization: `Bearer ${token}` } };
  }
}
