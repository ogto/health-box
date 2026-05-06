import { NextRequest, NextResponse } from "next/server";

import { healthBoxFetch, type HealthBoxRecord } from "../../../_lib/health-box-api";
import { getMemberSession } from "../../../_lib/member-auth";

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
  if (/receiver|baseAddress|address/i.test(message)) {
    return "배송지 정보를 확인해주세요.";
  }
  if (/session|buyer member/i.test(message)) {
    return "로그인 정보가 만료되었습니다. 다시 로그인해주세요.";
  }
  return "배송지 처리 중 오류가 발생했습니다.";
}

export async function GET() {
  try {
    const session = await getMemberSession();
    if (!session?.memberId || session.dealerMallId == null || !session.sessionToken) {
      return NextResponse.json({ ok: false, message: "로그인이 필요합니다.", addresses: [] }, { status: 401 });
    }

    const addresses = await healthBoxFetch<HealthBoxRecord[]>(`/health-box/public/buyer-members/${session.memberId}/addresses`, {
      query: {
        dealerMallId: session.dealerMallId,
        sessionToken: session.sessionToken,
      },
    });

    return NextResponse.json({ ok: true, addresses });
  } catch (error) {
    console.error("[member-addresses] list failed", error);
    return NextResponse.json({ ok: false, message: friendlyError(error), addresses: [] }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getMemberSession();
    if (!session?.memberId || session.dealerMallId == null || !session.sessionToken) {
      return NextResponse.json({ ok: false, message: "로그인이 필요합니다." }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const payload = addressBody(body, session.sessionToken, session.dealerMallId);
    if (!payload.addressAlias || !payload.receiverName || !payload.receiverPhone || !payload.baseAddress) {
      return NextResponse.json({ ok: false, message: "별칭, 받는 분, 연락처, 주소를 입력해주세요." }, { status: 400 });
    }

    const address = await healthBoxFetch<HealthBoxRecord>(`/health-box/public/buyer-members/${session.memberId}/addresses`, {
      method: "POST",
      body: payload,
    });

    return NextResponse.json({ ok: true, address, message: "배송지를 저장했습니다." });
  } catch (error) {
    console.error("[member-addresses] create failed", error);
    return NextResponse.json({ ok: false, message: friendlyError(error) }, { status: 500 });
  }
}
