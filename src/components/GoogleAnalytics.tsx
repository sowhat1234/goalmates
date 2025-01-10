'use client';

import Script from 'next/script';

export const GoogleAnalytics = () => {
  // Only include GA in production
  if (process.env.NODE_ENV !== 'production') {
    return null;
  }

  return (
    <>
      <Script
        strategy="lazyOnload" // Changed to lazyOnload to be less aggressive
        src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
        onError={() => {
          // Silently fail - GA is likely blocked by an ad blocker
          console.debug('Google Analytics blocked or failed to load');
        }}
      />
      <Script
        id="google-analytics"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            try {
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                page_path: window.location.pathname,
                transport_type: 'beacon'
              });
            } catch (e) {
              // Silently fail if GA is blocked
            }
          `,
        }}
      />
    </>
  );
}; 