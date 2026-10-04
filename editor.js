(() => {
  const plate = document.getElementById("plate");
  const status = document.getElementById("plate-status");
  const img = document.getElementById("template");
  const caption = document.getElementById("caption");
  const text = document.getElementById("text");
  const size = document.getElementById("size");
  const sizeOut = document.getElementById("size-out");
  const download = document.getElementById("download");

  const DEFAULT_TEXT =
    "When I’m just trying to save my grades and mentee asks Jane Street mai intern kaise lagegi";
  const CAPTION_FONT =
    '"SF Pro Text", "SF Pro Display", "Helvetica Neue", Helvetica, Arial, sans-serif';
  const pos = { x: 50, y: 8 };
  let ready = false;

  function typedText() {
    return text.value.replace(/\r\n/g, "\n");
  }

  function captionText() {
    const typed = typedText();
    return typed.length === 0 ? DEFAULT_TEXT : typed.trimEnd();
  }

  function paintCaption() {
    caption.hidden = false;
    caption.textContent = captionText();
    const scale = img.clientWidth / (img.naturalWidth || 862);
    caption.style.fontSize = `${Number(size.value) * scale}px`;
    caption.style.left = `${pos.x}%`;
    caption.style.top = `${pos.y}%`;
    sizeOut.value = size.value;
    download.disabled = !ready;
  }

  function setPlate(state, message) {
    plate.dataset.state = state;
    status.textContent = message;
  }

  function wrapLines(ctx, raw, maxWidth) {
    const paragraphs = raw.split("\n");
    const lines = [];
    for (const paragraph of paragraphs) {
      if (paragraph === "") {
        lines.push("");
        continue;
      }
      const words = paragraph.split(/\s+/);
      let line = words[0] || "";
      for (let i = 1; i < words.length; i += 1) {
        const next = `${line} ${words[i]}`;
        if (ctx.measureText(next).width <= maxWidth) {
          line = next;
        } else {
          lines.push(line);
          line = words[i];
        }
      }
      lines.push(line);
    }
    return lines;
  }

  function exportPng() {
    const raw = captionText();
    if (!ready || !raw) return;

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    const fontPx = Number(size.value);
    ctx.font = `400 ${fontPx}px ${CAPTION_FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const maxWidth = canvas.width * 0.92;
    const lines = wrapLines(ctx, raw, maxWidth);
    const lineHeight = fontPx * 1.2;
    const cx = (pos.x / 100) * canvas.width;
    const cy = (pos.y / 100) * canvas.height;
    const startY = cy - ((lines.length - 1) * lineHeight) / 2;

    ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
    ctx.shadowBlur = 2;
    ctx.shadowOffsetY = 1;
    ctx.fillStyle = "#fff";
    lines.forEach((line, i) => {
      ctx.fillText(line, cx, startY + i * lineHeight, maxWidth);
    });

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "zipit.png";
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  img.addEventListener("load", () => {
    ready = true;
    setPlate("ready", "");
    paintCaption();
  });

  img.addEventListener("error", () => {
    ready = false;
    setPlate("error", "The strip did not load. Refresh the page.");
    download.disabled = true;
  });

  text.addEventListener("input", paintCaption);
  size.addEventListener("input", paintCaption);
  window.addEventListener("resize", paintCaption);
  download.addEventListener("click", exportPng);

  let drag = null;

  function beginDrag(clientX, clientY) {
    const box = plate.getBoundingClientRect();
    drag = {
      dx: clientX - box.left - (pos.x / 100) * box.width,
      dy: clientY - box.top - (pos.y / 100) * box.height,
    };
  }

  function moveDrag(clientX, clientY) {
    if (!drag) return;
    const box = plate.getBoundingClientRect();
    const x = ((clientX - box.left - drag.dx) / box.width) * 100;
    const y = ((clientY - box.top - drag.dy) / box.height) * 100;
    pos.x = Math.min(92, Math.max(8, x));
    pos.y = Math.min(94, Math.max(6, y));
    paintCaption();
  }

  const endDrag = () => {
    drag = null;
  };

  caption.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    try {
      caption.setPointerCapture(event.pointerId);
    } catch (_) {
      /* mouse-driven automation may not expose a capturable pointer */
    }
    beginDrag(event.clientX, event.clientY);
  });

  caption.addEventListener("mousedown", (event) => {
    beginDrag(event.clientX, event.clientY);
  });

  caption.addEventListener("pointermove", (event) => {
    moveDrag(event.clientX, event.clientY);
  });
  caption.addEventListener("pointerup", endDrag);
  caption.addEventListener("pointercancel", endDrag);

  window.addEventListener("mousemove", (event) => {
    moveDrag(event.clientX, event.clientY);
  });
  window.addEventListener("mouseup", endDrag);

  if (img.complete && img.naturalWidth) {
    ready = true;
    setPlate("ready", "");
  }

  paintCaption();
})();
