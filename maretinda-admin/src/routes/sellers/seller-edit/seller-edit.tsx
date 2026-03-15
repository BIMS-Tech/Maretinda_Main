import { useParams } from "react-router-dom";

import type { VendorSeller } from "@custom-types/seller";

import { RouteDrawer } from "@components/modals";

import { useSeller } from "@hooks/api/sellers";

import { SellerDetails } from "@routes/sellers/seller-details/components/seller-details";
import { SellerEditForm } from "@routes/sellers/seller-edit/components/seller-edit-form";

export const SellerEdit = () => {
  const params = useParams();

  const { data, isLoading } = useSeller(params.id!);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <SellerDetails />
      <RouteDrawer>
        <RouteDrawer.Header>
          <RouteDrawer.Title>Edit seller</RouteDrawer.Title>
        </RouteDrawer.Header>
        <RouteDrawer.Body>
          <SellerEditForm seller={data?.seller as unknown as VendorSeller} />
        </RouteDrawer.Body>
      </RouteDrawer>
    </>
  );
};
