import { useState, type ReactNode } from 'react';
import { ProveedorRanuraPanelLateral, RanuraPanelLateral } from '@/app/shell/PanelLateral';

export function ConRanuraPanelLateral({ children }: { readonly children: ReactNode }) {
  const [ranura, setRanura] = useState<HTMLElement | null>(null);
  return (
    <ProveedorRanuraPanelLateral ranura={ranura}>
      <main>{children}</main>
      <RanuraPanelLateral refRanura={setRanura} />
    </ProveedorRanuraPanelLateral>
  );
}
