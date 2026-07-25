import { getGeneratorData } from "./actions";
import { GeneratorsClient } from "./generators-client";

export default async function GeneratorsPage() {
  const result = await getGeneratorData();

  const data = result.success && "data" in result
    ? result.data
    : { clients: [], leads: [], projects: [], proposals: [], invoices: [], agreements: [] };

  return (
    <GeneratorsClient
      clients={data.clients}
      leads={data.leads}
      projects={data.projects}
      initialProposals={data.proposals}
      initialInvoices={data.invoices}
      initialAgreements={data.agreements}
    />
  );
}
