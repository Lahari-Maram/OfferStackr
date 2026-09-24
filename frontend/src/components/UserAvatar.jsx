import { useState, useEffect } from "react";
import { getFullMediaUrl } from "../api/axios";
import "../styles/avatar.css";

/**
 * Universal OfferStackr UserAvatar Component
 * Preserves the exact previous default avatar style:
 * - Blue/Purple gradient (linear-gradient(135deg, #2563eb, #8b5cf6))
 * - Bold white uppercase single initial
 * - Seamlessly displays uploaded profile photo when present
 */
export default function UserAvatar({
  src = null,
  name = "User",
  size = "md",
  className = "",
  alt,
  style = {},
}) {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  // Reset error state whenever src changes
  useEffect(() => {
    setImgError(false);
    setImgLoaded(false);
  }, [src]);

  const initial =
    name && typeof name === "string" && name.trim()
      ? name.trim().charAt(0).toUpperCase()
      : "U";

  const resolvedSrc = src ? getFullMediaUrl(src) : null;
  const hasValidImage = Boolean(resolvedSrc) && !imgError;
  const altText = alt || `${name || "User"}'s profile avatar`;

  const sizeClass = typeof size === "string" ? `avatar-${size}` : "";
  const customSizeStyle =
    typeof size === "number"
      ? { width: `${size}px`, height: `${size}px`, minWidth: `${size}px` }
      : {};

  return (
    <div
      className={`offerstackr-avatar ${sizeClass} ${className}`}
      style={{ ...customSizeStyle, ...style }}
      aria-label={altText}
    >
      {hasValidImage ? (
        <>
          {!imgLoaded && (
            <span className="avatar-initial-fallback">{initial}</span>
          )}
          <img
            src={resolvedSrc}
            alt={altText}
            className={`avatar-image ${imgLoaded ? "loaded" : "loading"}`}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
          />
        </>
      ) : (
        <span className="avatar-initial-fallback">{initial}</span>
      )}
    </div>
  );
}
