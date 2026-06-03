import { useEffect } from "react";

interface PageMetaOptions {
  title: string;
  description: string;
  keywords?: string;
  ogImage?: string;
  canonical?: string;
}

const BASE_TITLE = "M3allem";

export function usePageMeta(options: PageMetaOptions): void {
  useEffect(() => {
    const fullTitle = options.title.includes(BASE_TITLE)
      ? options.title
      : `${options.title} | ${BASE_TITLE}`;
    document.title = fullTitle;

    updateMeta("description", options.description);
    if (options.keywords) {
      updateMeta("keywords", options.keywords);
    }

    updateProperty("og:title", fullTitle);
    updateProperty("og:description", options.description);
    if (options.ogImage) {
      updateProperty("og:image", options.ogImage);
    }

    updateName("twitter:title", fullTitle);
    updateName("twitter:description", options.description);

    if (options.canonical) {
      let link = document.querySelector<HTMLLinkElement>("link[rel='canonical']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "canonical";
        document.head.appendChild(link);
      }
      link.href = options.canonical;
    }

    return () => {
      document.title = `${BASE_TITLE} - Artisan qualifie en 2 min au Maroc`;
    };
  }, [options.title, options.description, options.keywords, options.ogImage, options.canonical]);
}

function updateMeta(name: string, content: string): void {
  const el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (el) {
    el.content = content;
  }
}

function updateProperty(property: string, content: string): void {
  const el = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (el) {
    el.content = content;
  }
}

function updateName(name: string, content: string): void {
  const el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (el) {
    el.content = content;
  }
}
