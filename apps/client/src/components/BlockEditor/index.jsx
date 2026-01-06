import React, { useEffect, useCallback } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";

export default function BlockEditor({ 
  setIssue, 
  initialContent = null,
  height = "500px",
  readOnly = false,
  className = ""
}) {
  const editor = useCreateBlockNote({
    initialContent: initialContent || [
      {
        type: "paragraph",
        content: "Start writing your note here...",
      },
    ],
  });

  // Memoized change handler to prevent unnecessary re-renders
  const handleUpdate = useCallback(() => {
    setIssue(editor.document);
  }, [editor, setIssue]);

  useEffect(() => {
    // Listen for updates
    editor.on("update", handleUpdate);

    // Emit initial content immediately
    handleUpdate();

    // Cleanup
    return () => {
      editor.off("update", handleUpdate);
    };
  }, [handleUpdate]);

  return (
    <div 
      className={`blocknote-editor-container ${className}`}
      style={{ height }}
    >
      <BlockNoteView
        editor={editor}
        editable={!readOnly}
        sideMenu={false}
      />
    </div>
  );
}