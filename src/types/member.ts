export type MemberGender = "男" | "女" | "不想透露";

export interface Member {
  id: number;
  name: string;
  gender: MemberGender;
  avatar?: string;
  city?: string;
  email?: string;
  website?: string;
  github?: string;
  linkedin?: string;
  skills?: string[];
  bio?: string;
  nickname?: string;
  githubUsername?: string;
  alternativeEmail?: string;
  achievements?: string[];
  position?: string;
  company?: string;
  details: any[];
}

export type MemberSortBy = "name" | "city" | "company" | "position";
export type MemberFilterBy =
  "gender" | "city" | "skills" | "hasGithub" | "hasWebsite";

export interface MemberSearchOptions {
  keyword?: string;
  gender?: MemberGender;
  city?: string;
  skill?: string;
  hasGithub?: boolean;
  hasWebsite?: boolean;
  sortBy?: MemberSortBy;
  limit?: number;
}
