import { useEffect } from 'react';
import { siteConfig } from '@/config/site';

interface SeoProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  path?: string;
  type?: 'website' | 'article' | 'product';
  noIndex?: boolean;
  schema?: Record<string, unknown> | Record<string, unknown>[];
}

const ensureMeta = (selector: string, attribute: 'name' | 'property', value: string) => {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, value);
    document.head.appendChild(element);
  }
  return element;
};

const ensureLink = (rel: string) => {
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }
  return element;
};

export default function Seo({
  title,
  description,
  keywords,
  image,
  path,
  type = 'website',
  noIndex = false,
  schema,
}: SeoProps) {
  useEffect(() => {
    const resolvedTitle = title ? `${title} | ${siteConfig.name}` : siteConfig.defaultTitle;
    const resolvedDescription = description || siteConfig.defaultDescription;
    const resolvedKeywords = (keywords?.length ? keywords : siteConfig.defaultKeywords).join(', ');
    const resolvedImage = image || siteConfig.defaultImage;
    const resolvedUrl = new URL(path || window.location.pathname, siteConfig.url).toString();

    document.title = resolvedTitle;

    ensureMeta('meta[name="description"]', 'name', 'description').setAttribute('content', resolvedDescription);
    ensureMeta('meta[name="keywords"]', 'name', 'keywords').setAttribute('content', resolvedKeywords);
    ensureMeta('meta[name="robots"]', 'name', 'robots').setAttribute('content', noIndex ? 'noindex,nofollow' : 'index,follow');

    ensureMeta('meta[property="og:title"]', 'property', 'og:title').setAttribute('content', resolvedTitle);
    ensureMeta('meta[property="og:description"]', 'property', 'og:description').setAttribute('content', resolvedDescription);
    ensureMeta('meta[property="og:type"]', 'property', 'og:type').setAttribute('content', type);
    ensureMeta('meta[property="og:url"]', 'property', 'og:url').setAttribute('content', resolvedUrl);
    ensureMeta('meta[property="og:image"]', 'property', 'og:image').setAttribute('content', resolvedImage);
    ensureMeta('meta[property="og:site_name"]', 'property', 'og:site_name').setAttribute('content', siteConfig.name);

    ensureMeta('meta[name="twitter:card"]', 'name', 'twitter:card').setAttribute('content', 'summary_large_image');
    ensureMeta('meta[name="twitter:title"]', 'name', 'twitter:title').setAttribute('content', resolvedTitle);
    ensureMeta('meta[name="twitter:description"]', 'name', 'twitter:description').setAttribute('content', resolvedDescription);
    ensureMeta('meta[name="twitter:image"]', 'name', 'twitter:image').setAttribute('content', resolvedImage);

    ensureLink('canonical').setAttribute('href', resolvedUrl);

    const previousSchema = document.getElementById('seo-structured-data');
    if (previousSchema) previousSchema.remove();

    if (schema) {
      const script = document.createElement('script');
      script.id = 'seo-structured-data';
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    }
  }, [description, image, keywords, noIndex, path, schema, title, type]);

  return null;
}
