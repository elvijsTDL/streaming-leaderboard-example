import { EventsCard } from "../events-card";

export function EventsPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <EventsCard className="lg:col-span-2" />
    </div>
  );
}
