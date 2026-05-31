import { useEffect } from "react";

export interface PageMeta {
  title: string;
  description: string;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
  canonical?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown>;
}

export function HelmetMeta(meta: PageMeta): null {
  useEffect(() => {
    document.title = meta.title;

    setMetaTag("description", meta.description);
    setMetaTag("keywords", meta.keywords ?? "");

    setPropertyTag("og:title", meta.title);
    setPropertyTag("og:description", meta.description);
    setPropertyTag("og:type", meta.ogType ?? "website");
    if (meta.ogImage) {
      setPropertyTag("og:image", meta.ogImage);
    }

    setNameTag("twitter:title", meta.title);
    setNameTag("twitter:description", meta.description);
    if (meta.ogImage) {
      setNameTag("twitter:image", meta.ogImage);
    }

    if (meta.noindex) {
      setMetaTag("robots", "noindex, nofollow");
    } else {
      setMetaTag("robots", "index, follow");
    }

    const canonicalLink = document.querySelector<HTMLLinkElement>("link[rel='canonical']");
    if (meta.canonical) {
      if (canonicalLink) {
        canonicalLink.href = meta.canonical;
      } else {
        const link = document.createElement("link");
        link.rel = "canonical";
        link.href = meta.canonical;
        document.head.appendChild(link);
      }
    }

    if (meta.jsonLd) {
      const existing = document.getElementById("json-ld-script");
      if (existing) existing.remove();
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = "json-ld-script";
      script.textContent = JSON.stringify(meta.jsonLd);
      document.head.appendChild(script);
    }

    return () => {
      const existing = document.getElementById("json-ld-script");
      if (existing) existing.remove();
    };
  }, [meta]);

  return null;
}

function setMetaTag(name: string, content: string): void {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setPropertyTag(property: string, content: string): void {
  let el = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", property);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setNameTag(name: string, content: string): void {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}
