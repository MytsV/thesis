import { Button } from "@/components/ui/button";

export interface CreateProjectSuccessProps {
  projectId: string;
  onDashboard: () => void;
  onProject: () => void;
}

export default function CreateProjectSuccess(props: CreateProjectSuccessProps) {
  return (
    <div className="w-full h-full grow flex flex-col items-center justify-center">
      <div className="flex flex-col w-max-lg justify-center space-y-3 text-center">
        <span>Successfully created project {props.projectId}</span>
        <Button className="w-full" onClick={props.onProject}>
          Go to project
        </Button>
        <Button
          className="w-full"
          variant="outline"
          onClick={props.onDashboard}
        >
          Back to dashboard
        </Button>
      </div>
    </div>
  );
}
