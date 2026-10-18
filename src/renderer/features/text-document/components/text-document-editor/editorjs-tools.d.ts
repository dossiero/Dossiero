declare module "@editorjs/marker" {
  const Marker: import("@editorjs/editorjs").InlineToolConstructable;

  export default Marker;
}

declare module "@editorjs/attaches" {
  const AttachesTool: import("@editorjs/editorjs").BlockToolConstructable;

  export default AttachesTool;
}

declare module "@editorjs/embed" {
  const Embed: import("@editorjs/editorjs").BlockToolConstructable;

  export default Embed;
}
