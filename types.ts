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
