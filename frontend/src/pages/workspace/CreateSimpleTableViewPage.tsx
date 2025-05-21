import { FileViewModel, ViewType } from "@/lib/types";
import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createSimpleTableView } from "@/lib/client-api";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import CreateSimpleTableView from "@/components/workspace/CreateSimpleTableView";

interface CreateSimpleTableViewProps {
  availableFiles: FileViewModel[];
  projectId: string;
  openViewType: ViewType | null;
  setOpenViewType: (viewType: ViewType | null) => void;
}

export default function CreateSimpleTableViewDialog(
  props: CreateSimpleTableViewProps,
) {
  const [name, setName] = useState<string>("");
  const [selectedFileId, setSelectedFileId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (fileId: number) => {
      return createSimpleTableView(props.projectId, { name, fileId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["views"],
        refetchType: "active",
      });
      toast("View created successfully");
    },
    onError: (error: Error) => {
      toast.error("Couldn't create a view", { description: error.message });
    },
  });

  const onSubmit = () => {
    if (!selectedFileId) {
      toast.error("Please select a file");
      return;
    }
    createMutation.mutate(selectedFileId);
    props.setOpenViewType(null);
  };

  return (
    <Dialog
      open={props.openViewType === ViewType.SIMPLE_TABLE}
      onOpenChange={(open) => {
        if (!open) {
          props.setOpenViewType(null);
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Simple Table View</DialogTitle>
        </DialogHeader>
        <CreateSimpleTableView
          availableFiles={props.availableFiles}
          setName={setName}
          onFileSelect={setSelectedFileId}
          onSubmit={onSubmit}
          name={name}
        />
      </DialogContent>
    </Dialog>
  );
}
