import { cookies } from "next/headers";
import { gql } from "@apollo/client";
import { runQuery, runQueryWithAccessToken } from "./graphql-utils";

const WHITELISTED_ENTITIES = [
  1623, // Sri Lanka
  459, // Benin
  1593, // Bolivia,
  1606, // Brazil,
  1551, // Colombia,
  577, // Costa Rica,
  1609, // Egypt
  1585, // India,
  1544, // Portugal,
  1560, // Romania,
  1559 // Tunisia
];

const VALID_OFFICE_IDS = [
  "1623", // Sri Lanka
  "222", //CC
  "872", //CN
  "1340", //CS
  "2204", //KANDY
  "1821", // MC SRI LANKA
  "4535", //NIBM
  "2186", //NSBM
  "5490", //RAJARATA
  "2175", //RUHUNA
  "2188", //SLIIT
  "221" //USJ
];

const ADMIN_MC = ["MCP", "MCVP"];

const ADMIN_LC = ["LCP", "LCVP"];

export function isPersonIdPresent(): boolean {
  const personId = cookies().get("person_id");
  return !!(
    personId?.value &&
    personId.value !== "" &&
    personId.value !== null
  );
}

export async function getPersonId(accessToken?: string): Promise<number> {
  console.log("☠ Starting getPersonId function");
  const personId = cookies().get("person_id");
  if (personId?.value && personId.value !== "" && personId.value !== null) {
    console.log("Returning personId from cookie:", personId.value);
    return parseInt(personId.value);
  }

  const query = gql`
    {
      currentPerson {
        id
      }
    }
  `;

  try {
    let queryResponse;
    if (accessToken) {
      console.log("🐖 Attempting query with access token");
      queryResponse = await runQueryWithAccessToken(accessToken, query);
    } else {
      console.log("🐪 Attempting query without access token");
      queryResponse = await runQuery(query);
    }

    if (
      !queryResponse ||
      !queryResponse.currentPerson ||
      !queryResponse.currentPerson.id
    ) {
      console.error("Invalid response structure:", queryResponse);
      throw new Error("Invalid response structure");
    }

    console.log(
      "Successfully retrieved personId:",
      queryResponse.currentPerson.id
    );
    return queryResponse.currentPerson.id;
  } catch (error) {
    console.error("Error in getPersonId:", error);
    if (
      (error as any).networkError &&
      (error as any).networkError.statusCode === 406
    ) {
      console.error("Network error details:", (error as any).networkError);
      if ((error as any).networkError.statusCode === 406) {
        console.error(
          "Received 406 Not Acceptable error. Check content negotiation headers and account type."
        );
      }
    }
    if ((error as any).graphQLErrors) {
      console.error("GraphQL errors:", (error as any).graphQLErrors);
    }
    throw error;
  }
}
export async function isAiEbMember(): Promise<boolean> {
  const query = gql`
    {
      currentPerson {
        is_ai_eb_member
      }
    }
  `;

  const queryResponse = await runQuery(query);
  return queryResponse.currentPerson.is_ai_eb_member;
}

export async function forceGetPersonId(accessToken?: string): Promise<number> {
  const query = gql`
    {
      currentPerson {
        id
      }
    }
  `;

  let queryResponse;
  if (accessToken) {
    queryResponse = await runQueryWithAccessToken(accessToken!, query);
  } else {
    queryResponse = await runQuery(query);
  }

  return queryResponse.currentPerson.id;
}

export async function isAiesecer(): Promise<boolean> {
  const query = gql`
        {
            person(id: "${await getPersonId()}") {
                is_aiesecer
            }
        }
    `;

  try {
    const queryResponse = await runQuery(query);
    return queryResponse.person.is_aiesecer;
  } catch (e) {
    return false;
  }
}

export async function getAccessibleEntitiesWithNames(): Promise<
  { id: number; name: string }[]
> {
  const officeIds = [];

  const query = gql`
    {
      currentPerson {
        current_offices {
          id
          name
          tag
          parent {
            id
            tag
          }
          suboffices {
            id
            name
            tag
            parent {
              id
              tag
            }
            suboffices {
              id
              name
              tag
              parent {
                id
                tag
              }
              suboffices {
                id
                name
                tag
                parent {
                  id
                  tag
                }
              }
            }
          }
        }
      }
    }
  `;

  const queryResponse = await runQuery(query);
  console.log(queryResponse.currentPerson.current_offices);

  for (const office of queryResponse.currentPerson.current_offices) {
    if (
      office.tag == "MC" &&
      !WHITELISTED_ENTITIES.includes(parseInt(office.id))
    )
      continue;
    if (
      office.parent &&
      office.parent.tag == "MC" &&
      !WHITELISTED_ENTITIES.includes(parseInt(office.parent.id))
    )
      continue;
    officeIds.push({ id: parseInt(office.id), name: office.name });

    for (const suboffice of office.suboffices) {
      if (
        suboffice.tag == "MC" &&
        !WHITELISTED_ENTITIES.includes(parseInt(suboffice.id))
      )
        continue;
      if (
        suboffice.parent &&
        suboffice.parent.tag == "MC" &&
        !WHITELISTED_ENTITIES.includes(parseInt(suboffice.parent.id))
      )
        continue;
      officeIds.push({ id: parseInt(suboffice.id), name: suboffice.name });

      for (const subsuboffice of suboffice.suboffices) {
        if (
          subsuboffice.tag == "MC" &&
          !WHITELISTED_ENTITIES.includes(parseInt(subsuboffice.id))
        )
          continue;
        if (
          subsuboffice.parent &&
          subsuboffice.parent.tag == "MC" &&
          !WHITELISTED_ENTITIES.includes(parseInt(subsuboffice.parent.id))
        )
          continue;
        officeIds.push({
          id: parseInt(subsuboffice.id),
          name: subsuboffice.name
        });

        for (const subsubsuboffice of subsuboffice.suboffices) {
          if (
            subsubsuboffice.tag == "MC" &&
            !WHITELISTED_ENTITIES.includes(parseInt(subsubsuboffice.id))
          )
            continue;
          if (
            subsubsuboffice.parent &&
            subsubsuboffice.parent.tag == "MC" &&
            !WHITELISTED_ENTITIES.includes(parseInt(subsubsuboffice.parent.id))
          )
            continue;
          officeIds.push({
            id: parseInt(subsubsuboffice.id),
            name: subsubsuboffice.name
          });
        }
      }
    }
  }

  //remove duplicate office IDs
  return officeIds.filter(
    (office, index, self) => index === self.findIndex((t) => t.id === office.id)
  );
}

export async function getCurrentPersonUserRole() {
  let role = "MEMBER";
  let personId = "";
  let isValidOffice = false;

  const query = gql`
    {
      currentPerson {
        id
        full_name
        current_positions {
          id
          office {
            id
            tag
            name
          }
          role {
            id
            tag
            name
          }
        }
      }
    }
  `;

  const queryResponse = await runQuery(query, { fetchPolicy: "network-only" });

  console.log(queryResponse.currentPerson);

  personId = queryResponse.currentPerson.id;
  for (const position of queryResponse.currentPerson.current_positions) {
    if (VALID_OFFICE_IDS.includes(position.office.id)) {
      console.log(position.office.id);
      isValidOffice = true;
      break;
    }
  }

  if (!isValidOffice) {
    throw new Error("Unauthorized");
  }

  for (const position of queryResponse.currentPerson.current_positions) {
    if (ADMIN_MC.includes(position.role.name)) {
      role = "ADMIN_MC";
      break;
    }
    if (ADMIN_LC.includes(position.role.name) && role !== "ADMIN_MC") {
      role = "ADMIN_LC";
    }
  }

  return { role, personId };
}
