import { Button } from "@/components/ui/button";

type PrimaryButtonProps = {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
};

export function PrimaryButton({
  children,
  disabled,
  onClick,
  type = "button",
}: PrimaryButtonProps) {
  return (
    <Button type={type} disabled={disabled} onClick={onClick}>
      {children}
    </Button>
  );
}
