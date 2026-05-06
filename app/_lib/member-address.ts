export type MemberAddress = {
  id: number;
  addressAlias?: string;
  buyerMemberId?: number;
  receiverName: string;
  receiverPhone: string;
  zipCode?: string;
  baseAddress: string;
  detailAddress?: string;
  defaultYn?: string;
};

export type MemberAddressPayload = {
  addressAlias: string;
  receiverName: string;
  receiverPhone: string;
  zipCode?: string;
  baseAddress: string;
  detailAddress?: string;
  defaultYn?: string;
};

export function addressAlias(address: Partial<Pick<MemberAddress, "addressAlias" | "receiverName">>) {
  return String(address.addressAlias || address.receiverName || "배송지");
}

export function addressLine(address: Pick<MemberAddress, "baseAddress" | "detailAddress" | "zipCode">) {
  return [address.zipCode ? `(${address.zipCode})` : "", address.baseAddress, address.detailAddress]
    .filter(Boolean)
    .join(" ");
}

export function isDefaultAddress(address: Pick<MemberAddress, "defaultYn">) {
  return String(address.defaultYn || "").toUpperCase() === "Y";
}
