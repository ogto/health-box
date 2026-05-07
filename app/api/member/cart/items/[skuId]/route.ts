import { NextResponse } from "next/server";

import { healthBoxFetch, numberValue, stringValue, type HealthBoxRecord } from "../../../../../_lib/health-box-api";
import { getMemberSession } from "../../../../../_lib/member-auth";

function extractErrorMessage(error: unknown) {
  const rawMessage = error instanceof Error ? error.message : String(error);
  return rawMessage
    .replace(/^HealthBox API \d+:\s*/, "")
    .replace(/^Error:\s*/, "")
    .trim();
}

function toCartErrorMessage(error: unknown) {
  const message = extractErrorMessage(error);
  let parsedMessage = message;

  try {
    const parsed = JSON.parse(message) as { error?: string; message?: string; path?: string; status?: number };
    if (parsed.status === 404 && parsed.path?.includes("/cart")) {
      return "장바구니 DB API가 아직 서버에 반영되지 않았습니다. 백엔드 배포 후 다시 이용해주세요.";
    }
    parsedMessage = parsed.message || parsed.error || message;
  } catch {
    parsedMessage = message;
  }

  if (/404|not found|\/cart/i.test(parsedMessage)) {
    return "장바구니 DB API가 아직 서버에 반영되지 않았습니다. 백엔드 배포 후 다시 이용해주세요.";
  }

  return parsedMessage || "장바구니 상품을 삭제하지 못했습니다.";
}

function toCartItem(item: HealthBoxRecord) {
  return {
    image: stringValue(item, "thumbnailUrl", "imageUrl"),
    optionLabel: stringValue(item, "optionSummary", "skuName", "optionSummarySnapshot") || "없음",
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
    return NextResponse.json(
      {
        items: [],
        ok: false,
        message: toCartErrorMessage(error),
      },
      { status: 500 },
    );
  }
}
