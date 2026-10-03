"use client";

import messages from "../../messages/fr.json";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="fr">
      <body>
        <div role="alert">
          <p>{messages.errors.generic}</p>
          <button type="button" onClick={reset}>
            {messages.errors.retry}
          </button>
        </div>
      </body>
    </html>
  );
}
