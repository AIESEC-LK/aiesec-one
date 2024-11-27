"use client";

import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "mantine-react-table/styles.css";
import React, {
  ChangeEvent,
  Fragment,
  useEffect,
  useMemo,
  useState
} from "react";
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
import { IconEdit, IconLink, IconTrash, IconEye } from "@tabler/icons-react";
import classes from "./opportunities.module.scss";
import { OpportunityResponse } from "@/types/OpportunityResponse";
import {
  useCreateOpportunity,
  useDeleteOpportunity,
  useGetOpportunities,
  useUpdateOpportunity,
  shortLinkAvailability
} from "@/hooks/opportunities";
import { validateRequired, validateUrl } from "@/util/dataUtils";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import debounce from "lodash/debounce";
import { USER_TYPE } from "@/constants/common.constants";

function validateOpportunity(
  opportunity: OpportunityResponse,
  shortLinkStatus: Boolean
) {
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
      : !shortLinkStatus
        ? "Link is not available"
        : "",
    deadline: !validateRequired(opportunity.deadline)
      ? "Deadline is Required"
      : ""
  };
}

const OpportunitiesPage = () => {
  const { userType, officeId, isLoading } = useAuth();
  const [fileInModal, setFileInModal] = React.useState<File>();
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string | undefined>
  >({});
  const [shortLinkInModal, setShortLinkInModal] = useState<string>("");
  const [shortLinkStatus, setShortLinkStatus] = useState<boolean>(false);

  const resetInputs = () => {
    setValidationErrors({});
    setShortLinkInModal("");
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFileInModal(event.target.files[0]);
    }
  };

  const checkShortLinkAvailability = (shortLinkInModal: string) => {
    shortLinkAvailability(shortLinkInModal)
      .then((data) => {
        if (data.exists) {
          setShortLinkStatus(false); //not available
        } else {
          setShortLinkStatus(true); // available
        }
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const debouncedCheckAvailability = debounce((newShortLink: string) => {
    checkShortLinkAvailability(newShortLink);
  }, 2000);

  const columns = useMemo<MRT_ColumnDef<OpportunityResponse>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Title",
        mantineEditTextInputProps: {
          type: "text",
          required: true,
          error: validationErrors?.title
        },
        size: 150,
        maxSize: 175
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
        },
        size: 250,
        mazSize: 280
      },
      {
        accessorKey: "originalUrl",
        header: "Application Link",
        enableClickToCopy: true,
        enableSorting: false,
        enableColumnActions: false,
        mantineEditTextInputProps: {
          type: "url",
          required: true,
          error: validationErrors?.originalUrl,
          onFocus: () =>
            setValidationErrors({
              ...validationErrors,
              link: undefined
            })
        }
      },
      {
        accessorKey: "shortLink",
        header: "Opportunity Link",
        enableClickToCopy: true,
        mantineEditTextInputProps: ({ cell, column, row, table }) => {
          const initialShortLink = String(cell.getValue())?.replace(
            "https://one.aiesec.lk/opp/",
            ""
          );

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
                <IconLink size={16} /> https://one.aiesec.lk/opp/
                {shortLinkInModal || initialShortLink}
              </span>
            ),
            required: true,
            error: validationErrors?.shortLink,
            value: shortLinkInModal || initialShortLink,
            onChange: (event: ChangeEvent<HTMLInputElement>) => {
              const newShortLink = event.target.value;
              setShortLinkInModal(newShortLink);

              // Only check availability if the short link has changed
              if (newShortLink !== initialShortLink) {
                debouncedCheckAvailability(newShortLink);
              }
            },
            onFocus: () =>
              setValidationErrors({ ...validationErrors, url: undefined })
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
          required: true,
          error: validationErrors?.deadline,
          onFocus: () =>
            setValidationErrors({
              ...validationErrors,
              url: undefined
            })
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
      const newValidationErrors = validateOpportunity(values, shortLinkStatus);
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
      const newValidationErrors = validateOpportunity(values, shortLinkStatus);
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

  const router = useRouter();

  const handleView = (row: MRT_Row<OpportunityResponse>) => {
    const urlWithId = `${row.original.shortLink}`;
    router.push(urlWithId);
  };

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
        minHeight: "500px",
        overflowX: "auto"
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
      <Flex gap="md" justify="center">
        {(USER_TYPE.ADMIN_MC === userType ||
          row.original.officeId === officeId) && (
          <Fragment>
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
          </Fragment>
        )}
        <Tooltip label="View">
          <ActionIcon
            variant="subtle"
            size="sm"
            onClick={() => handleView(row)}
          >
            <IconEye />
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
      <Box className={classes.box}>
        <Title
          className={classes.title}
          mt={8}
          mb={20}
          ml={15}
          order={1}
          style={{ color: "#1C7ED6" }}
        >
          Opportunities
        </Title>
        <Button
          className={classes.button}
          onClick={() => {
            table.setCreatingRow(true);
          }}
        >
          Create Opportunity
        </Button>
      </Box>
      <div style={{ overflowX: "auto", width: "100%" }}>
        <MantineReactTable table={table} />
      </div>
    </div>
  );
};

export default OpportunitiesPage;
