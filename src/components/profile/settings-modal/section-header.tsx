"use client";

interface SectionHeaderProps {
  title: string;
  description?: string;
}

export function SectionHeader({ title, description }: SectionHeaderProps) {
  return (
    <div className="mb-8">
      <h2 className="text-3xl font-extrabold tracking-tight text-foreground mb-2">
        {title}
      </h2>
      {description && (
        <p className="text-muted-foreground font-medium">{description}</p>
      )}
    </div>
  );
}
