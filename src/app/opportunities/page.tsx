"use client";

import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "mantine-react-table/styles.css";
import React, { ChangeEvent, useMemo, useState } from "react";
import {
  MantineReactTable,
  type MRT_ColumnDef,
  MRT_EditActionButtons,
  type MRT_Row,
  type MRT_TableOptions,
  useMantineReactTable
} from "mantine-react-table";
import {
  ActionIcon,
  Box,
  Button,
  Flex,
  Stack,
  Text,
  Title,
  Tooltip
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { IconEdit, IconLink, IconTrash } from "@tabler/icons-react";
import classes from "./opportunities.module.scss";
import { OpportunityResponse } from "@/types/OpportunityResponse";
import {
  useCreateOpportunity,
  useDeleteOpportunity,
  useGetOpportunities,
  useUpdateOpportunity
} from "@/hooks/opportunities";
import { validateRequired, validateUrl } from "@/util/dataUtils";

function validateOpportunity(opportunity: OpportunityResponse) {
  return {
    title: !validateRequired(opportunity.title) ? "Title is Required" : "",
    // description: !validateRequired(opportunity.description) ? "Description is Required" : "",
    originalUrl: !validateRequired(opportunity.originalUrl)
      ? "Original URL is required"
      : !validateUrl(opportunity.originalUrl)
        ? "Invalid URL, please enter full URL"
        : "",
    shortLink: !validateRequired(opportunity.shortLink)
      ? "Short link is required"
      : "",
    deadline: !validateRequired(opportunity.deadline)
      ? "Deadline is Required"
      : ""
  };
}

const OpportunitiesPage = () => {
  const [fileInModal, setFileInModal] = React.useState<File>();
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string | undefined>
  >({});
  const [shortLinkInModal, setShortLinkInModal] = useState<string>("");

  const resetInputs = () => {
    setValidationErrors({});
    setShortLinkInModal("");
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFileInModal(event.target.files[0]);
    }
  };

  const columns = useMemo<MRT_ColumnDef<OpportunityResponse>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Title",
        mantineEditTextInputProps: {
          type: "text",
          required: true,
          error: validationErrors?.title
        }
      },
      {
        accessorKey: "description",
        header: "Description",
        enableSorting: false,
        enableColumnActions: false,
        mantineEditTextInputProps: {
          type: "text",
          error: validationErrors?.description,
          onFocus: () =>
            setValidationErrors({
              ...validationErrors,
              description: undefined
            })
        }
      },
      {
        accessorKey: "originalUrl",
        header: "Original URL",
        enableClickToCopy: true,
        enableSorting: false,
        enableColumnActions: false,
        mantineEditTextInputProps: {
          type: "url",
          required: true,
          error: validationErrors?.link,
          onFocus: () =>
            setValidationErrors({
              ...validationErrors,
              link: undefined
            })
        }
      },
      {
        accessorKey: "shortLink",
        header: "Short Link",
        enableClickToCopy: true,
        mantineEditTextInputProps: ({ cell, column, row, table }) => {
          return {
            type: "text",
            inputWrapperOrder: ["label", "input", "error", "description"],
            description: (
              <span
                style={{
                  paddingTop: 10,
                  fontSize: "1.2em",
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8
                }}
              >
                <IconLink size={16} /> https://one.aiesec.lk/opp/
                {shortLinkInModal}
              </span>
            ),
            required: true,
            error: validationErrors?.url,
            onChange: (event: ChangeEvent<HTMLInputElement>) => {
              setShortLinkInModal(event.target.value);
            },
            onFocus: () =>
              setValidationErrors({
                ...validationErrors,
                url: undefined
              })
          };
        }
      },
      {
        accessorKey: "coverImage",
        header: "Cover Image",
        mantineEditTextInputProps: {
          type: "file",
          onChange: handleFileChange,
          required: false,
          accept: "image/png,image/jpeg,image/jpg"
          // error: validationErrors?.title
        }
      },
      {
        accessorKey: "deadline",
        header: "Deadline",
        mantineEditTextInputProps: {
          type: "date",
          required: true
        }
      }
    ],
    [validationErrors, shortLinkInModal]
  );

  // Custom hooks for CRUD operations
  // @ts-ignore
  const { mutateAsync: createOpportunity, isLoading: isCreatingOpportunity } =
    useCreateOpportunity();
  const {
    data: fetchedOpportunities = [],
    isError: isLoadingOpportunitiesError,
    isFetching: isFetchingOpportunities,
    isLoading: isLoadingOpportunities
  } = useGetOpportunities();
  // @ts-ignore
  const { mutateAsync: updateOpportunity, isLoading: isUpdatingOpportunity } =
    useUpdateOpportunity();
  // @ts-ignore
  const { mutateAsync: deleteOpportunity, isLoading: isDeletingOpportunity } =
    useDeleteOpportunity();

  // Handlers for CRUD operations
  const handleCreateOpportunity: MRT_TableOptions<OpportunityResponse>["onCreatingRowSave"] =
    async ({ values, exitCreatingMode }) => {
      const newValidationErrors = validateOpportunity(values);
      if (Object.values(newValidationErrors).some((error) => error)) {
        setValidationErrors(newValidationErrors);
        return;
      }
      resetInputs();

      values.coverImage = fileInModal;
      await createOpportunity(values);
      exitCreatingMode();
    };

  const handleEditOpportunity: MRT_TableOptions<OpportunityResponse>["onEditingRowSave"] =
    async ({ row, values, table }) => {
      const newValidationErrors = validateOpportunity(values);
      if (Object.values(newValidationErrors).some((error) => error)) {
        setValidationErrors(newValidationErrors);
        return;
      }
      resetInputs();

      values.img = fileInModal;
      await updateOpportunity({ ...values, _id: row.original._id });
      table.setEditingRow(null); //exit editing mode
    };

  const openDeleteConfirmModal = (row: MRT_Row<OpportunityResponse>) =>
    modals.openConfirmModal({
      title: "Confirmation",
      children: (
        <Text>
          Are you sure you want to delete this record? This action cannot be
          undone.
        </Text>
      ),
      labels: { confirm: "Delete", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: () => deleteOpportunity(row.original._id)
    });

  const table = useMantineReactTable({
    columns,
    data: fetchedOpportunities,
    initialState: {
      columnVisibility: {
        coverImage: false
      }
    },
    createDisplayMode: "modal", //default ('row', and 'custom' are also available)
    editDisplayMode: "modal", //default ('row', 'cell', 'table', and 'custom' are also available)
    enableEditing: true,
    getRowId: (row) => row._id,
    mantineToolbarAlertBannerProps: isLoadingOpportunitiesError
      ? {
          color: "red",
          children: "Error loading data"
        }
      : undefined,
    mantineTableContainerProps: {
      style: {
        minHeight: "500px"
      }
    },
    onCreatingRowCancel: resetInputs,
    onCreatingRowSave: handleCreateOpportunity,
    onEditingRowCancel: () => resetInputs,
    onEditingRowSave: handleEditOpportunity,
    positionActionsColumn: "last",
    renderCreateRowModalContent: ({ table, row, internalEditComponents }) => (
      <Stack>
        <Title order={3}>Create Opportunity</Title>
        {internalEditComponents}
        <Flex justify="flex-end" mt="xl">
          <MRT_EditActionButtons variant="text" table={table} row={row} />
        </Flex>
      </Stack>
    ),
    renderEditRowModalContent: ({ table, row, internalEditComponents }) => (
      <Stack>
        <Title order={3}>Edit Opportunity</Title>
        {internalEditComponents}
        <Flex justify="flex-end" mt="xl">
          <MRT_EditActionButtons variant="text" table={table} row={row} />
        </Flex>
      </Stack>
    ),
    renderRowActions: ({ row, table }) => (
      <Flex gap="md">
        <Tooltip label="Edit">
          <ActionIcon
            variant="subtle"
            size="sm"
            onClick={() => table.setEditingRow(row)}
          >
            <IconEdit />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Delete">
          <ActionIcon
            variant="subtle"
            size="sm"
            color="red"
            onClick={() => openDeleteConfirmModal(row)}
          >
            <IconTrash />
          </ActionIcon>
        </Tooltip>
      </Flex>
    ),
    state: {
      isLoading: isLoadingOpportunities,
      isSaving:
        isCreatingOpportunity || isUpdatingOpportunity || isDeletingOpportunity,
      showAlertBanner: isLoadingOpportunitiesError
    }
  });

  return (
    <div className={classes.body}>
      <Box
        my={20}
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between"
        }}
      >
        <Title mt={8} mb={24} order={1} style={{ color: "#1C7ED6" }}>
          Opportunities
        </Title>
        <Button
          onClick={() => {
            table.setCreatingRow(true);
          }}
        >
          Create Opportunity
        </Button>
      </Box>
      <div>
        <MantineReactTable table={table} />
      </div>
    </div>
  );
};

export default OpportunitiesPage;
