export interface ICleverProfile {
  id: string;
  email?: string;
  name: { first: string; last: string; middle?: string };
  district?: string;
}

export interface ICleverConfig {
  clientId: string;
  clientSecret: string;
  redirectURI: string;
  apiVersion?: string;
  logger?: (...data: unknown[]) => void;
}

export interface ICleverUserInfo<UserType extends string = cleverUserType> {
  type: UserType;
  data: {
    id: string;
    district: string;
    type: UserType;
    authorized_by: string;
  };
  links: { rel: string; uri: string }[];
}

export type cleverUserType = "teacher" | "student";

export interface IAuthorizationConfig<UserType> {
  code: string;
  getUserByCleverId: (
    cleverId: string,
  ) => Promise<UserType | undefined>;
  getUserByEmail: (
    email: string,
  ) => Promise<UserType | undefined>;
}

export type IAuthorizationResponse<UserType> = {
  status: "SUCCESS" | "MERGE";
  body: UserType;
  cleverId: string;
} | {
  status: "NEW";
  body: ICleverProfile;
  cleverId: string;
};
