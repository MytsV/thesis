import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { ColumnViewModel, FileViewModel } from "@/lib/types";
import { Button } from "@/components/ui/button";
import React from "react";

export interface CreateDiscreteColumnChartViewProps {
  name: string;
  setName: (name: string) => void;
  availableFiles: FileViewModel[];
  onFileSelect: (fileId: number) => void;
  availableColumns?: ColumnViewModel[];
  onColumnSelect: (columnId: number) => void;
  onSubmit: () => void;
}

export default function CreateDiscreteColumnChartView(
  props: CreateDiscreteColumnChartViewProps,
) {
  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    props.onSubmit();
  };

  return (
    <form className="flex flex-col space-y-4" onSubmit={onSubmit}>
      <Input
        placeholder="Name"
        value={props.name}
        onChange={(event) => props.setName(event.target.value)}
      />
      <Select onValueChange={(value) => props.onFileSelect(parseInt(value))}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a file" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>File</SelectLabel>
            {props.availableFiles.map((file) => (
              <SelectItem value={file.id.toString()} key={file.id}>
                {file.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {props.availableColumns && (
        <Select
          onValueChange={(value) => props.onColumnSelect(parseInt(value))}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a column" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Column</SelectLabel>
              {props.availableColumns.map((column) => (
                <SelectItem value={column.id.toString()} key={column.id}>
                  {column.columnName}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      )}
      <Button type="submit" className="w-full cursor-pointer">
        Create
      </Button>
    </form>
  );
}
