import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { OpportunityRequest } from "@/types/OpportunityRequest";
import { OpportunityResponse } from "@/types/OpportunityResponse";
import {
  API_ENDPOINTS,
  QUERY_KEYS,
  SHORT_LINK_PREFIXES
} from "@/lib/constants";
import { ResourceResponse } from "@/types/ResourceResponse";
import { useAuth } from "./useAuth";

function useCreateOpportunity() {
  const { officeId, isLoading } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (opportunity: OpportunityRequest) => {
      if (isLoading || !officeId) {
        throw new Error("Office ID not yet available");
      }
      const formData = new FormData();
      const resourceData = {
        title: opportunity.title,
        description: opportunity.description,
        originalUrl: opportunity.originalUrl,
        shortLink: SHORT_LINK_PREFIXES.OPPORTUNITIES + opportunity.shortLink,
        deadline: opportunity.deadline,
        officeId: officeId
      };
      formData.append("data", JSON.stringify(resourceData));
      if (opportunity.coverImage) {
        formData.append("file", opportunity.coverImage);
      }

      const response = await fetch(API_ENDPOINTS.OPPORTUNITIES, {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.OPPORTUNITIES] })
  });
}

function useGetOpportunities() {
  const { officeId, isLoading } = useAuth();

  return useQuery<OpportunityResponse[]>({
    queryKey: [QUERY_KEYS.OPPORTUNITIES, officeId],
    queryFn: async () => {
      if (isLoading) {
        return { data: [], isLoading: true };
      }

      if (!officeId) {
        throw new Error("officeId is not defined");
      }

      const response = await fetch(
        `${API_ENDPOINTS.OPPORTUNITIES}?officeId=${officeId}`,
        {
          method: "GET"
        }
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const responseData = await response.json();
      return responseData.data;
    },
    enabled: !!officeId,
    refetchOnWindowFocus: false
  });
}

function useUpdateOpportunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (opportunity: OpportunityRequest) => {
      const formData = new FormData();
      const resourceData = {
        title: opportunity.title,
        description: opportunity.description,
        originalUrl: opportunity.originalUrl,
        shortLink:
          opportunity.shortLink &&
          (opportunity.shortLink.startsWith("https://one.aiesec.lk/opp/")
            ? opportunity.shortLink
            : "https://one.aiesec.lk/opp/".concat(opportunity.shortLink)),
        deadline: opportunity.deadline
      };
      formData.append("data", JSON.stringify(resourceData));
      if (opportunity.coverImage) {
        formData.append("file", opportunity.coverImage);
      }

      const response = await fetch(
        `${API_ENDPOINTS.OPPORTUNITIES}/${opportunity._id}`,
        {
          method: "PUT",
          body: formData
        }
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    },
    onMutate: (newOpportunityInfo: OpportunityRequest) => {
      queryClient.setQueryData(
        [QUERY_KEYS.OPPORTUNITIES],
        (prevOpportunities: any) =>
          prevOpportunities?.map((prevOpportunity: ResourceResponse) =>
            prevOpportunity._id === newOpportunityInfo._id
              ? newOpportunityInfo
              : prevOpportunity
          )
      );
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.OPPORTUNITIES] })
  });
}

function useDeleteOpportunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_ENDPOINTS.OPPORTUNITIES}/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    },
    onMutate: (id: string) => {
      queryClient.setQueryData(
        [QUERY_KEYS.OPPORTUNITIES],
        (prevOpportunities: any) =>
          prevOpportunities?.filter(
            (opportunityResponse: OpportunityResponse) =>
              opportunityResponse._id !== id
          )
      );
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["opportunities"] })
  });
}

async function shortLinkAvailability(shortLink: string) {
  const response = await fetch(
    `${API_ENDPOINTS.OPPORTUNITIES}?shortLink=${shortLink}`,
    {
      method: "GET"
    }
  );
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  const responseData = await response.json();
  return { exists: responseData.exists, message: responseData.message };
}

export {
  useCreateOpportunity,
  useGetOpportunities,
  useUpdateOpportunity,
  useDeleteOpportunity,
  shortLinkAvailability
};
