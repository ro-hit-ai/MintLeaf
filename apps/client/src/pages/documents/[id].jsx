import React from 'react';
import dynamic from 'next/dynamic';

import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

const Editor = dynamic(() => import("../../components/NotebookEditor"), {
  ssr: false,
});

function Notebooks() {
  return (
    <div>
      <Editor />
    </div>
  );
}

export default Notebooks;