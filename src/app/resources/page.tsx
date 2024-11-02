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
import classes from "./resources.module.scss";
import { ResourceResponse } from "@/types/ResourceResponse";
import {
  useCreateResource,
  useDeleteResource,
  useGetResources,
  useUpdateResource
} from "@/hooks/resources";
import { validateRequired, validateUrl } from "@/util/dataUtils";
import { useAuth } from "@/hooks/useAuth";

function validateResource(resource: ResourceResponse) {
  return {
    title: !validateRequired(resource.title) ? "Title is Required" : "",
    // description: !validateRequired(resource.description) ? "Description is Required" : "",
    originalUrl: !validateRequired(resource.originalUrl)
      ? "Original URL is required"
      : !validateUrl(resource.originalUrl)
        ? "Invalid URL, please enter full URL"
        : "",
    shortLink: !validateRequired(resource.shortLink)
      ? "Short link is required"
      : "",
    // functions: !validateRequired(resource.functions) ? "Functions are Required" : "",
    keywords: !validateRequired(resource.keywords)
      ? "Keywords are Required"
      : ""
  };
}

const ResourcesPage = () => {
  const { userType } = useAuth();
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string | undefined>
  >({});

  const [shortLinkInModal, setShortLinkInModal] = useState<string>("");

  const resetInputs = () => {
    setValidationErrors({});
    setShortLinkInModal("");
  };

  const columns = useMemo<MRT_ColumnDef<ResourceResponse>[]>(
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
                  gap: 8,
                  maxWidth: "100%",
                  overflow: "visible",
                  whiteSpace: "normal",
                  wordWrap: "break-word"
                }}
              >
                <IconLink size={16} />
                <span style={{ flexShrink: 1, overflowWrap: "break-word" }}>
                  https://one.aiesec.lk/r/ {shortLinkInModal}
                </span>
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
        accessorKey: "functions",
        header: "Functions",
        description: "Comma separated list of functions",
        mantineEditTextInputProps: {
          type: "text",
          required: true,
          error: validationErrors?.functions,
          onFocus: () =>
            setValidationErrors({
              ...validationErrors,
              functions: undefined
            })
        }
      },
      {
        accessorKey: "keywords",
        header: "Keywords",
        description: "Comma separated list of keywords",
        mantineEditTextInputProps: {
          type: "text",
          required: true,
          error: validationErrors?.keywords,
          onFocus: () =>
            setValidationErrors({
              ...validationErrors,
              keywords: undefined
            })
        }
      }
    ],
    [validationErrors, shortLinkInModal]
  );

  // Custom hooks for CRUD operations
  // @ts-ignore
  const { mutateAsync: createResource, isLoading: isCreatingResource } =
    useCreateResource();
  const {
    data: fetchedResources = [],
    isError: isLoadingResourcesError,
    isFetching: isFetchingResources,
    isLoading: isLoadingResources
  } = useGetResources();
  // @ts-ignore
  const { mutateAsync: updateResource, isLoading: isUpdatingResource } =
    useUpdateResource();
  // @ts-ignore
  const { mutateAsync: deleteResource, isLoading: isDeletingResource } =
    useDeleteResource();

  // Handlers for CRUD operations
  const handleCreateResource: MRT_TableOptions<ResourceResponse>["onCreatingRowSave"] =
    async ({ values, exitCreatingMode }) => {
      const newValidationErrors = validateResource(values);
      if (Object.values(newValidationErrors).some((error) => error)) {
        setValidationErrors(newValidationErrors);
        return;
      }
      resetInputs();
      await createResource(values);
      exitCreatingMode();
    };

  const handleEditResource: MRT_TableOptions<ResourceResponse>["onEditingRowSave"] =
    async ({ row, values, table }) => {
      const newValidationErrors = validateResource(values);
      if (Object.values(newValidationErrors).some((error) => error)) {
        setValidationErrors(newValidationErrors);
        return;
      }
      resetInputs();
      console.log(values);
      await updateResource({ ...values, _id: row.original._id });
      table.setEditingRow(null); //exit editing mode
    };

  const openDeleteConfirmModal = (row: MRT_Row<ResourceResponse>) =>
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
      onConfirm: () => deleteResource(row.original._id)
    });

  const table = useMantineReactTable({
    columns,
    data: fetchedResources,
    createDisplayMode: "modal", //default ('row', and 'custom' are also available)
    editDisplayMode: "modal", //default ('row', 'cell', 'table', and 'custom' are also available)
    enableEditing: true,
    getRowId: (row) => row._id,
    enableRowActions: false,

    mantineToolbarAlertBannerProps: isLoadingResourcesError
      ? {
          color: "red",
          children: "Error loading data"
        }
      : undefined,
    mantineTableContainerProps: {
      style: {
        minHeight: "500px",
        overflowX: "auto"
      }
    },
    onCreatingRowCancel: () => resetInputs(),
    onCreatingRowSave: handleCreateResource,
    onEditingRowCancel: () => resetInputs(),
    onEditingRowSave: handleEditResource,
    positionActionsColumn: "last",

    renderCreateRowModalContent: ({ table, row, internalEditComponents }) => (
      <Stack>
        <Title order={3}>Create Resource</Title>
        {internalEditComponents}
        <Flex justify="flex-end" mt="xl">
          <MRT_EditActionButtons variant="text" table={table} row={row} />
        </Flex>
      </Stack>
    ),
    renderEditRowModalContent: ({ table, row, internalEditComponents }) => (
      <Stack>
        <Title order={3}>Edit Resource</Title>
        {internalEditComponents}
        <Flex justify="flex-end" mt="xl">
          <MRT_EditActionButtons variant="text" table={table} row={row} />
        </Flex>
      </Stack>
    ),
    renderRowActions: ({ row, table }) => {
      return (
        <Flex gap="md">
          {["ADMIN_MC", "ADMIN_LC"].includes(
            userType ? userType : "MEMBER"
          ) && (
            <>
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
            </>
          )}
        </Flex>
      );
    },
    state: {
      isLoading: isLoadingResources,
      isSaving: isCreatingResource || isUpdatingResource || isDeletingResource,
      showAlertBanner: isLoadingResourcesError
    }
  });

  return (
    <div className={classes.body}>
      <Box className={classes.box}>
        <Title
          className={classes.title}
          mt={8}
          mb={20}
          ml={15}
          order={1}
          style={{
            color: "#1C7ED6"
          }}
        >
          Resources
        </Title>
        <Button
          className={classes.button}
          onClick={() => {
            table.setCreatingRow(true);
          }}
        >
          Create Resource
        </Button>
      </Box>
      <div>
        <MantineReactTable table={table} />
      </div>
    </div>
  );
};

export default ResourcesPage;
