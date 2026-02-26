import { Badge } from "@/components/ui/badge";

interface TagBadgeProps {
  tag: string;
  variant?: "mood" | "style" | "type";
}

const variantStyles = {
  mood: "bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 border-0",
  style: "bg-teal-500/10 text-teal-300 hover:bg-teal-500/20 border-0",
  type: "bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border-0",
};

export function TagBadge({ tag, variant = "mood" }: TagBadgeProps) {
  return (
    <Badge className={`text-xs font-normal ${variantStyles[variant]}`}>
      {tag}
    </Badge>
  );
}
