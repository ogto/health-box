"use client";

import { useState } from "react";

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: {
        oncomplete: (data: {
          address: string;
          addressType: string;
          bname: string;
          buildingName: string;
          roadAddress: string;
          userSelectedType: string;
          zonecode: string;
        }) => void;
      }) => { open: () => void };
    };
  }
}

const DAUM_POSTCODE_SCRIPT_URL = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";

let postcodeScriptPromise: Promise<void> | null = null;

function loadPostcodeScript() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("주소 검색을 실행할 수 없습니다."));
  }

  if (window.daum?.Postcode) {
    return Promise.resolve();
  }

  if (postcodeScriptPromise) {
    return postcodeScriptPromise;
  }

  postcodeScriptPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>("script[data-daum-postcode]");
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("주소 검색을 불러오지 못했습니다.")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = DAUM_POSTCODE_SCRIPT_URL;
    script.async = true;
    script.dataset.daumPostcode = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("주소 검색을 불러오지 못했습니다."));
    document.head.appendChild(script);
  });

  return postcodeScriptPromise;
}

function buildAddress(data: {
  address: string;
  addressType: string;
  bname: string;
  buildingName: string;
  roadAddress: string;
  userSelectedType: string;
}) {
  const baseAddress = data.userSelectedType === "R" ? data.roadAddress : data.address;
  const extras = [];

  if (data.addressType === "R" && data.bname) {
    extras.push(data.bname);
  }
  if (data.addressType === "R" && data.buildingName) {
    extras.push(data.buildingName);
  }

  return extras.length ? `${baseAddress} (${extras.join(", ")})` : baseAddress;
}

export function AddressSearchButton({
  onSelect,
}: {
  onSelect: (address: { baseAddress: string; zipCode: string }) => void;
}) {
  const [loading, setLoading] = useState(false);

  async function openAddressSearch() {
    setLoading(true);
    try {
      await loadPostcodeScript();
      const Postcode = window.daum?.Postcode;
      if (!Postcode) {
        throw new Error("주소 검색을 실행하지 못했습니다.");
      }

      new Postcode({
        oncomplete(data) {
          onSelect({
            zipCode: data.zonecode,
            baseAddress: buildAddress(data),
          });
        },
      }).open();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button className="address-search-button" disabled={loading} onClick={() => void openAddressSearch()} type="button">
      {loading ? "불러오는 중" : "주소 검색"}
    </button>
  );
}
