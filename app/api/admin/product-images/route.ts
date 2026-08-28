import { NextRequest, NextResponse } from "next/server";

import { getAdminSession } from "../../../_lib/admin-auth";
import { healthBoxInternalHeaders } from "../../../_lib/health-box-api";
import {
  MAX_IMAGE_FILE_COUNT,
  MAX_IMAGE_FILE_SIZE,
  MAX_IMAGE_FILE_SIZE_MB,
} from "@/lib/image-upload-limits";

type UploadedFileResponse = {
  fileDownloadUri?: string;
  fileName?: string;
  fileType?: string;
  size?: number;
};

function getUploadBaseUrl() {
  const explicitBaseUrl = process.env.HEALTH_BOX_UPLOAD_API_BASE_URL?.trim();
  if (explicitBaseUrl) {
    return explicitBaseUrl.replace(/\/+$/, "");
  }

  const healthBoxBaseUrl = process.env.HEALTH_BOX_API_BASE_URL?.trim();
  if (healthBoxBaseUrl) {
    return healthBoxBaseUrl.replace(/\/+$/, "");
  }

  throw new Error("HEALTH_BOX_UPLOAD_API_BASE_URL or HEALTH_BOX_API_BASE_URL is required");
}

function getCdnBaseUrl() {
  const explicitBaseUrl = process.env.HEALTH_BOX_CDN_BASE_URL?.trim();
  return explicitBaseUrl?.replace(/\/+$/, "") || new URL(getUploadBaseUrl()).origin;
}

async function isAdminRequest() {
  const session = await getAdminSession();
  return Boolean(session?.scopeType === "HQ" && session.permissionCodes.includes("PRODUCT_MANAGE"));
}

async function parseUploadResponse(response: Response) {
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof payload === "string" ? payload : JSON.stringify(payload);
    throw new Error(`Upload API ${response.status}: ${message || response.statusText}`);
  }

  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const record = payload as Record<string, unknown>;
    const wrappedPayload = record.data || record.result || record.payload;

    if (Array.isArray(wrappedPayload)) {
      return wrappedPayload as UploadedFileResponse[];
    }

    if (wrappedPayload && typeof wrappedPayload === "object") {
      return [wrappedPayload as UploadedFileResponse];
    }
  }

  return Array.isArray(payload) ? (payload as UploadedFileResponse[]) : [payload as UploadedFileResponse];
}

function normalizeUploadedFiles(files: UploadedFileResponse[], cdnBaseUrl: string) {
  return files.map((file) => {
    if (!file.fileDownloadUri) {
      return file;
    }

    const trimmed = file.fileDownloadUri.trim();
    try {
      const baseUrl = new URL(cdnBaseUrl);
      const uploadedUrl = /^https?:\/\//i.test(trimmed)
        ? new URL(trimmed)
        : trimmed.startsWith("//")
          ? new URL(`${baseUrl.protocol}${trimmed}`)
          : new URL(trimmed.replace(/^\/?/, "/"), baseUrl);

      if (uploadedUrl.hostname.toLowerCase() === baseUrl.hostname.toLowerCase()) {
        uploadedUrl.protocol = baseUrl.protocol;
        uploadedUrl.host = baseUrl.host;
      }

      return {
        ...file,
        fileDownloadUri: uploadedUrl.toString(),
      };
    } catch {
      return file;
    }
  });
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const incomingFormData = await request.formData();
    const files = incomingFormData
      .getAll("files")
      .filter((value): value is File => value instanceof File && value.size > 0);

    if (!files.length) {
      return NextResponse.json({ message: "No image file selected." }, { status: 400 });
    }

    if (files.length > MAX_IMAGE_FILE_COUNT) {
      return NextResponse.json(
        { message: `이미지는 한 번에 최대 ${MAX_IMAGE_FILE_COUNT}개까지 업로드할 수 있습니다.` },
        { status: 400 },
      );
    }

    const invalidType = files.find((file) => !file.type.startsWith("image/"));
    if (invalidType) {
      return NextResponse.json(
        { message: `${invalidType.name} 파일은 지원하는 이미지 형식이 아닙니다.` },
        { status: 400 },
      );
    }

    const oversizedFile = files.find((file) => file.size > MAX_IMAGE_FILE_SIZE);
    if (oversizedFile) {
      return NextResponse.json(
        { message: `${oversizedFile.name} 파일은 ${MAX_IMAGE_FILE_SIZE_MB}MB를 초과합니다.` },
        { status: 413 },
      );
    }

    const uploadBaseUrl = getUploadBaseUrl();
    const cdnBaseUrl = getCdnBaseUrl();
    const outboundFormData = new FormData();
    for (const file of files) {
      outboundFormData.append("files", file);
    }

    const response = await fetch(`${uploadBaseUrl}/health-box/admin/files`, {
      method: "POST",
      headers: healthBoxInternalHeaders(),
      body: outboundFormData,
    });

    const uploaded = normalizeUploadedFiles(await parseUploadResponse(response), cdnBaseUrl);
    return NextResponse.json({ files: uploaded });
  } catch (error) {
    console.error("[api/admin/product-images] upload failed", error);
    return NextResponse.json(
      {
        message: "Image upload failed.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
