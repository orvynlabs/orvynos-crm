import { getDocuments, getProjectsAndClients } from "./actions";
import { DocumentsClient } from "./documents-client";

export default async function DocumentsPage() {
  const [docsRes, depsRes] = await Promise.all([
    getDocuments(),
    getProjectsAndClients(),
  ]);

  return (
    <DocumentsClient
      initialDocuments={docsRes.data || []}
      projects={depsRes.data?.projects || []}
      clients={depsRes.data?.clients || []}
    />
  );
}
