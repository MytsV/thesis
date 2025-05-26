import { ColumnViewModel, FileViewModel, ViewType } from "@/lib/types";
import React, { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createDiscreteColumnChartView,
  createSimpleTableView,
  listFileColumns,
} from "@/lib/client-api";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import CreateSimpleTableView from "@/components/workspace/CreateSimpleTableView";
import CreateDiscreteColumnChartView from "@/components/workspace/CreateDiscreteColumnChartView";

interface CreateDiscreteColumnChartViewProps {
  availableFiles: FileViewModel[];
  projectId: string;
  openViewType: ViewType | null;
  setOpenViewType: (viewType: ViewType | null) => void;
}

export default function CreateDiscreteColumnChartViewDialog(
  props: CreateDiscreteColumnChartViewProps,
) {
  const [name, setName] = useState<string>("");
  const [selectedFileId, setSelectedFileId] = useState<number | null>(null);
  const [selectedColumnId, setSelectedColumnId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: ({
      fileId,
      columnId,
    }: {
      fileId: number;
      columnId: number;
    }) => {
      return createDiscreteColumnChartView(props.projectId, {
        name,
        fileId,
        columnId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["views", props.projectId],
        refetchType: "active",
      });
      toast("View created successfully");
    },
    onError: (error: Error) => {
      toast.error("Couldn't create a view", { description: error.message });
    },
  });

  useEffect(() => {
    setSelectedColumnId(null);
  }, [selectedFileId]);

  const columnsQuery = useCallback(async () => {
    if (!selectedFileId) throw new Error("File ID is required");
    const response = await listFileColumns(selectedFileId);
    return response.columns;
  }, [selectedFileId]);

  const {
    data: columns,
    error: columnsError,
    isFetching: columnsLoading,
  } = useQuery<ColumnViewModel[]>({
    queryKey: ["columns", selectedFileId],
    queryFn: columnsQuery,
  });

  const onSubmit = () => {
    if (!selectedFileId) {
      toast.error("Please select a file");
      return;
    }
    if (!selectedColumnId) {
      toast.error("Please select a column");
      return;
    }
    createMutation.mutate({
      fileId: selectedFileId,
      columnId: selectedColumnId,
    });
    props.setOpenViewType(null);
  };

  return (
    <Dialog
      open={props.openViewType === ViewType.DISCRETE_COLUMN_CHART}
      onOpenChange={(open) => {
        if (!open) {
          props.setOpenViewType(null);
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Discrete Column Chart View</DialogTitle>
        </DialogHeader>
        <CreateDiscreteColumnChartView
          availableFiles={props.availableFiles}
          availableColumns={columns}
          onColumnSelect={setSelectedColumnId}
          setName={setName}
          onFileSelect={setSelectedFileId}
          onSubmit={onSubmit}
          name={name}
        />
      </DialogContent>
    </Dialog>
  );
}
