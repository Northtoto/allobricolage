import { useEffect } from "react";

interface OrganizationData {
  name: string;
  url: string;
  logo: string;
  description: string;
  sameAs?: string[];
  telephone?: string;
  email?: string;
  address?: {
    streetAddress: string;
    addressLocality: string;
    addressCountry: string;
  };
}

export function OrganizationSchema(data: OrganizationData): null {
  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: data.name,
      url: data.url,
      logo: data.logo,
      description: data.description,
      sameAs: data.sameAs ?? [],
      telephone: data.telephone,
      email: data.email,
      address: data.address
        ? {
            "@type": "PostalAddress",
            ...data.address,
          }
        : undefined,
    };

    const existing = document.getElementById("schema-org");
    if (existing) existing.remove();

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "schema-org";
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      const el = document.getElementById("schema-org");
      if (el) el.remove();
    };
  }, [data]);

  return null;
}

interface ServiceData {
  name: string;
  description: string;
  provider: string;
  url: string;
  areaServed?: string[];
  serviceType?: string;
}

export function ServiceSchema(data: ServiceData): null {
  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "Service",
      name: data.name,
      description: data.description,
      provider: {
        "@type": "Organization",
        name: data.provider,
      },
      url: data.url,
      areaServed: data.areaServed?.map((city) => ({
        "@type": "City",
        name: city,
        address: { "@type": "PostalAddress", addressCountry: "MA", addressLocality: city },
      })),
      serviceType: data.serviceType,
    };

    const existing = document.getElementById("schema-service");
    if (existing) existing.remove();

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "schema-service";
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      const el = document.getElementById("schema-service");
      if (el) el.remove();
    };
  }, [data]);

  return null;
}

interface LocalBusinessData {
  name: string;
  description: string;
  url: string;
  telephone: string;
  email: string;
  address: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  geo?: { latitude: string; longitude: string };
  openingHours?: string[];
  priceRange?: string;
  image?: string;
}

export function LocalBusinessSchema(data: LocalBusinessData): null {
  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: data.name,
      description: data.description,
      url: data.url,
      telephone: data.telephone,
      email: data.email,
      address: {
        "@type": "PostalAddress",
        ...data.address,
      },
      geo: data.geo
        ? {
            "@type": "GeoCoordinates",
            latitude: data.geo.latitude,
            longitude: data.geo.longitude,
          }
        : undefined,
      openingHoursSpecification: data.openingHours?.map((hours) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: hours.split(" ")[0],
        opens: hours.split(" ")[1]?.split("-")[0],
        closes: hours.split(" ")[1]?.split("-")[1],
      })),
      priceRange: data.priceRange,
      image: data.image,
    };

    const existing = document.getElementById("schema-local");
    if (existing) existing.remove();

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "schema-local";
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      const el = document.getElementById("schema-local");
      if (el) el.remove();
    };
  }, [data]);

  return null;
}

export function WebsiteSearchSchema({ siteUrl, searchUrl }: { siteUrl: string; searchUrl: string }): null {
  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      url: siteUrl,
      potentialAction: {
        "@type": "SearchAction",
        target: `${searchUrl}?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    };

    const existing = document.getElementById("schema-website");
    if (existing) existing.remove();

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "schema-website";
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      const el = document.getElementById("schema-website");
      if (el) el.remove();
    };
  }, [siteUrl, searchUrl]);

  return null;
}
