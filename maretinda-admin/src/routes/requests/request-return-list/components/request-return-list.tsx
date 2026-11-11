import { useState } from "react";

import { InformationCircle } from "@medusajs/icons";
import type { OrderDTO } from "@medusajs/types";
import { Button, Container, Drawer, Text } from "@medusajs/ui";

import { formatDate } from "@lib/date";

import type { AdminOrderReturnRequest } from "@custom-types/requests";

import { useOrder } from "@hooks/api";

import { ResolveReturnRequestPrompt } from "@routes/requests/common/components/resolve-return-request";

type Props = {
  request?: AdminOrderReturnRequest;
  open: boolean;
  close: () => void;
};

/** The buyer's name, or their email when their account has no name. */
export const customerName = (request: AdminOrderReturnRequest) => {
  const c: any = request.order?.customer
  const name = [c?.first_name, c?.last_name].filter(Boolean).join(" ")
  return name || c?.email || (request.order as any)?.email || "-"
}

export function ReturnRequestDetail({ request, open, close }: Props) {
  // Hooks first: the drawer is mounted before any request is picked
  const { order } = useOrder(request?.order?.id ?? "", undefined, { enabled: !!request?.order?.id });

  const [promptOpen, setPromptOpen] = useState(false);
  const [requestAccept, setRequestAccept] = useState(false);

  if (!request || !request.order?.id) {
    return null;
  }

  const handlePrompt = (_: string, accept: boolean) => {
    setRequestAccept(accept);
    setPromptOpen(true);
  };

  return (
    <Drawer open={open} onOpenChange={close}>
      <ResolveReturnRequestPrompt
        close={() => {
          setPromptOpen(false);
        }}
        open={promptOpen}
        id={request.id!}
        accept={requestAccept}
        onSuccess={() => {
          close();
        }}
      />
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>Order return request</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body className="flex max-w-full flex-1 flex-col overflow-y-auto">
          <fieldset>
            <legend className="mb-2">Order ID</legend>
            <Container>
              <Text>#{(request.order as any)?.display_id ?? request.order?.id}</Text>
            </Container>
          </fieldset>
          <fieldset className="mt-2">
            <legend className="mb-2">Customer</legend>
            <Container>
              <Text>{customerName(request)}</Text>
            </Container>
          </fieldset>
          <fieldset className="mt-2">
            <legend className="mb-2">Seller</legend>
            <Container>
              <Text>{request.seller?.name}</Text>
            </Container>
          </fieldset>
          <fieldset className="mt-2">
            <legend className="mb-2">Return request reason</legend>
            <Container>
              <Text>{request.customer_note}</Text>
            </Container>
          </fieldset>
          <fieldset className="mt-2">
            <legend className="mb-2">Seller's response</legend>
            <Container>
              <Text>{request.seller_reviewer_note || "-"}</Text>
            </Container>
          </fieldset>
          <fieldset className="mt-2">
            <legend className="mb-2">Items</legend>
            <Container>
              {request.line_items?.map((item) => {
                return (
                  <ItemRow
                    order={order!}
                    line_item_id={item.line_item_id!}
                    quantity={item.quantity!}
                    key={item.id}
                  />
                );
              })}
            </Container>
          </fieldset>
          <Container className="mt-4">
            <div className="flex items-center gap-2">
              <InformationCircle />
              <Text className="font-semibold">Request information</Text>
            </div>
            <Text>{`Submitted on ${formatDate(request.created_at)}`}</Text>
            <Text>{`Escalated on ${formatDate(request.seller_reviewer_date)}`}</Text>
            {request.admin_reviewer_id && (
              <Text>{`Reviewed on ${formatDate(request.admin_reviewer_date)}`}</Text>
            )}
            {request.admin_reviewer_note && (
              <Text>{`Reviewer note: ${request.admin_reviewer_note}`}</Text>
            )}
          </Container>
        </Drawer.Body>
        <Drawer.Footer>
          {request.status === "escalated" && (
              <>
                <Button
                  onClick={() => {
                    handlePrompt(request.id!, true);
                  }}
                >
                  Accept
                </Button>
                <Button
                  onClick={() => {
                    handlePrompt(request.id!, false);
                  }}
                  variant="danger"
                >
                  Reject
                </Button>
                <Button variant="secondary" onClick={close}>
                  Cancel
                </Button>
              </>
          )}
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  );
}

const ItemRow = ({
  order,
  line_item_id,
  quantity,
}: {
  order: OrderDTO;
  line_item_id: string;
  quantity: number;
}) => {
  const item = order?.items?.find((i) => i.id === line_item_id);

  return (
    <>
      <Text>
        {`${quantity}x ${item?.product_title} ${item?.variant_title || "-"}`}
      </Text>
    </>
  );
};
