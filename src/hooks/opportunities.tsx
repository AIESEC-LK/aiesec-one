import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { OpportunityRequest } from "@/types/OpportunityRequest";
import { OpportunityResponse } from "@/types/OpportunityResponse";
import {
  API_ENDPOINTS,
  QUERY_KEYS,
  SHORT_LINK_PREFIXES
} from "@/lib/constants";
import { ResourceResponse } from "@/types/ResourceResponse";

function useCreateOpportunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (opportunity: OpportunityRequest) => {
      const formData = new FormData();
      const resourceData = {
        title: opportunity.title,
        description: opportunity.description,
        originalUrl: opportunity.originalUrl,
        shortLink: SHORT_LINK_PREFIXES.OPPORTUNITIES + opportunity.shortLink,
        deadline: opportunity.deadline
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
  return useQuery<OpportunityResponse[]>({
    queryKey: [QUERY_KEYS.OPPORTUNITIES],
    queryFn: async () => {
      const response = await fetch(API_ENDPOINTS.OPPORTUNITIES, {
        method: "GET"
      });
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const responseData = await response.json();

      // Filter the data based on the deadline date
      const currentDate = new Date();
      const filteredData = responseData.data.filter(
        (opportunity: OpportunityResponse) => {
          const deadlineDate = new Date(opportunity.deadline);
          return deadlineDate >= currentDate;
        }
      );

      return filteredData;
    },
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
        shortLink: SHORT_LINK_PREFIXES.OPPORTUNITIES + opportunity.shortLink,
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

export {
  useCreateOpportunity,
  useGetOpportunities,
  useUpdateOpportunity,
  useDeleteOpportunity
};
