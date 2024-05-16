import { UserProfile, UserAccessesData } from "@linz/lol-auth-js";

export const mockUser: UserProfile & UserAccessesData = {
  loginType: "EXTN",
  roles: ["CATEGORY_EXSU", "CATEGORY_SPIL"],
  profiles: ["PROFILE_EXTERNAL_SURVEY_USER"],
  firms: [
    {
      id: "firm4",
      name: "Firm 4",
      privileges: ["PRV_CREATE_SURVEY", "PRV_PRE_VALIDATE", "PRV_SURVEY_SIGN_SUBMIT", "PRV_VIEW_SURVEY"],
    },
  ],
  id: "extsurv1",
  idHash: "ta***t1_1_MbXLCA_BYmXik8k0K8YdzA==-luid-",
  givenNames: "Tacert",
  surname: "1",
  email: "example@.linz.govt.nz",
  preferredName: "Ext user 1",
  lastLogin: "2023-11-14T11:00:39",
};
