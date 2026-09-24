import React from "react";

/**
 * OfferStackr Brand Mark - Custom Geometric Progressive "O"
 * 
 * Represents the continuous job-search pipeline advancing toward an offer:
 * - Foundational arc in Deep Violet / Electric Indigo (#7C3AED -> #6366F1)
 * - Progressive pipeline arc in Fresh Mint (#059669 -> #10B981 -> #34D399)
 * - Momentum Offer terminal node in Fresh Mint (#34D399)
 */
export default function OfferStackrLogo({
  size = 28,
  className = "",
  title = "OfferStackr"
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`offerstackr-logo ${className}`}
      aria-label={title}
      role="img"
    >
      <defs>
        {/* Deep Violet / Indigo Pipeline Gradient */}
        <linearGradient
          id="os-violet-flow"
          x1="4"
          y1="4"
          x2="20"
          y2="28"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#818CF8" />
          <stop offset="50%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#4F46E5" />
        </linearGradient>

        {/* Vivid Cyan / Teal Offer Progression Gradient */}
        <linearGradient
          id="os-cyan-flow"
          x1="12"
          y1="28"
          x2="28"
          y2="4"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#0891B2" />
          <stop offset="50%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#22D3EE" />
        </linearGradient>
      </defs>

      {/* FOUNDATIONAL PIPELINE ARC (Deep Violet / Indigo) */}
      <path
        d="M 20.5 6.5 C 16.2 4.2 10.5 4.8 6.8 8.5 C 2.8 12.5 2.8 19.5 6.8 23.5 C 10.2 26.9 15.5 27.5 19.8 25.5"
        stroke="url(#os-violet-flow)"
        strokeWidth="3.6"
        strokeLinecap="round"
      />

      {/* ASCENDING OFFER PROGRESSION ARC (Vivid Cyan / Teal) */}
      <path
        d="M 13.5 26.8 C 18.2 28.2 23.5 26.8 26.8 22.8 C 30.5 18.2 29.8 11.2 25.2 7.2 C 23.8 6.0 22.0 5.2 20.2 4.8"
        stroke="url(#os-cyan-flow)"
        strokeWidth="3.6"
        strokeLinecap="round"
      />

      {/* OFFER APEX MOMENTUM NODE (Vivid Cyan) */}
      <circle cx="20.5" cy="4.8" r="2.2" fill="#22D3EE" />
    </svg>
  );
}
