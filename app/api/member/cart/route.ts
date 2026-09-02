import { NextRequest, NextResponse } from "next/server";

import { healthBoxFetch, numberValue, stringValue, type HealthBoxRecord } from "../../../_lib/health-box-api";
import { getMemberSession } from "../../../_lib/member-auth";
import { toCartErrorMessage } from "../_lib/cart-error";

function toCartItem(item: HealthBoxRecord) {
  const optionLabel = stringValue(item, "optionSummary", "skuName", "optionSummarySnapshot") || "없음";
  return {
    consumerPrice: Math.max(0, numberValue(item, "consumerPrice") || 0) || undefined,
    image: stringValue(item, "thumbnailUrl", "imageUrl"),
    optionLabel,
    productId: numberValue(item, "productId") || undefined,
    productSlug: stringValue(item, "productSlug", "slug"),
    productTitle: stringValue(item, "productTitle", "productName", "productNameSnapshot"),
    quantity: Math.max(1, numberValue(item, "quantity") || 0),
    skuId: numberValue(item, "skuId") || 0,
    unitPrice: Math.max(0, numberValue(item, "unitPrice", "priceSnapshot", "memberPrice") || 0),
  };
}

async function requireSession() {
  const session = await getMemberSession();
  if (!session?.memberId || session.dealerMallId == null || !session.sessionToken) {
    return null;
  }
  return session;
}

export async function GET() {
  try {
    const session = await requireSession();
    if (!session) {
      return NextResponse.json({ items: [], ok: false, message: "로그인이 필요합니다." }, { status: 401 });
    }

    const items = await healthBoxFetch<HealthBoxRecord[]>(`/health-box/public/buyer-members/${session.memberId}/cart`, {
      query: {
        dealerMallId: session.dealerMallId,
        sessionToken: session.sessionToken,
      },
    });

    return NextResponse.json({ items: items.map(toCartItem), ok: true });
  } catch (error) {
    console.error("[member-cart] GET failed", error);
    return NextResponse.json(
      {
        items: [],
        ok: false,
        message: toCartErrorMessage(error, "장바구니를 불러오지 못했습니다."),
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireSession();
    if (!session) {
      return NextResponse.json({ items: [], ok: false, message: "로그인이 필요합니다." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const productId = Number(body.productId || 0);
    const skuId = Number(body.skuId || 0);
    const quantity = Number(body.quantity || 0);

    if (!skuId) {
      return NextResponse.json({ items: [], ok: false, message: "상품 옵션을 확인할 수 없습니다." }, { status: 400 });
    }

    const items = await healthBoxFetch<HealthBoxRecord[]>(`/health-box/public/buyer-members/${session.memberId}/cart/items`, {
      method: "PUT",
      body: {
        buyerMemberId: session.memberId,
        dealerMallId: session.dealerMallId,
        sessionToken: session.sessionToken,
        productId: productId || undefined,
        skuId,
        quantity: Math.max(0, Math.min(99, quantity)),
      },
    });

    return NextResponse.json({ items: items.map(toCartItem), ok: true });
  } catch (error) {
    console.error("[member-cart] PUT failed", error);
    return NextResponse.json(
      {
        items: [],
        ok: false,
        message: toCartErrorMessage(error, "장바구니에 담지 못했습니다."),
      },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  try {
    const session = await requireSession();
    if (!session) {
      return NextResponse.json({ ok: false, message: "로그인이 필요합니다." }, { status: 401 });
    }

    await healthBoxFetch(`/health-box/public/buyer-members/${session.memberId}/cart`, {
      method: "DELETE",
      query: {
        dealerMallId: session.dealerMallId,
        sessionToken: session.sessionToken,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[member-cart] DELETE failed", error);
    return NextResponse.json(
      {
        ok: false,
        message: toCartErrorMessage(error, "장바구니를 비우지 못했습니다."),
      },
      { status: 500 },
    );
  }
}
