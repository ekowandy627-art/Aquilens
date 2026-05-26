import { Button } from "@/components/ui/button";

type PrimaryButtonProps = {
  children: React.ReactNode;
};

export function PrimaryButton({ children }: PrimaryButtonProps) {
  return <Button type="button">{children}</Button>;
}
