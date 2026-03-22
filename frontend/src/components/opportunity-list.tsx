import { Opportunity } from "@/lib/types";

import { OpportunityCard } from "./opportunity-card";

interface OpportunityListProps {
  opportunities: Opportunity[];
  selectedOpportunityId: string | null;
  onSelect: (opportunityId: string) => void;
}

export function OpportunityList({
  opportunities,
  selectedOpportunityId,
  onSelect,
}: OpportunityListProps) {
  return (
    <div className="space-y-3">
      {opportunities.map((opportunity) => (
        <OpportunityCard
          key={opportunity.id}
          opportunity={opportunity}
          selected={selectedOpportunityId === opportunity.id}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

