import { NextRequest, NextResponse } from "next/server";

import { ADMIN_COOKIE_NAME, getAdminSessionToken } from "../../../_lib/admin-auth";

const DEFAULT_MEMBER_NO = "505";
const DEFAULT_UPLOAD_BASE_URL = "https://cloud.1472.ai:18443";
const DEFAULT_CDN_BASE_URL = "https://cdn.1472.ai";

type UploadedFileResponse = {
  fileDownloadUri?: string;
  fileName?: string;
  fileType?: string;
  size?: number;
};

function getUploadBaseUrl() {
  const explicitBaseUrl = process.env.FILE_UPLOAD_API_BASE_URL?.trim();
  if (explicitBaseUrl) {
    return explicitBaseUrl.replace(/\/+$/, "");
  }

  const healthBoxBaseUrl = process.env.HEALTH_BOX_API_BASE_URL?.trim();
  if (healthBoxBaseUrl) {
    try {
      return new URL(healthBoxBaseUrl).origin;
    } catch {
      return healthBoxBaseUrl.replace(/\/api\/v\d+\/?$/i, "").replace(/\/+$/, "");
    }
  }

  return DEFAULT_UPLOAD_BASE_URL;
}

function getCdnBaseUrl() {
  return process.env.FILE_CDN_BASE_URL?.trim().replace(/\/+$/, "") || DEFAULT_CDN_BASE_URL;
}

function isAdminRequest(request: NextRequest) {
  const token = getAdminSessionToken();
  return Boolean(token) && request.cookies.get(ADMIN_COOKIE_NAME)?.value === token;
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

    if (/^https?:\/\/cloud\.1472\.ai(?::\d+)?\/downloadFile\//i.test(file.fileDownloadUri)) {
      return {
        ...file,
        fileDownloadUri: file.fileDownloadUri.replace(/^https?:\/\/cloud\.1472\.ai(?::\d+)?\/downloadFile\//i, `${cdnBaseUrl}/`),
      };
    }

    if (/^https?:\/\//i.test(file.fileDownloadUri)) {
      return file;
    }

    return {
      ...file,
      fileDownloadUri: new URL(file.fileDownloadUri.replace(/^\/?/, "/"), cdnBaseUrl).toString(),
    };
  });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
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

    const uploadBaseUrl = getUploadBaseUrl();
    const cdnBaseUrl = getCdnBaseUrl();
    const fileType = "I";
    const ids = "S";
    const mberNo = DEFAULT_MEMBER_NO;

    if (files.length === 1) {
      const uploadUrl = new URL("/api/v1/uploadFile", uploadBaseUrl);
      uploadUrl.searchParams.set("fileType", fileType);
      uploadUrl.searchParams.set("ids", ids);
      uploadUrl.searchParams.set("mberNo", mberNo);

      const outboundFormData = new FormData();
      outboundFormData.set("file", files[0]);

      const response = await fetch(uploadUrl, {
        method: "POST",
        body: outboundFormData,
      });

      const uploaded = normalizeUploadedFiles(await parseUploadResponse(response), cdnBaseUrl);
      return NextResponse.json({ files: uploaded });
    }

    const outboundFormData = new FormData();
    outboundFormData.set("fileType", fileType);
    outboundFormData.set("ids", ids);
    outboundFormData.set("mberNo", mberNo);
    for (const file of files) {
      outboundFormData.append("files", file);
    }

    const response = await fetch(new URL("/api/v1/uploadFiles", uploadBaseUrl), {
      method: "POST",
      body: outboundFormData,
    });

    const uploaded = normalizeUploadedFiles(await parseUploadResponse(response), cdnBaseUrl);
    return NextResponse.json({ files: uploaded });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Image upload failed.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
