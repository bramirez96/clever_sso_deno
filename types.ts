export interface ICleverProfile {
  data: {
    id: string;
    email?: string;
    name: { first: string; last: string; middle?: string };
    district?: string;
  };
  links: ICleverLink[];
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
  links: ICleverLink[];
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
  userType: string;
};

export interface ICleverSection {
  id: string;
  teacher: string;
  teachers: string[];
  name: string;
  subject: CleverSubjectType;
  students: string[];
  grade: CleverGradeType;
}

export type CleverSubjectType =
  | "english/language arts"
  | "math"
  | "science"
  | "social studies"
  | "language"
  | "homeroom/advisory"
  | "interventions/online learning"
  | "technology and engineering"
  | "PE and health"
  | "arts and music"
  | "other"
  | "";

export type CleverGradeType =
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "11"
  | "12"
  | "13"
  | "PreKindergarten"
  | "TransitionalKindergarten"
  | "Kindergarten"
  | "InfantToddler"
  | "Preschool"
  | "PostGraduate"
  | "Ungraded"
  | "Other"
  | "";

interface ICleverLink {
  rel: string;
  uri: string;
}
