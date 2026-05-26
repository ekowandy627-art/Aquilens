type PageHeaderProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
};

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div>
        <h2 className="text-2xl font-semibold tracking-normal text-slate-950">
          {title}
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-text-muted">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}
