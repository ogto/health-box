import "server-only";

import sanitizeHtml from "sanitize-html";

const COLOR_VALUE = /^(?:#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\)|hsla?\([\d\s.,%deg]+\)|transparent)$/i;

export function sanitizeRichHtml(value: string) {
  return sanitizeHtml(value, {
    allowedTags: [
      "a",
      "b",
      "blockquote",
      "br",
      "code",
      "div",
      "em",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "hr",
      "i",
      "img",
      "input",
      "label",
      "li",
      "mark",
      "ol",
      "p",
      "pre",
      "s",
      "span",
      "strike",
      "strong",
      "sub",
      "sup",
      "u",
      "ul",
    ],
    allowedAttributes: {
      "*": ["data-background-color", "data-checked", "data-color", "data-type"],
      a: ["href", "rel", "target", "title"],
      blockquote: ["style"],
      code: ["class"],
      div: ["style"],
      h1: ["style"],
      h2: ["style"],
      h3: ["style"],
      h4: ["style"],
      h5: ["style"],
      h6: ["style"],
      img: ["alt", "height", "loading", "src", "title", "width"],
      input: ["checked", "disabled", "type"],
      mark: ["style"],
      p: ["style"],
      span: ["style"],
    },
    allowedClasses: {
      code: [/^language-[a-z0-9_-]+$/i],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesAppliedToAttributes: ["href", "src"],
    allowProtocolRelative: false,
    allowedStyles: {
      "*": {
        "background-color": [COLOR_VALUE],
        color: [COLOR_VALUE],
        "text-align": [/^(?:left|right|center|justify)$/],
      },
    },
    transformTags: {
      a: (_tagName, attribs) => ({
        tagName: "a",
        attribs: {
          ...attribs,
          ...(attribs.target === "_blank" ? { rel: "noopener noreferrer" } : {}),
        },
      }),
      img: (_tagName, attribs) => ({
        tagName: "img",
        attribs: { ...attribs, loading: "lazy" },
      }),
      input: (_tagName, attribs) => ({
        tagName: "input",
        attribs: {
          ...attribs,
          disabled: "disabled",
          type: "checkbox",
        },
      }),
    },
  }).trim();
}
