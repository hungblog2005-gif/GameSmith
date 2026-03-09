import { Helmet } from "react-helmet-async"

const SITE_NAME = "GameSmith"
const DEFAULT_DESCRIPTION =
  "GameSmith – Premium marketplace for high-quality game assets. Browse 3D models, textures, audio, UI kits, VFX, and more for your game projects."
const SITE_URL = import.meta.env.VITE_SITE_URL || ""

/**
 * Reusable per-page SEO head.
 *
 * Props:
 *  title        – Page title (appended with " | GameSmith")
 *  description  – Meta description (≤160 chars recommended)
 *  canonical    – Relative path, e.g. "/product/abc123"
 *  ogImage      – Absolute URL or relative path to OG image
 *  ogType       – Open Graph type (default "website")
 *  noindex      – Set true for private/auth-required pages
 *  schema       – Plain JS object for JSON-LD structured data (or array of objects)
 */
export default function SEOHead({
  title,
  description = DEFAULT_DESCRIPTION,
  canonical,
  ogImage = "/assets/logo.png",
  ogType = "website",
  noindex = false,
  schema = null,
}) {
  const fullTitle = title
    ? `${title} | ${SITE_NAME}`
    : `${SITE_NAME} – Premium Game Assets Marketplace`

  const canonicalUrl = canonical ? `${SITE_URL}${canonical}` : null

  const resolvedOgImage = ogImage?.startsWith("http")
    ? ogImage
    : `${SITE_URL}${ogImage}`

  const schemaJson = schema ? JSON.stringify(schema) : null

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Open Graph */}
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={resolvedOgImage} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={resolvedOgImage} />

      {/* JSON-LD structured data */}
      {schemaJson && (
        <script type="application/ld+json">{schemaJson}</script>
      )}
    </Helmet>
  )
}
