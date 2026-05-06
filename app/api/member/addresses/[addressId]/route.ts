import { NextRequest, NextResponse } from "next/server";

import { healthBoxFetch, type HealthBoxRecord } from "../../../../_lib/health-box-api";
import { getMemberSession } from "../../../../_lib/member-auth";

function normalizePhone(value: unknown) {
  return String(value || "").replace(/[^0-9]/g, "");
}

function addressBody(body: Record<string, unknown>, sessionToken: string, dealerMallId: number) {
  return {
    dealerMallId,
    sessionToken,
    addressAlias: String(body.addressAlias || "").trim(),
    receiverName: String(body.receiverName || "").trim(),
    receiverPhone: normalizePhone(body.receiverPhone),
    zipCode: String(body.zipCode || "").trim(),
    baseAddress: String(body.baseAddress || "").trim(),
    detailAddress: String(body.detailAddress || "").trim(),
    defaultYn: String(body.defaultYn || "").toUpperCase() === "Y" ? "Y" : "N",
  };
}

function friendlyError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (/not found/i.test(message)) {
    return "배송지를 찾을 수 없습니다.";
  }
  if (/session|buyer member/i.test(message)) {
    return "로그인 정보가 만료되었습니다. 다시 로그인해주세요.";
  }
  return "배송지 처리 중 오류가 발생했습니다.";
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ addressId: string }> },
) {
  try {
    const [{ addressId }, session] = await Promise.all([params, getMemberSession()]);
    if (!session?.memberId || session.dealerMallId == null || !session.sessionToken) {
      return NextResponse.json({ ok: false, message: "로그인이 필요합니다." }, { status: 401 });
    }

    const numericAddressId = Number(addressId || 0);
    if (!numericAddressId) {
      return NextResponse.json({ ok: false, message: "배송지를 찾을 수 없습니다." }, { status: 404 });
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const payload = addressBody(body, session.sessionToken, session.dealerMallId);
    if (!payload.addressAlias || !payload.receiverName || !payload.receiverPhone || !payload.baseAddress) {
      return NextResponse.json({ ok: false, message: "별칭, 받는 분, 연락처, 주소를 입력해주세요." }, { status: 400 });
    }

    const address = await healthBoxFetch<HealthBoxRecord>(
      `/health-box/public/buyer-members/${session.memberId}/addresses/${numericAddressId}`,
      {
        method: "PUT",
        body: payload,
      },
    );

    return NextResponse.json({ ok: true, address, message: "배송지를 수정했습니다." });
  } catch (error) {
    console.error("[member-addresses] update failed", error);
    return NextResponse.json({ ok: false, message: friendlyError(error) }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ addressId: string }> },
) {
  try {
    const [{ addressId }, session] = await Promise.all([params, getMemberSession()]);
    if (!session?.memberId || session.dealerMallId == null || !session.sessionToken) {
      return NextResponse.json({ ok: false, message: "로그인이 필요합니다." }, { status: 401 });
    }

    const numericAddressId = Number(addressId || 0);
    if (!numericAddressId) {
      return NextResponse.json({ ok: false, message: "배송지를 찾을 수 없습니다." }, { status: 404 });
    }

    await healthBoxFetch(`/health-box/public/buyer-members/${session.memberId}/addresses/${numericAddressId}`, {
      method: "DELETE",
      query: {
        dealerMallId: session.dealerMallId,
        sessionToken: session.sessionToken,
      },
    });

    return NextResponse.json({ ok: true, message: "배송지를 삭제했습니다." });
  } catch (error) {
    console.error("[member-addresses] delete failed", error);
    return NextResponse.json({ ok: false, message: friendlyError(error) }, { status: 500 });
  }
}
