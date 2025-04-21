import { Progress } from "@/components/ui/progress";

export interface CreateProjectProgressProps {
  value: number;
}

export default function CreateProjectProgress(
  props: CreateProjectProgressProps,
) {
  return (
    <div className="w-full h-full grow flex flex-col items-center justify-center space-y-3">
      <Progress value={props.value} className="w-full max-w-md" />
      <span className="text-sm text-primary">Creating the project...</span>
    </div>
  );
}
