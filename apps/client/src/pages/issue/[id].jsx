import React, { lazy, Suspense } from "react";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

// Dynamically import the TicketDetails component
const Editor = lazy(() => import("../../components/TicketDetails"));

export default function TicketByID() {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <Editor />
      </Suspense>
    </div>
  );
}