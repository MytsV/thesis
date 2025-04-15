import { Button } from "@/components/ui/button";

export interface LandingProps {
  onLogin: () => void;
  onRegister: () => void;
}

function LandingTitle() {
  return (
    <>
      <div className="text-3xl">Collaborative</div>
      <div className="text-5xl font-medium">Data Science</div>
    </>
  );
}

export default function Landing(props: LandingProps) {
  return (
    <div className="flex grow flex-row h-full">
      <div className="hidden h-auto flex-1 md:flex flex-col items-center justify-center">
        <div>
          <LandingTitle />
        </div>
      </div>
      <div className="h-auto flex-1 flex flex-col items-center justify-center space-y-2">
        <div className="mb-4 block md:hidden">
          <LandingTitle />
        </div>
        <Button
          className="w-full max-w-64 cursor-pointer"
          onClick={props.onLogin}
        >
          Sign In
        </Button>
        <Button
          variant="outline"
          className="w-full max-w-64 cursor-pointer"
          onClick={props.onRegister}
        >
          Sign Up
        </Button>
      </div>
    </div>
  );
}
