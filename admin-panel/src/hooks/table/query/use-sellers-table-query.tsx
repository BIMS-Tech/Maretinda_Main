import { useQueryParams } from "../../../hooks/use-query-params";

export const useSellersTableQuery = ({ prefix, pageSize = 20 }: any) => {
  const queryObject = useQueryParams(
    ["offset", "q", "created_at", "status", "id", "order"],
    prefix
  );

  const { offset, created_at, status, q, order } = queryObject;

  const searchParams: any = {
    limit: pageSize,
    offset: offset ? Number(offset) : 0,
    created_at: created_at ? JSON.parse(created_at) : undefined,
    status: status?.split(","),
    q,
    fields: "id,email,name,created_at,status",
    order: order ? order : undefined,
  };

  return {
    searchParams,
    raw: queryObject,
  };
};
