"use client";

import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";

interface Props {
  title: string;
  body: string;
  ctaLabel: string;
  onCta: () => void;
  icon?: string;
}

/**
 * Dark banner shown on /my-cells when the user also holds `leader` or `g12`.
 * Offers to "Continue as Leader" — i.e. jump to the leader cells surface.
 */
export function SwitchBanner({ title, body, ctaLabel, onCta, icon = "users" }: Props) {
  return (
    <div className="switch-banner">
      <div className="ico">
        <Icon name={icon} size={22} />
      </div>
      <div className="b-body">
        <h3>{title}</h3>
        <p>{body}</p>
      </div>
      <Button size="md" variant="secondary-light" iconAfter="arrow-right" onClick={onCta}>
        {ctaLabel}
      </Button>
    </div>
  );
}
