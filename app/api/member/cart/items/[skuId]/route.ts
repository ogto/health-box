import { NextResponse } from "next/server";

import { healthBoxFetch, numberValue, stringValue, type HealthBoxRecord } from "../../../../../_lib/health-box-api";
import { getMemberSession } from "../../../../../_lib/member-auth";
import { toCartErrorMessage } from "../../../_lib/cart-error";

function toCartItem(item: HealthBoxRecord) {
  return {
    image: stringValue(item, "thumbnailUrl", "imageUrl"),
    optionLabel: stringValue(item, "optionSummary", "skuName", "optionSummarySnapshot") || "없음",
    productId: numberValue(item, "productId") || undefined,
    productSlug: stringValue(item, "productSlug", "slug"),
    productTitle: stringValue(item, "productTitle", "productName", "productNameSnapshot"),
    quantity: Math.max(1, numberValue(item, "quantity") || 0),
    skuId: numberValue(item, "skuId") || 0,
    unitPrice: Math.max(0, numberValue(item, "unitPrice", "priceSnapshot", "memberPrice") || 0),
  };
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ skuId: string }> },
) {
  try {
    const session = await getMemberSession();
    if (!session?.memberId || session.dealerMallId == null || !session.sessionToken) {
      return NextResponse.json({ items: [], ok: false, message: "로그인이 필요합니다." }, { status: 401 });
    }

    const { skuId } = await params;
    const skuIdNumber = Number(skuId || 0);
    if (!skuIdNumber) {
      return NextResponse.json({ items: [], ok: false, message: "상품 옵션을 확인할 수 없습니다." }, { status: 400 });
    }

    const items = await healthBoxFetch<HealthBoxRecord[]>(
      `/health-box/public/buyer-members/${session.memberId}/cart/items/${skuIdNumber}`,
      {
        method: "DELETE",
        query: {
          dealerMallId: session.dealerMallId,
          sessionToken: session.sessionToken,
        },
      },
    );

    return NextResponse.json({ items: items.map(toCartItem), ok: true });
  } catch (error) {
    console.error("[member-cart-item] DELETE failed", error);
    return NextResponse.json(
      {
        items: [],
        ok: false,
        message: toCartErrorMessage(error, "장바구니 상품을 삭제하지 못했습니다."),
      },
      { status: 500 },
    );
  }
}
