import { UserAccessesData, UserProfile } from "@linz/lol-auth-js";

export const singleFirmUserExtsurv1: UserAccessesData & UserProfile = {
  profiles: ["51 - EXT SURVEY"],
  id: "extsurv1",
  idHash: "ex*******01_1_jqNEotb0IGycQdWUCIC6MQ==-luid-",
  email: "loluat@linz.govt.nz",
  givenNames: "External",
  surname: "Surveyor 1",
  preferredName: "External Surveyor 1",
  roles: ["CATEGORY_EXSU", "CATEGORY_SURV"],
  firms: [
    {
      id: "linznowe",
      name: "LINZ National Operations",
      privileges: [],
    },
  ],
  loginType: "EXTN",
};
