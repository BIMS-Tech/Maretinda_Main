import {
  Button,
  Container,
  Heading,
  StatusBadge,
  Table,
  Text,
  toast,
} from "@medusajs/ui";

import { useAlgolia, useSyncAlgolia } from "@hooks/api/algolia";

export const Algolia = () => {
  const { data: algolia, isError, isPending } = useAlgolia();
  const { mutateAsync: triggerSynchronization, isPending: syncing } = useSyncAlgolia();

  const handleTriggerSynchronization = async () => {
    try {
      await triggerSynchronization();
      toast.success("Synchronization started. Search results update within a few minutes.");
    } catch {
      toast.error("Synchronization couldn't start. Try again in a moment.");
    }
  };

  // The search plugin only loads when the server has Algolia keys
  if (isError) {
    return (
      <Container className="px-6 py-4">
        <Heading>Algolia Search Engine</Heading>
        <Text className="text-ui-fg-subtle mt-1" size="small">
          Search isn't set up on this server: it has no Algolia keys (ALGOLIA_APP_ID and ALGOLIA_API_KEY), so the
          storefront's search and category listings can't use it. Add the keys to the server's settings to turn it on.
        </Text>
      </Container>
    );
  }

  return (
    <Container>
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading>Algolia Search Engine</Heading>
          <Text className="text-ui-fg-subtle" size="small">
            Check Algolia Search Engine status
          </Text>
        </div>
        <Button onClick={handleTriggerSynchronization} isLoading={syncing} disabled={isPending}>
          Trigger Synchronization
        </Button>
      </div>

      <Table>
        <Table.Body>
          <Table.Row>
            <Table.Cell>Application ID</Table.Cell>
            <Table.Cell>{algolia?.appId}</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>ProductIndex</Table.Cell>
            <Table.Cell>
              {algolia?.productIndex ? (
                <StatusBadge color="green">Exists</StatusBadge>
              ) : (
                <StatusBadge color="red">Doesn&apos;t exist</StatusBadge>
              )}
            </Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>
    </Container>
  );
};
