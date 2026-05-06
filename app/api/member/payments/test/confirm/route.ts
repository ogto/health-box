import { NextRequest, NextResponse } from "next/server";

function getTossTestSecretKey() {
  const secretKey = process.env.HEALTH_BOX_TOSS_TEST_SECRET_KEY?.trim() || "";

  if (!secretKey) {
    throw new Error("HEALTH_BOX_TOSS_TEST_SECRET_KEY is not configured");
  }

  if (!secretKey.startsWith("test_")) {
    throw new Error("Only Toss Payments test secret keys are allowed");
  }

  return secretKey;
}

function encodeAuthorization(secretKey: string) {
  return `Basic ${Buffer.from(`${secretKey}:`, "utf8").toString("base64")}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const paymentKey = String(body.paymentKey || "").trim();
    const orderId = String(body.orderId || "").trim();
    const amount = Number(body.amount || 0);

    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json(
        { ok: false, message: "결제 승인 정보가 없습니다." },
        { status: 400 },
      );
    }

    const tossResponse = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: {
        Authorization: encodeAuthorization(getTossTestSecretKey()),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
      cache: "no-store",
    });
    const payload = await tossResponse.json().catch(() => ({}));

    if (!tossResponse.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: String(payload?.message || "테스트 결제 승인에 실패했습니다."),
          detail: payload,
        },
        { status: tossResponse.status },
      );
    }

    return NextResponse.json({ ok: true, payment: payload });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        ok: false,
        message:
          message === "HEALTH_BOX_TOSS_TEST_SECRET_KEY is not configured"
            ? "테스트 결제 시크릿 키가 설정되지 않았습니다."
            : message,
      },
      { status: 500 },
    );
  }
}
